import { Delivery } from "../../models/devlivery-person/delivery.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { generateOTP } from "../../libs/otp-generator.js";
import { sendOtp } from "../../utils/sendOtp.js";
import sendEmail from "../../utils/sendEmail.js";

export const registerDelivery = expressAsyncHandler(async (req, res) => {
  // Register a new delivery account
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ message: "Please provide all required fields" });
    }

    const existingEmail = await Delivery.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (password.length < 7) {
      return res
        .status(400)
        .json({ message: "Password must be at least 7 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const delivery = new Delivery({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // Generate OTP and set expiration time (5 minutes)
    const otp = generateOTP();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Save OTP and expiration time temporarily in the database
    delivery.otp = otp;
    delivery.otpExpiration = otpExpiration;

    //   Save delivery account to the database
    await delivery.save();

    // Send OTP email to the user
    const emailHtml = `<p>Your OTP code is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`;
    await sendOtp({
      to: delivery.email,
      subject: "Your OTP Code",
      html: emailHtml,
    });

    res.status(201).json({
      success: true,
      message: "Please check your email for the OTP code",
      deliveryId: delivery._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const loginDelivery = expressAsyncHandler(async (req, res) => {
  // Login a delivery account
  const { email, password } = req.body;

  // Check if delivery account exists
  const delivery = await Delivery.findOne({ email });

  if (!delivery) {
    res.status(404).json({ message: "User account not found" });
    return;
  }

  // Check if password is correct
  const isPasswordValid = await bcrypt.compare(password, delivery.password);

  if (!isPasswordValid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ id: delivery._id }, process.env.TOKEN, {
    expiresIn: "30d",
  });

  res.status(200).json({
    success: true,
    message: `Welcome back ${delivery.firstName}`,
    deliveryId: delivery._id,
  });
});

// verify OTP
export const verifyOTP = expressAsyncHandler(async (req, res) => {
  const { deliveryId, otp } = req.body;

  const user = await Delivery.findById(deliveryId);

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
    delivery: user._id,
  });
});

// Request new OTP
export const requestNewOTP = expressAsyncHandler(async (req, res) => {
  const { deliveryId } = req.body;

  const user = await Delivery.findById(deliveryId);

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

  res.status(200).json({ message: `New OTP sent to ${user.email}` });
});

export const forgottenPassword = expressAsyncHandler(async (req, res) => {
  // forgot password
  const { email } = req.body;

  const user = await Delivery.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Email not found" });
  }

  try {
    res.status(200).json({
      success: true,
      msg: "Email is VERIFIED successfully",
      deliveryId: user._id,
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export const resetPassword = expressAsyncHandler(async (req, res) => {
  // reset password

  const { deliveryId } = req.params;

  const { password } = req.body;

  const user = await Delivery.findById(deliveryId);

  if (!user) {
    throw new Error({ msg: "user not found" });
  }

  if (password.length < 7) {
    return res
      .status(400)
      .json({ message: "Password must be at least 7 characters long" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;

  await user.save();

  const msg = "You can login with your new password";

  await sendEmail({
    to: user.email,
    subject: `There ${user.firstName} ${user.lastName}, your Password was reset successful`,
    html: msg,
  });

  res.status(200).json({ msg: "Password successfully changed", success: true });
});

// get delivery person's details

export const getDeliveryPersonDetails = async (req, res) => {
  const { deliveryId } = req.params;
  try {
    const deliveryPerson = await Delivery.findById(deliveryId, "-password");
    res.status(200).json({ deliveryPerson, success: true });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "server error", error: error.message });
  }
};

// update delivery person profile

export const updateDeliveryPersonProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      photo,
      phoneNumber,
      address,
      vehicleType,
      bio,
      status,
    } = req.body;

    const { deliveryId } = req.params;

    // const photoImage =
    //   req.files && req.files.photo ? req.files.photo.tempFilePath : null;

    // // if (!photoImage) {
    // //   return res.status(400).json({
    // //     success: false,
    // //     message: "No photo file received. Please upload a photo.",
    // //   });
    // // }

    // let photoImgUrl = null;

    // // Upload photo to Cloudinary
    // const photoImg = await cloudinary.uploader.upload(photoImage, {
    //   folder: "food-ninja",
    //   use_filename: true,
    //   resource_type: "auto",
    // });

    // // Get the URL of the uploaded photo
    // photoImgUrl = photoImg.secure_url;

    // // Delete the temporary uploaded file after successful upload
    // fs.unlinkSync(photoImage);

    const updatedProfile = await Delivery.findByIdAndUpdate(
      deliveryId,
      {
        firstName,
        lastName,
        email,
        // photo: photoImgUrl,
        phoneNumber,
        address,
        vehicleType,
        bio,
        status,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "server error", error: error.message });
  }
};
