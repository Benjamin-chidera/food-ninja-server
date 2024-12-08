import crypto from 'crypto';

// Generate a random 4-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString();
};
