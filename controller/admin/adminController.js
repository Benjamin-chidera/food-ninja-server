import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { generateOTP } from "../../libs/otp-generator.js";
import { sendOtp } from "../../utils/sendOtp.js";
import { Admin } from "../../models/admin/admin.js";
import { Auth } from "../../models/user/auth.js";
import { Delivery } from "../../models/devlivery-person/delivery.js";

// sign up
export const adminSignUp = expressAsyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phoneNumber, location } =
    req.body;

  // Check if the required fields are provided
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      message: "Email, password, first name, last name",
    });
  }

  // Check if the email already exists in the database
  const existingUser = await Admin.findOne({ email });
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

  // Create a new user document
  const newUser = new Admin({
    email,
    password: hashedPassword,
    firstName,
    lastName,
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
      adminId: newUser._id,
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
export const adminSignIn = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const existingUser = await Admin.findOne({ email });

  if (!existingUser) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcryptjs.compare(password, existingUser.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  res
    .status(200)
    .json({ message: "Login successful", adminId: existingUser._id });
});

// update user details
export const adminUpdateDetails = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName } = req.body;

  const userDetails = {};

  if (firstName) {
    userDetails.firstName = firstName;
  }
  if (lastName) {
    userDetails.lastName = lastName;
  }

  const updatedUser = await Admin.findByIdAndUpdate(userId, userDetails, {
    new: true,
    runValidators: true,
  });

  res
    .status(200)
    .json({ success: true, message: "User details updated successfully" });
});

// verify OTP
export const verifyOTP = expressAsyncHandler(async (req, res) => {
  const { adminId, otp } = req.body;

  const user = await Admin.findById(adminId);

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
    adminId: user._id,
  });
});

// Request new OTP
export const requestNewOTP = expressAsyncHandler(async (req, res) => {
  const { adminId } = req.body;

  const user = await Admin.findById(adminId);

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

  const user = await Admin.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Email not found" });
  }

  try {
    res.status(200).json({
      success: true,
      msg: "Email is VERIFIED successfully",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export const resetPassword = expressAsyncHandler(async (req, res) => {
  // reset password

  const { adminId } = req.params;

  const { password } = req.body;

  const user = await Admin.findById(adminId);

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

  const msg = "You can logout and login with your new password";

  await sendEmail({
    to: user.email,
    subject: `There ${user.firstName} ${user.lastName}, your Password was reset successful`,
    html: msg,
  });

  res.status(200).json({ msg: "Password successfully changed", success: true });
});

// get all registered users

export const getAllUsers = expressAsyncHandler(async (req, res) => {
  try {
    const users = await Auth.find();

    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// this is for the delivery person
export const getAllDeliveryPerson = async (req, res) => {
  try {
    const deliveryPerson = await Delivery.find();
    res.status(200).json(deliveryPerson);
  } catch (error) {
    console.log(error);
  }
};

export const getDeliveryPersonDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryPerson = await Delivery.findById(id);
    res.status(200).json(deliveryPerson);
  } catch (error) {
    console.log(error);
  }
};

export const editDeliveryPersonData = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      vehicleType,
      vehicleNumber,
      city,
      state,
      country,
      status,
      rating,
    } = req.body;

    const deliveryPerson = await Delivery.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        vehicleType,
        vehicleNumber,
        city,
        state,
        country,
        status,
        rating,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, deliveryPerson });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// this is to add new delivery person
export const addNewDeliveryPerson = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, status } = req.body;

    const deliveryPerson = await Delivery.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      status,
    });

    res.status(200).json({ success: true, deliveryPerson });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
