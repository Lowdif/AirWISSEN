import { isLoggedIn, isAdmin } from "./userStatus.js";
import { submitReply, submitVote } from "./apis.js";
import { deletePost, banUser } from "./adminActions.js";
import { showLoginModal } from "./dynamicUI.js";

function createPost(post, timeStamp) {

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
    post.replies.forEach(reply => {
        addReplyToUI(repliesDiv, reply, post);
    });
    
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
    createAdminUI(postHeader, post);

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

async function createAdminUI(container, post) {
    if(post.isSelf) return;
    const isAdministrator = await isAdmin();
    if(isAdministrator) {
        const moreContainer = document.createElement('div');
        const moreOptions = document.createElement('div');
        const removePostBtn = document.createElement('button');
        const banUserBtn = document.createElement('button');
        const moreBtn = document.createElement('button');
        const moreIcon = '<img class = "more-icon" src="./icons/more.svg" alt="User Icon" width="8" height="16"></img>';
        moreContainer.className = 'more-container';
        removePostBtn.textContent = 'Remove Post';
        removePostBtn.onclick = () => {
            deletePost(post);
        }
        banUserBtn.textContent = 'Ban User';
        banUserBtn.onclick = () => {
            banUser(post);
        }
        moreOptions.className = 'more-options';
        moreOptions.appendChild(removePostBtn);
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
}

function addReplyToUI(container, Reply) {
  const reply = document.createElement('div');
  const text = document.createElement('p');
  const replyMeta = document.createElement('div');

  replyMeta.className = 'reply-meta';

  reply.className = 'reply';
  reply.role = 'comment';

  text.className = 'reply-text';
  text.textContent = Reply.content

  const strong = document.createElement('strong');
  strong.textContent = `${Reply.author_username}:`;

  replyMeta.appendChild(strong);
  replyMeta.appendChild(text);
  reply.appendChild(replyMeta);
  createAdminUI(reply, Reply);

  container.appendChild(reply);
}

function updateSidebars(posts) {
    try {
        const popularPostsList = document.getElementById('popularPostsList');
        const topUsersList = document.getElementById('topUsersList');

        //Popular posts list
        if(!popularPostsList || !topUsersList) throw new Error('Failed to load side bar, please try again');
        const populars = [...posts]
        .sort((a, b) => ((b.upVotes || 0) - (b.downVotes || 0)) - ((a.upVotes || 0) - (a.downVotes || 0)))
        .slice(0, 5);

        popularPostsList.innerHTML = '';
        populars.forEach(popular => {
            const strong = document.createElement('strong');
            const p = document.createElement('p');
            const div = document.createElement('div');
            const popularPost = document.createElement('div');
            popularPost.className = 'popular-post';
            strong.textContent = `${popular.author_username}`;
            p.textContent = `${popular.content.slice(0, 70)}${popular.content.length > 70 ? '...' : ''}`;
            div.textContent = `${(popular.upVotes || 0) - (popular.downVotes || 0)}`;
            popularPost.appendChild(strong);
            popularPost.appendChild(p);
            popularPost.appendChild(div);
            popularPostsList.appendChild(popularPost);
        });      
        
        //Top user list
        const scores = {};
        posts.forEach(post => {
            scores[post.author_username] = (scores[post.author_username] || 0) + ((post.upVotes || 0) - (post.downVotes || 0));
        });

        topUsersList.innerHTML = '';
        const topUsers = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5);
        topUsers.forEach(topUser => {
            const li = document.createElement('li');
            li.textContent = `${topUser[0]} (${topUser[1]} total likes)`;
            topUsersList.appendChild(li);
        });
    }
    catch(err) {
        console.error(err);
        alert('Something went wrong when trying to load the side bar, please trying logging in again.')
    }
}

export { createPost, addReplyToUI, updateSidebars, createAdminUI };