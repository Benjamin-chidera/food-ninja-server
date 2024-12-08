import { Auth } from "../models/auth.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { generateOTP } from "../libs/otp-generator.js";
import { sendOtp } from "../utils/sendOtp.js";


// sign up
export const signUp = expressAsyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phoneNumber, location } = req.body;

  // Check if the required fields are provided
  if (!email || !password || !firstName || !lastName || !phoneNumber || !location) {
    return res.status(400).json({ message: "Email, password, first name, last name, phone number, and location are required" });
  }

  // Check if the email already exists in the database
  const existingUser = await Auth.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }

  // Hash the password
  const hashedPassword = await bcryptjs.hash(password, 10);

  // Handle the photo upload if it exists
  const photoImage = req.files && req.files.photo ? req.files.photo.tempFilePath : null;

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
    return res.status(500).json({ message: "Error uploading photo", error: error.message });
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

  

  res.status(200).json({ message: "Login successful", user: existingUser._id, });
});

// update user details
export const userBio = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, phoneNumber, location } = req.body;

  const userDetails = {};

  if (firstName) {
    userDetails.firstName = firstName;
  }
  if (lastName) {
    userDetails.lastName = lastName;
  }
  if (phoneNumber) {
    userDetails.phoneNumber = phoneNumber;
  }
  if (location) {
    userDetails.location = location;
  }

  const photoImage =
    req.files && req.files.photo ? req.files.photo.tempFilePath : null;

  if (!photoImage) {
  return res.status(400).json({
    success: false,
    message: "No photo file received",
  });
}

console.log('Photo path:', photoImage);

  if (photoImage) {
    try {
      const photoImg = await cloudinary.uploader.upload(photoImage, {
        folder: "food-ninja",
        use_filename: true,
        resource_type: "auto",
      });

      userDetails.photo = photoImg.secure_url;
      fs.unlinkSync(photoImage);
    } catch (error) {
      console.log(error);
      
      return res
        .status(500)
        .json({ success: false, message: "Failed to upload profile picture" });
       
    }
  }

  const updatedUser = await Auth.findByIdAndUpdate(userId, userDetails, {
    new: true,
    runValidators: true,
  });


  res
    .status(200)
    .json({ success: true, message: "User details updated successfully" });
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
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
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

  res.status(200).json({ message: "OTP verified successfully", success: true, user: user._id, });
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
    html: emailHtml
  });

  res.status(200).json({ message: "New OTP sent to email" });
});