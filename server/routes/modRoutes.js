require('dotenv').config();
const express = require('express');
const { userDb } = require('../databases/databases');
const { db } = require('../databases/databases');
const router = express.Router();

//Ban user Route
router.delete('/ban/:username', (req, res) => {
    const { username } = req.params;
    const adminKey = req.headers['adminkey'];
    
    if (!username) return res.status(400).json({success: false, message: 'Invalid request when trying to ban user.'});
    if(!adminKey) return res.status(400).json({success: false, message: 'Only admins may ban users.'});
    if (adminKey !== process.env.ADMIN_KEY) return res.status(400).json({success: false, message: 'Invalid admin key.'});

    try {
        const user = userDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if(!user) {
            return res.status(404).json({success: false, message: 'User not found.'});
        }
        if(user.banned == 1) {
            return res.status(400).json({success: false, message: 'User is already banned.'});
        }

        userDb.prepare('UPDATE users SET banned = 1 WHERE username = ?').run(user.username);
        return res.status(200).json({success: true, message: 'User banned successfully.'});
    }
    catch(err) {
        console.error(err);
        return res.status(400).json({success: false, message: 'Something went wrong when trying to ban user. Please try again.'});
    }
});

//Delete post Route
router.delete('/:postID', (req, res) => {
    const { postID } = req.params;
    const adminKey  = req.headers['adminkey'];
    if (!postID) return res.status(400).json({success: false, message: 'Invalid request when trying to delete post.'});
    if(!adminKey) return res.status(400).json({success: false, message: 'Only admins may delete posts.'});
    if (adminKey !== process.env.ADMIN_KEY) return res.status(400).json({success: false, message: 'Invalid admin key.'});

    try{
        if(postID == 'all') {
            db.prepare('DELETE FROM votes').run();
            db.prepare('DELETE FROM replies').run();
            db.prepare('DELETE FROM posts').run();
            return res.status(200).json({success: true, message: 'All posts deleted sucessfully.'});
        }

        const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postID);
        if(!post) return res.status(400).json({success: false, message: 'Invalid post id.'});
        
        db.prepare('DELETE FROM votes WHERE post_id = ?').run(postID);
        db.prepare('DELETE FROM replies WHERE post_id = ?').run(postID);
        db.prepare('DELETE FROM posts WHERE id = ?').run(postID);

        return res.status(200).json({success: true, message: 'Post deleted sucessfully.'});
    }
    catch(err) {
        console.error(err);
        return res.status(400).json({success: false, message: 'Something went wrong when trying to delete post. Please try again.'});
    }
});

//Delete reply Route
router.delete('/:postID/:replyID', (req, res) => {
    const { postID } = req.params;
    const { replyID } = req.params;
    const adminKey  = req.headers['adminkey'];
    if (!postID || !replyID) return res.status(400).json({success: false, message: 'Invalid request when trying to delete reply.'});
    if(!adminKey) return res.status(400).json({success: false, message: 'Only admins may delete posts.'});
    if (adminKey !== process.env.ADMIN_KEY) return res.status(400).json({success: false, message: 'Invalid admin key.'});

    try{
        const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postID);
        if(!post) return res.status(400).json({success: false, message: 'Invalid post id.'});

        if(replyID == 'all') {
            db.prepare('DELETE * FROM replies WHERE post_id = ?').run(postID);
            return res.status(200).json({success: true, message: 'All replies under the post deleted sucessfully.'});
        }

        const reply = db.prepare('SELECT * FROM replies WHERE id = ? AND post_id = ?').get(replyID, postID);
        console.log(reply, postID, replyID)
        if(!reply) return res.status(400).json({success: false, message: 'Invalid reply id.'});

        db.prepare('DELETE FROM replies WHERE id = ? AND post_id = ?').run(replyID, postID);
        return res.status(200).json({success: true, message: 'Reply deleted sucessfully.'});
    }
    catch(err) {
        console.error(err);
        return res.status(400).json({success: false, message: 'Something went wrong when trying to delete post. Please try again.'});
    }
});

module.exports = router;