const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");

//* create a post
router.post("/", async (req, res) => {
    const newPost = new Post(req.body);
    newPost.description = req.body.description;
    try {
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json(err);
    }
});

//comment on a post
router.put("/comment/:id", async (req, res) => {
    try {
        const comment = new Comment(req.body);
        
        const postId = req.params.id || comment?.postId;

        const post = await Post.findById(postId);
        const currUser = await User.findById(comment?.userId);

        if(post && currUser){
            post.comments.push(comment);
            await post.updateOne(
                {_id: post._id},
                {$push : {comments: comment}}
            );
            
            await comment.save();
            await post.save();

            res.status(200).json(post);
        } else if(post===null){
            res.status(404).json("No Post found.");
        } else {
            res.status(404).json("User not found.");
        }
    } catch(err){
        res.status(500).json(err);
    }
})

//* update a post
router.put("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.updateOne({ $set: req.body });
            res.status(200).json("The post has been updated.");
        } else {
            res.status(403).json("You can update only your posts.");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

//* delete a post
router.delete("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.deleteOne();
            res.status(200).json("The post has been deleted.");
        } else {
            res.status(403).json("You can delete only your posts.");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

//* like / dislike a post
router.put("/:id/like", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: { likes: req.body.userId } });
            res.status(200).json("The post has been liked.");
        } else {
            await post.updateOne({ $pull: { likes: req.body.userId } });
            res.status(200).json("The post has been disliked.");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

//* get a post
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }
});

//* get timeline posts
router.get("/timeline/:userId", async (req, res) => {
    try {
        const currentUser = await User.findById(req.params.userId);
        const userPosts = await Post.find({ userId: currentUser._id });
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({ userId: friendId });
            })  
        );
        userPosts.sort((p1, p2) => {
            return new Date(p2.createdAt) - new Date(p1.createdAt);
        })
        res.status(200).json(userPosts.concat(...friendPosts))
    } catch (err) {
        res.status(500).json(err);
    }
});

//* get users all posts
router.get("/profile/:username", async (req, res) => {
    try {
        const user = await User.findOne({username: req.params.username});
        const posts = await Post.find({userId: user._id});
        posts.reverse();
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;