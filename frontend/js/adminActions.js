import { fetchWithRetry } from "./apis.js";

const socket = io();

async function deletePost(post) {
    const res = await fetchWithRetry(`http://localhost:5000/admin/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
    }
    socket.emit('new post deleted');
}

//STILL NEEDS WORK
async function deleteReply(post, reply) {
    const res = await fetchWithRetry(`http://localhost:5000/admin/${post.id}/${reply.id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
    }
    socket.emit('new reply deleted');
}

async function banUser(username) {
    const res = await fetchWithRetry(`http://localhost:5000/admin/ban/${username}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
        return;
    }
    socket.emit('new user banned');
}

async function unbanUser(username) {
    const res = await fetch(`http://localhost:5000/admin/unban/${username}`, {
        method: 'POST',
        credentials: 'include'
    });

    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
        return;
    }
    socket.emit('new user unbanned');
}

export { banUser, deletePost, deleteReply, unbanUser };