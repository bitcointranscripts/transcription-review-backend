import nodemailer from "nodemailer";
require("dotenv").config();

export async function sendEmail(message: any, transcriptTitle?: string) {
  if (!process.env.RECEIVER_EMAILS) {
    throw new Error("RECEIVER_EMAILS is not set");
  }
  const time = new Date().toLocaleString();
  const emails = process.env.RECEIVER_EMAILS.split(",");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.GMAIL_APP_KEY,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL,
    to: emails.join(','),
    subject: "Transcript Queuer Alert",
    html: `<section style="background-color: ffffff; padding: 20px;">
             <h1 style="text-align: center;">New Queuer Action</h1>
             <p style="text-align: center;">Message: ${message}</p>
             <p style="text-align: center;">Transcript Title: ${transcriptTitle}</p>
             <p style="text-align: center;">Time: ${time}</p>
           </section>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Error sending email");
  }
}