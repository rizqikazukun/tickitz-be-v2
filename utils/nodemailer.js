"use strict";
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_GMAIL,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = transporter;