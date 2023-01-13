const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const User = require('../models/User');
const router = require("express").Router();
const path = require("path");
const UserVerification = require("../models/UserVerification");
const front_url = process.env.FRONTEND_BASE_URL;
const jwtKey = process.env.JWT_SECTRET_KEY;

const verify = async (req, res, next) => {
    try{
        const token = req.body.token;
        jwt.verify(token, process.env.JWT_SECTRET_KEY);
        next();
    } catch(error){
        res.status(401).json(error);
    }
};

router.get("/contains/:text", async (req, res) => {
    try{
        let {text} = req.params;
        text = text.toLowerCase();
        const allUsers = await User.find({});
        let ans = [];
        allUsers.forEach(( u, idx) => {
            const usernameSearched = u.username.toString().toLowerCase();
            if(usernameSearched.includes(text)){
                const {_id, username, profilePicture} = u;
                ans.push({_id, username, profilePicture});
            }
        })
        
        res.status(200).json(ans);
    } catch(err){
        res.status(500).json(err);
    }
})

router.get("/verify/:userId/:uniqueString", async (req, res) => {
    const { userId, uniqueString } = req.params;
    try {
        const verifiedUser = await UserVerification.findOne({ userId });
        if (!verifiedUser) {
            res.status(404).json("No User registration exists for this email.");
            return false;
        }
        const user = await User.findOne({ _id: userId });
        if (!user) {
            res.status(404).json("User not found.");
            return false;
        }
        if (user.isVerified) {
            res.status(200).send("User already verified.");
            return true;
        }
        if (verifiedUser.expiresAt < Date.now()) {
            await UserVerification.deleteOne({ userId });
            await User.deleteOne({ _id: userId });
            return res.status(410).json("Link expired. Try again.");
        }
        bcrypt.compare(uniqueString, verifiedUser.uniqueString, async (err, data) => {
            if (err) throw err
            if (data) {
                await User.updateOne({ _id: userId }, { isVerified: true });
                await UserVerification.deleteOne({ userId });

                res.redirect(front_url + "/verified");
            } else {
                return res.send.status(401).json("Invalid Link. Try again.");
            }
        });
    } catch (error) {
        return res.status(500).json(error);
    }
})

//update user
router.put('/update/:userId', verify, async (req, res) => {
    const {userId} = req.params;
    const {token, ...updates} = req.body;
    if(!userId){
        res.status(401).json("No userId.");
    }
    if (req.body.password) {
        try {
            const salt = await bcrypt.genSalt(8);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        } catch (error) {
            return res.status(500).json(error);
        }
    }
    User.findOneAndUpdate({_id: userId}, {
        $set: updates,
    }, (error, results)=>{
        if(error){
            res.status(400).json("Server error.");
        } else {
            res.status(200).json("Account updated.");
        }
    });
});

//get all friends
router.get("/friends/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        const friends = await Promise.all(
            user.followings.map((friendId) => {
                return User.findById(friendId);
            })
        );
        // console.log("friends");
        let friendList = [];
        friends.map((friend) => {
            const { _id, username, profilePicture } = friend;
            friendList.push({ _id, username, profilePicture });
        });
        res.status(200).json(friendList);
    } catch (error) {
        res.status(500).json(error);
    }
});

//delete
router.delete('/delete', verify, async (req, res) => {
    // if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
        const user = await User.findByIdAndDelete({ _id: req.body.userId });
        res.status(200).json("Account have been deleted");
    } catch (error) {
        return res.status(500).json(error);
    }
    // } else {
    //     return res.status(403).json("Acces denied!!");
    // }
});

//get
router.get('/', async (req, res) => {
    const userId = req.query.userId;
    const username = req.query.username;

    try {
        const user = userId
            ? await User.findById(userId)
            : await User.findOne({ username: username });
        res.status(200).json(user);
    } catch (error) {
        return res.status(500).json(error);
    }
});

//follow a user
router.put("/:id/follow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id); //thomas
            const currentUser = await User.findById(req.body.userId); //me
            if (!user.followers.includes(req.body.userId)) {
                await user.updateOne({ $push: { followers: req.body.userId } });
                await currentUser.updateOne({ $push: { followings: req.params.id } });
                res.status(200).json("user has been followed");
            } else {
                res.status(403).json("Allready following this user");
            }
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("You can't follow yourself");
    }
});

//unfollow a user
router.put("/:id/unfollow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if (user.followers.includes(req.body.userId)) {
                await user.updateOne({ $pull: { followers: req.body.userId } });
                await currentUser.updateOne({ $pull: { followings: req.params.id } });
                res.status(200).json("User has been unfollowed");
            } else {
                res.status(403).json("You dont follow this user");
            }
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("you can't unfollow yourself");
    }
});

module.exports = router;