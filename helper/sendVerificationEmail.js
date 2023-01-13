const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const UserVerification = require('../models/UserVerification');
const verificationLinkExpirationDuration = 3600000;

const getOtp = () => {
    const max = 99999, min = 10000
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const sendVerificationEmail = async (reqUser, res, baseUrl) => {
    const { _id, email } = reqUser;
    // console.log(email);
    const uniqueString = uuidv4() + _id
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.APP_PASSWORD_YOUTUBE
            }
        });
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: email.toLowerCase(),
            subject: 'OTP verification for Kannect registration',
            html: `Click <a target="_blank" href=${baseUrl + "/api/users/verify/" + _id + "/" + uniqueString}>here</a> to verify for <b>Kannect</b> registration.`
        };
        // console.log(mailOptions);
        const salt = await bcrypt.genSalt(8);
        const hashedUniqueString = await bcrypt.hash(uniqueString, salt);
        const newUserVerification = new UserVerification({
            userId: _id,
            uniqueString: hashedUniqueString,
            createdAt: Date.now(),
            expiresAt: Date.now() + verificationLinkExpirationDuration, //one hour
        });

        await newUserVerification.save();

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                // console.log('Error occurred');
                // console.log(error.message);
                return res.json({isMailsent: false});
            } else {
                transporter.close();
                return res.json("Verification link sent.");
            }
        })
    } catch (error) {
        console("Something went wrong. Please check email or try again.");
    }
}

module.exports = { getOtp, sendVerificationEmail };