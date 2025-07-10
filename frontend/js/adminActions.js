import { loadPosts } from "./apis.js";
import { fetchWithRetry } from "./apis.js";

async function deletePost(post) {
    const res = await fetchWithRetry(`http://localhost:5000/admin/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
    }
    loadPosts();
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
    loadPosts();
}
async function banUser(post) {
    const res = await fetchWithRetry(`http://localhost:5000/admin/ban/${post.author_username}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
        return;
    }
    loadPosts();
}

export { banUser, deletePost, deleteReply };