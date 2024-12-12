import expressAsyncHandler from "express-async-handler";
import nodemailer from "nodemailer";

const sendEmail = expressAsyncHandler(async (subject, message, send_to, send_from, reply_to) => {
    try {
        const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
            }
    })

    const options = {
        from: send_from,
        to: send_to,
        replyTo: reply_to,
        subject: subject,
        html: message
    }

    const info = await transporter.sendMail(options)
    console.log("Email sent: " + info.messageId)
    } catch (error) {
        console.log("Error sending email: " + error);
    }
})

export default sendEmail;