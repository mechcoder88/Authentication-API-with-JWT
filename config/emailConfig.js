import dotenv from 'dotenv'
dotenv.config();

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465 & false for other ports
    auth: {
        user: 'samir.shields@ethereal.email',
        pass: 'XvuzAmcKkqBtxCbu1w'
    }
});

export default transporter;