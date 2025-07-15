import { isLoggedIn, isAdmin } from "./userStatus.js";
import { loadPosts, submitReply, submitVote } from "./apis.js";
import { deletePost, banUser, deleteReply } from "./adminActions.js";
import { showLoginModal } from "./dynamicUI.js";
import { unbanUser } from "./admin.js";

let expendedReplies = {};
function createPost(post, timeStamp) {
    let numberOfReplies = expendedReplies[post.id] == true? 'all' : 5;
    const postEl = document.createElement('article');
    const postHeader = document.createElement('div');
    const postMeta = document.createElement('div');
    const actions = document.createElement('div');
    const replyBox = document.createElement('div');
    const repliesDiv = document.createElement('div');
    const postAuth = document.createElement('div');
    const upVoteBtn = document.createElement('button');
    const downVoteBtn = document.createElement('button');
    const replyBtn = document.createElement('button');
    const submitReplyBtn = document.createElement('button');
    const replyTextArea = document.createElement('textarea');
    const voteCount = document.createElement('span');
    const postTimeStamp = document.createElement('span');
    const postAuthor = document.createElement('span');
    const profilePicture = document.createElement('img');
    const postMessage = document.createElement('p');
    const like_regular = '<img class = "vote-icon" src="./icons/like-regular.svg" alt="User Icon" width="16" height="16"></img>';
    const like_solid = '<img class = "vote-icon" src="./icons/like-solid.svg" alt="User Icon" width="16" height="16"></img>';
    const dislike_regular = '<img class = "vote-icon" src="./icons/dislike-regular.svg" alt="User Icon" width="16" height="16"></img>';
    const dislike_solid = '<img class = "vote-icon" src="./icons/dislike-solid.svg" alt="User Icon" width="16" height="16"></img>';
    let voteValue = 0;

    upVoteBtn.innerHTML = like_regular;
    upVoteBtn.className = 'vote-btn';

    downVoteBtn.innerHTML = dislike_regular;
    downVoteBtn.className = 'vote-btn';

    if(post.user_vote === 1) {
        upVoteBtn.innerHTML = like_solid;
    }
    else if(post.user_vote === -1) {
        downVoteBtn.innerHTML = dislike_solid;
    }

    replyBtn.innerHTML = 'Reply';
    replyBtn.className = 'reply-btn';

    submitReplyBtn.innerHTML = 'Submit Reply';
    submitReplyBtn.className = 'submit-reply-btn';

    upVoteBtn.onclick = async () => {
        const loggedIn = await isLoggedIn();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        voteValue = post.user_vote === 1? 0 : 1;
        post.user_vote = voteValue;
        const isAuthorized = await submitVote(voteValue, post.id);
        if(isAuthorized == false) return;
        upVoteBtn.innerHTML = post.user_vote === 1? like_solid : like_regular;
        downVoteBtn.innerHTML = post.user_vote === -1? dislike_solid : dislike_regular;
    }

    downVoteBtn.onclick = async () => {
        const loggedIn = await isLoggedIn();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        voteValue = post.user_vote === -1? 0 : -1;
        post.user_vote = voteValue;
        const isAuthorized = await submitVote(voteValue, post.id);
        if(isAuthorized == false) return;
        upVoteBtn.innerHTML = post.user_vote === 1? like_solid : like_regular;
        downVoteBtn.innerHTML = post.user_vote === -1? dislike_solid : dislike_regular;
    }

    replyBtn.onclick = async () => {
        const loggedIn = await isLoggedIn();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        replyBox.style.display = replyBox.style.display === 'none'? 'block' : 'none';
        replyTextArea.focus();
    }
    
    submitReplyBtn.onclick = async () => {
        const loggedIn = await isLoggedIn();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        submitReply(replyTextArea.value, post.id);
    }

    replyTextArea.placeholder = "write a reply...";

    replyBox.className = 'reply-box';
    replyBox.style.display = 'none';

    repliesDiv.className = 'replies';

    const moreReplies = document.createElement('button');
    moreReplies.textContent = expendedReplies[post.id] == true? 'Less...' : 'More...';
    moreReplies.style.display = post.replies.length <= numberOfReplies ? 'none' : 'flex';
    moreReplies.className = 'more-replies-btn';
    moreReplies.onclick = () => {
        if(moreReplies.textContent == 'More...') {
            moreReplies.textContent = 'Less...';
            expendedReplies[post.id] = true;
            loadPosts();
        }
        else {
            moreReplies.textContent = 'More...';
            expendedReplies[post.id] = false;
            loadPosts();
        }
        const end = numberOfReplies == 'all' ? post.replies.length : numberOfReplies;
        post.replies.slice(0, end).forEach(reply => {
        addReplyToUI(repliesDiv, post, reply);
        });
        repliesDiv.appendChild(moreReplies);
    };
    
    const end = numberOfReplies == 'all' ? post.replies.length : numberOfReplies;
        post.replies.slice(0, end).forEach(reply => {
        addReplyToUI(repliesDiv, post, reply);
    });
    repliesDiv.appendChild(moreReplies);

    actions.className = 'post-actions';

    voteCount.className = 'vote-count';
    voteCount.textContent = ((post.upVotes || 0) - (post.downVotes || 0)).toString();

    postEl.className = 'post';
    postHeader.className = 'post-header';
    postMeta.className = 'post-meta';

    postMessage.className = 'post-message';
    postMessage.textContent = post.content;

    postTimeStamp.className = 'post-time-stamp';
    postTimeStamp.textContent = timeStamp;

    postAuthor.className = 'post-author';
    postAuthor.textContent = post.author_username;

    profilePicture.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(post.author_username)}`;
    profilePicture.alt = 'Profile picture';
    profilePicture.className = 'profile-picture';   

    //specific css for banned users
    if(post.banStatus == 'banned'){
        postAuthor.classList.add('banned-txt');
        postMessage.classList.add('banned-txt');
    }
    //to bring layout back to normal when user is unbanned
    else {
        postAuthor.classList.remove('banned-txt');
        postMessage.classList.remove('banned-txt');
    }

    postsModerationUI(postHeader, post);

    actions.appendChild(upVoteBtn);
    actions.appendChild(voteCount);
    actions.appendChild(downVoteBtn);
    actions.appendChild(replyBtn);

    replyBox.appendChild(replyTextArea);
    replyBox.appendChild(submitReplyBtn);

    postMeta.appendChild(postAuthor);
    postMeta.appendChild(postTimeStamp);

    postAuth.className = 'post-auth';
    postAuth.appendChild(profilePicture);
    postAuth.appendChild(postMeta);
    
    postHeader.appendChild(postAuth);

    postEl.appendChild(postHeader);
    postEl.appendChild(postMessage);
    postEl.appendChild(actions);
    postEl.appendChild(replyBox);
    postEl.appendChild(repliesDiv);

    return postEl;
}

async function postsModerationUI(container, post) {
    if(post.isSelf) return;
    const isAdministrator = await isAdmin();
    if(!isAdministrator) return;

    const moreContainer = document.createElement('div');
    const moreOptions = document.createElement('div');
    const removePostBtn = document.createElement('button');
    const moreBtn = document.createElement('button');
    const moreIcon = '<img class = "more-icon" src="./icons/more.svg" alt="User Icon" width="8" height="16"></img>';
    moreContainer.className = 'more-container';
    removePostBtn.textContent = 'Remove Post';
    removePostBtn.onclick = () => {
        deletePost(post);
    }
    moreOptions.className = 'more-options';
    moreOptions.appendChild(removePostBtn);
    moreOptions.appendChild(dynamicBanBtn(post.banStatus == 'banned', post));
    moreOptions.style.display = 'none';
    moreBtn.className = 'more-btn';
    moreBtn.innerHTML = moreIcon;
    moreBtn.onclick = () => {
        moreOptions.style.display = moreOptions.style.display == 'none' ? 'block' : 'none';
    };
    moreContainer.appendChild(moreBtn);
    moreContainer.appendChild(moreOptions);
    container.appendChild(moreContainer);
    document.addEventListener('click', e => {
        if(!moreContainer.contains(e.target) && moreOptions.style.display === 'block') moreOptions.style.display =  'none';
    });
}

function dynamicBanBtn(isBanned, post) {
    const btn = document.createElement('button');
    btn.textContent = isBanned == true? 'Unban User ' : 'Ban User';
    btn.onclick = isBanned == true? () => { unbanUser(post.author_username); loadPosts() } : 
    () => { banUser(post.author_username); };
    return btn;
}

async function repliesModerationUI(container, post, reply) {
    if(reply.isSelf) return;
    const isAdministrator = await isAdmin();
    if(!isAdministrator) return;

    const moreContainer = document.createElement('div');
    const moreOptions = document.createElement('div');
    const removeReplyBtn = document.createElement('button');
    const banUserBtn = document.createElement('button');
    const moreBtn = document.createElement('button');
    const moreIcon = '<img class = "more-icon" src="./icons/more.svg" alt="User Icon" width="8" height="16"></img>';
    moreContainer.className = 'more-container';
    removeReplyBtn.textContent = 'Remove Reply';
    removeReplyBtn.onclick = () => {
        deleteReply(post, reply);
    }
    banUserBtn.textContent = 'Ban User';
    banUserBtn.onclick = () => {
        banUser(reply.author_username);
    }
    moreOptions.className = 'more-options';
    moreOptions.appendChild(removeReplyBtn);
    moreOptions.appendChild(banUserBtn);
    moreOptions.style.display = 'none';
    moreBtn.className = 'more-btn';
    moreBtn.innerHTML = moreIcon;
    moreBtn.onclick = () => {
        moreOptions.style.display = moreOptions.style.display == 'none' ? 'block' : 'none';
    };
    moreContainer.appendChild(moreBtn);
    moreContainer.appendChild(moreOptions);
    container.appendChild(moreContainer);
    document.addEventListener('click', e => {
        if(!moreContainer.contains(e.target) && moreOptions.style.display === 'block') moreOptions.style.display =  'none';
    });
}

async function addReplyToUI(container, Post, Reply) {
    const reply = document.createElement('div');
    const text = document.createElement('div');
    const replyHeader = document.createElement('div');

    replyHeader.className = 'reply-header';

    reply.className = 'reply';
    reply.role = 'comment';

    text.className = 'reply-text';
    text.textContent = Reply.content;

    const strong = document.createElement('strong');
    strong.textContent = `${Reply.author_username}:`;

    replyHeader.appendChild(strong);
    repliesModerationUI(replyHeader, Post, Reply);
    reply.appendChild(replyHeader);
    reply.appendChild(text);

  container.appendChild(reply);
}

function updateSidebars(popularPosts, popularUsers) {
    try {
        const popularPostsList = document.getElementById('popularPostsList');
        const topUsersList = document.getElementById('topUsersList');

        if(!popularPostsList || !topUsersList) throw new Error('Failed to load side bar, please try again');

        //Popular posts list
        popularPostsList.innerHTML = '';
        popularPosts.forEach(popular => {
            const strong = document.createElement('strong');
            const p = document.createElement('p');
            const div = document.createElement('div');
            const popularPost = document.createElement('div');
            popularPost.className = 'popular-post';
            strong.textContent = `${popular.author_username}`;
            p.textContent = `${popular.content.slice(0, 70)}${popular.content.length > 70 ? '...' : ''}`;
            const totalLikes = (popular.upVotes || 0) - (popular.downVotes || 0);
            div.textContent = `${totalLikes} like${totalLikes > 1 || totalLikes < -1 ? 's' : ''}`;
            popularPost.appendChild(strong);
            popularPost.appendChild(p);
            popularPost.appendChild(div);
            popularPostsList.appendChild(popularPost);
        });      
        
        //Popular users list
        topUsersList.innerHTML = '';
        popularUsers.forEach(topUser => {
            const li = document.createElement('li');
            li.textContent = `${topUser[0]} (${topUser[1]} total like${topUser[1] > 1 || topUser[1] < -1 ? 's' : ''})`;
            topUsersList.appendChild(li);
        });
    }
    catch(err) {
        console.error(err);
        alert('Something went wrong when trying to load the side bar, please trying logging in again.')
    }
}

export { createPost, addReplyToUI, updateSidebars, postsModerationUI, repliesModerationUI };