const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require("../helper/sendVerificationEmail");
const baseUrl = process.env.BACKEND_BASE_URL || "BACKEND_BASE_URL";

const jwtExpirySeconds = 604800 // = 7 days
const jwtKey = process.env.JWT_SECTRET_KEY;

const getAuthToken = (user) => {
    return jwt.sign(
        { _id: user._id, username: user.username },
        jwtKey,
        { expiresIn: jwtExpirySeconds }
    );
}

// router.post('/getotp', async (req, res) => {
//     try {
//         const val = await sendOtp({ email: req.body.email });
//         conole.log("val = ", val);
//         if (val !== 0) {
//             return res.status(422).json({ error: "Invalid Email. Please Try again." });
//         } else {
//             res.status(200).json("Email has Been sent.")
//         }
//     } catch (error) {
//         // console.log("error 2");
//         res.status(500).json({ error: "Something went wrong. Please check your email and try again." });
//     }
// });

//register
router.post('/register', async (req, res) => {
    try {
        const userEmail = await User.findOne({ email: req.body.email.toLowerCase() });
        if (userEmail && userEmail.isVerified) {
            return res.status(409).json("User already exist with this email. Login or try different email.");
        }

        const ifUsernameUser = await User.findOne({ username: req.body.username });
        if (ifUsernameUser && userEmail.isVerified) {
            return res.status(410).json("User exist with this username. Try Different username.");
        }

        if (userEmail) {
            await User.deleteOne({ email: req.body.email.toLowerCase() });
        }
        if (ifUsernameUser) {
            await User.deleteOne({ username: req.body.username });
        }

        // email verification.

        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const newUser = new User({
            ...req.body,
            email: req.body.email.toLowerCase(),
            password: hashedPassword
        });
        // const accessToken = getAuthToken(newUser);

        await newUser.save();
        await sendVerificationEmail(newUser, res, baseUrl);
        res.status(200).json(`Verification link has been sent to ${newUser.email}.`)
        // res.status(200).json({ ...user._doc, token: accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
})

//LOGIN
router.post("/login", async (req, res) => {
    console.log("clicked");
    // console.log(req.body);
    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });
        if (!user) {
            return res.status(404).json("User not found. Try again!!");
        }
        if (user.isVerified === false) {
            res.status(403).json("User not verified. Go to your email and verify.");
        }
        bcrypt.compare(req.body.password, user.password, (err, data)=>{
            if (err) throw err
            if (data) {
                const accessToken = getAuthToken(user);
                return res.status(200).json({ ...user._doc, token: accessToken });
            } else {
                res.status(401).json("Invalid Credentials. Try again.");
            }
        });
        
        // const validPassword = bcrypt.compare(req.body.password, user.password);
        // if(!validPassword){
        //     res.status(400).json("Wrong credentials.");
        // }
        
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

module.exports = router;