import { Delivery } from "../models/delivery.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { generateOTP } from "../libs/otp-generator.js";
import { sendOtp } from "../utils/sendOtp.js";

export const registerDelivery = expressAsyncHandler(async (req, res) => {
  // Register a new delivery account
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
