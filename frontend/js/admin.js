import { unbanUser } from "./adminActions.js";
const bannedContainer = document.getElementById('bannedContainer');
const socket = io();

async function loadBans() {
    if(!bannedContainer) return;
    const res = await fetch('http://localhost:5000/admin/bannedUsers');
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong' + msg);
        return;
    }
    try {
        const data = await res.json();
        const bannedUsers = data.bannedUsers;
        bannedContainer.innerHTML = '';
        for(const bannedUser of bannedUsers) {
            bannedContainer.appendChild(createBans(bannedUser));
        }
    }
    catch(err) {
        console.error(err);
    }
}

function createBans(bannedUser) {
    const banContainer = document.createElement('div');
    const bannedUsername = document.createElement('p');
    const unbanBtn = document.createElement('button');
    const bannedInfo = document.createElement('div');
    const profilePicture = document.createElement('img');

    unbanBtn.className = 'unban-btn';
    unbanBtn.innerText = 'Unban User';
    unbanBtn.onclick = async () => {
        await unbanUser(bannedUser.username);
    };

    profilePicture.className = 'profile-picture';
    profilePicture.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(bannedUser.username)}`;

    bannedUsername.className = 'banned-username';
    bannedUsername.innerText = bannedUser.username;

    bannedInfo.className = 'banned-meta';
    bannedInfo.appendChild(profilePicture);
    bannedInfo.appendChild(bannedUsername);
    
    banContainer.className = 'ban';
    banContainer.appendChild(bannedInfo);
    banContainer.appendChild(unbanBtn);

    return banContainer;
}

//initial Bans load
loadBans();

socket.on('new user banned', () => loadBans());
socket.on('new user unbanned', () => loadBans());