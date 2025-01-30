import { Auth } from "../../models/user/auth.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { generateOTP } from "../../libs/otp-generator.js";
import { sendOtp } from "../../utils/sendOtp.js";
import sendEmail from "../../utils/sendEmail.js";

// sign up
export const signUp = expressAsyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    location,
    dateJoined,
  } = req.body;

  // Check if the required fields are provided
  if (
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    !phoneNumber ||
    !location
  ) {
    return res.status(400).json({
      message:
        "Email, password, first name, last name, phone number, and location are required",
    });
  }

  // Check if the email already exists in the database
  const existingUser = await Auth.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }

  if (password.length < 7) {
    return res
      .status(400)
      .json({ message: "Password must be at least 7 characters long" });
  }

  // Hash the password
  const hashedPassword = await bcryptjs.hash(password, 10);

  // Handle the photo upload if it exists
  const photoImage =
    req.files && req.files.photo ? req.files.photo.tempFilePath : null;

  if (!photoImage) {
    return res.status(400).json({
      success: false,
      message: "No photo file received. Please upload a photo.",
    });
  }

  let photoImgUrl = null;
  try {
    // Upload photo to Cloudinary
    const photoImg = await cloudinary.uploader.upload(photoImage, {
      folder: "food-ninja",
      use_filename: true,
      resource_type: "auto",
    });

    // Get the URL of the uploaded photo
    photoImgUrl = photoImg.secure_url;

    // Delete the temporary uploaded file after successful upload
    fs.unlinkSync(photoImage);
  } catch (error) {
    // If there's an error uploading the image, return a message
    return res
      .status(500)
      .json({ message: "Error uploading photo", error: error.message });
  }

  // Create a new user document
  const newUser = new Auth({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    location,
    photo: photoImgUrl,
    dateJoined, // Set the current date as the date joined
  });

  try {
    // Generate OTP and set expiration time (5 minutes)
    const otp = generateOTP();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Save OTP and expiration time temporarily in the database
    newUser.otp = otp;
    newUser.otpExpiration = otpExpiration;

    // Save the new user to the database
    await newUser.save();

    // Send OTP email to the user
    const emailHtml = `<p>Your OTP code is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`;
    await sendOtp({
      to: newUser.email,
      subject: "Your OTP Code",
      html: emailHtml,
    });

    // Respond with success message and user ID (do not send OTP in production)
    res.status(201).json({
      message: "Registration successful. OTP has been sent to your email.",
      success: true,
      user: newUser._id,
    });
  } catch (error) {
    // Handle any errors during user creation or OTP generation
    res.status(500).json({
      message: "Error occurred during registration",
      error: error.message,
    });
  }
});

// sign in
export const signIn = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const existingUser = await Auth.findOne({ email });

  if (!existingUser) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcryptjs.compare(password, existingUser.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  res.status(200).json({
    message: "Login successful",
    user: existingUser._id,
    success: true,
  });
});

// update user details
export const userBio = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, phoneNumber, location, email, password } =
    req.body;

  const existingUser = await Auth.findById(userId);
  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const userDetails = {};

  if (firstName) userDetails.firstName = firstName;
  if (lastName) userDetails.lastName = lastName;
  if (phoneNumber) userDetails.phoneNumber = phoneNumber;
  if (location) userDetails.location = location;
  if (email) userDetails.email = email;

  if (req.files && req.files.photo) {
    const photoImage = req.files.photo.tempFilePath;

    try {
      // Delete the existing photo from Cloudinary if it exists
      if (existingUser.photo) {
        const publicId = existingUser.photo.split("/").pop().split(".")[0]; // Extract public ID from the URL
        await cloudinary.uploader.destroy(`food-ninja/${publicId}`);
      }

      // Upload the new photo
      const photoImg = await cloudinary.uploader.upload(photoImage, {
        folder: "food-ninja",
        use_filename: true,
        resource_type: "auto",
      });

      userDetails.photo = photoImg.secure_url;
      fs.unlinkSync(photoImage);
    } catch (error) {
      console.error("Photo Upload Error:", error);
      return res
        .status(500)
        .json({ message: "Failed to upload profile picture" });
    }
  }

  if (password) {
    if (await bcryptjs.compare(password, existingUser.password)) {
      return res.status(400).json({
        message: "The new password cannot be the same as the old password",
      });
    }
    userDetails.password = await bcryptjs.hash(password, 10);
  }

  try {
    const updatedUser = await Auth.findByIdAndUpdate(userId, userDetails, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Failed to update user details" });
  }
});

export const getUser = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await Auth.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ success: true, user });
});

// verify OTP
export const verifyOTP = expressAsyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const user = await Auth.findById(userId);

  // console.log(user);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if OTP is expired
  if (user.otpExpiration < Date.now()) {
    return res
      .status(400)
      .json({ message: "OTP has expired. Please request a new one." });
  }

  // Check if entered OTP matches the stored OTP
  if (user.otp !== Number(otp)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // OTP is correct, delete OTP from the database
  user.otp = undefined;
  user.otpExpiration = undefined;
  await user.save();

  //  const token = jwt.sign({ userId: user._id }, process.env.TOKEN, {
  //   expiresIn: "1h",
  // });

  res.status(200).json({
    message: "OTP verified successfully",
    success: true,
    user: user._id,
  });
});

// Request new OTP
export const requestNewOTP = expressAsyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await Auth.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Generate a new OTP and set a new expiration time
  const otp = generateOTP();
  const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

  // Update OTP and expiration in the database
  user.otp = otp;
  user.otpExpiration = otpExpiration;
  await user.save();

  // Send new OTP to the user's email
  const emailHtml = `<p>Your new OTP code is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`;
  await sendOtp({
    to: user.email,
    subject: "Your New OTP Code",
    html: emailHtml,
  });

  res.status(200).json({ message: "New OTP sent to email" });
});

export const forgottenPassword = expressAsyncHandler(async (req, res) => {
  // forgot password
  const { email } = req.body;

  const user = await Auth.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Email not found" });
  }

  try {
    res.status(200).json({
      success: true,
      msg: "Email is VERIFIED successfully",
      user: user._id,
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export const resetPassword = expressAsyncHandler(async (req, res) => {
  // reset password

  const { userId } = req.params;

  const { password } = req.body;

  try {
    const user = await Auth.findById(userId);

    if (!user) {
      throw new Error({ msg: "user not found" });
    }

    if (password.length < 7) {
      return res
        .status(400)
        .json({ message: "Password must be at least 7 characters long" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    const msg = "You can login with your new password";

    await sendEmail({
      to: user.email,
      subject: `There ${user.firstName} ${user.lastName}, your Password was reset successful`,
      html: msg,
    });

    res
      .status(200)
      .json({ msg: "Password successfully changed", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

export const deleteUserAccount = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    const User = await Auth.findByIdAndDelete(userId);

    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the existing photo from Cloudinary if it exists
    if (User.photo) {
      const publicId = User.photo.split("/").pop().split(".")[0]; // Extract public ID from the URL
      await cloudinary.uploader.destroy(`food-ninja/${publicId}`);
    }

    res
      .status(200)
      .json({ message: "User account deleted successfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});
