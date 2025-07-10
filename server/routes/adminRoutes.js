require('dotenv').config();
const express = require('express');
const { userDb } = require('../databases/databases');
const { db } = require('../databases/databases');
const { publicFilesPath } = require('./middleware');
const router = express.Router();
const { isAdmin } = require('./middleware');

//Ban user Route
router.delete('/ban/:username', isAdmin, (req, res) => {
    const { username } = req.params;
    
    if (!username) return res.status(400).json({success: false, message: 'Invalid request when trying to ban user.'});

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
router.delete('/:postID', isAdmin, (req, res) => {
    const { postID } = req.params;
    if (!postID) return res.status(400).json({success: false, message: 'Invalid request when trying to delete post.'});

    try{
        if(postID == 'all') {
            db.prepare('DELETE FROM votes').run();
            db.prepare('DELETE FROM replies').run();
            db.prepare('DELETE FROM posts').run();
            return res.status(200).json({success: true, message: 'All posts deleted successfully.'});
        }

        const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postID);
        if(!post) return res.status(400).json({success: false, message: 'Invalid post id.'});
        
        db.prepare('DELETE FROM votes WHERE post_id = ?').run(postID);
        db.prepare('DELETE FROM replies WHERE post_id = ?').run(postID);
        db.prepare('DELETE FROM posts WHERE id = ?').run(postID);

        return res.status(200).json({success: true, message: 'Post deleted successfully.'});
    }
    catch(err) {
        console.error(err);
        return res.status(400).json({success: false, message: 'Something went wrong when trying to delete post. Please try again.'});
    }
});

//Delete reply Route
router.delete('/:postID/:replyID', isAdmin, (req, res) => {
    const { postID } = req.params;
    const { replyID } = req.params;
    if (!postID || !replyID) return res.status(400).json({success: false, message: 'Invalid request when trying to delete reply.'});

    try{
        const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postID);
        if(!post) return res.status(400).json({success: false, message: 'Invalid post id.'});

        if(replyID == 'all') {
            db.prepare('DELETE * FROM replies WHERE post_id = ?').run(postID);
            return res.status(200).json({success: true, message: 'All replies under the post deleted successfully.'});
        }

        const reply = db.prepare('SELECT * FROM replies WHERE id = ? AND post_id = ?').get(replyID, postID);
        if(!reply) return res.status(400).json({success: false, message: 'Invalid reply id.'});

        db.prepare('DELETE FROM replies WHERE id = ? AND post_id = ?').run(replyID, postID);
        return res.status(200).json({success: true, message: 'Reply deleted successfully.'});
    }
    catch(err) {
        console.error(err);
        return res.status(400).json({success: false, message: 'Something went wrong when trying to delete post. Please try again.'});
    }
});

//Get Banned Users Route
router.get('/bannedUsers', isAdmin, (req, res) => {
    try {
        const bannedUsers = userDb.prepare('SELECT * FROM users WHERE banned = ?').all(1);
        const newBannedUsers = bannedUsers.map(user => {
            const userID = user.id;
            const username = user.username;
            return { userID, username }
        });
        return res.status(200).json({success: true, bannedUsers: newBannedUsers});
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({success: false, message: 'Server Side Error, please try again.'});
    }
});

//Unban User Route
router.post('/unban/:username', isAdmin, (req, res) => {
    const { username } = req.params;
    if(!username) return res.status(400).json({success: false, message: 'Invalid request URL.'});

    try {
        const user = userDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if(!user) {
            return res.status(404).json({success: false, message: 'User not found.'});
        }
        if(user.banned == 0) {
            return res.status(400).json({success: false, message: 'User is already unbanned.'});
        }

        userDb.prepare('UPDATE users SET banned = 0 WHERE username = ?').run(user.username);
        return res.status(200).json({success: true, message: 'User unbanned successfully.'});
    }
    catch(err) {
        console.error(err);
        return res.status(400).json({success: false, message: 'Something went wrong when trying to unban user. Please try again.'});
    }
});

router.get('/', isAdmin, (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/admin.html');
});

module.exports = router;