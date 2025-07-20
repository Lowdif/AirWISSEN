import { isLoggedIn } from "./userStatus.js";
import { logout } from "./apis.js";

const loginModal = document.getElementById('loginModal');
const loginBtn2 = document.getElementById('loginBtn2');
const registerBtn2 = document.getElementById('registerBtn2');
const closeModalBtn = document.getElementById('closeModalBtn');
const banModal = document.getElementById('banModal');
const closeBanModalBtn = document.getElementById('closeBanModalBtn');
const authButtons = document.getElementById('authButtons');

function showLoginModal() { loginModal.style.display = 'flex'; }
function hideLoginModal() { loginModal.style.display = 'none'; }
function showBanModal() { banModal.style.display = 'flex'; };
function hideBanModal() { banModal.style.display = 'none'; }

function initModals() {
    loginBtn2.addEventListener('click', () => { hideLoginModal(); window.location.href = 'http://localhost:5000/login'; });
    registerBtn2.addEventListener('click', () => { hideLoginModal(); window.location.href = 'http://localhost:5000/register'; });
    closeModalBtn.addEventListener('click', hideLoginModal);
    loginModal.addEventListener('click', e => { if (e.target === loginModal) hideLoginModal(); });


    // Ban modal logic 
    closeBanModalBtn.addEventListener('click', hideBanModal);
    banModal.addEventListener('click', e => { if (e.target === banModal) hideBanModal(); });
}

function dynamicHamburgerBtn() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const hamburgerContainer = document.getElementById('hamburgerContainer');
    hamburgerBtn.onclick = () => {
        hamburgerContainer.style.display = hamburgerContainer.style.display === 'none' ? 'block' : 'none';
    };

    document.addEventListener('click', e => {
    if(!hamburgerMenu.contains(e.target) && hamburgerContainer.style.display === 'block') hamburgerContainer.style.display =  'none';
    });
}

async function dynamicAuthBtns() {
    const loggedIn = await isLoggedIn();
    if(loggedIn) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = async () => {
            await logout();
            window.location.reload();
        };
        authButtons.innerHTML = '';
        authButtons.appendChild(logoutBtn);
    }
    else {
        const loginBtn = document.createElement('button');
        const registerBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        registerBtn.textContent = 'Register';

        loginBtn.onclick = () => {
            window.location.href = 'http://localhost:5000/login';
        };
        registerBtn.onclick = () => {
            window.location.href = 'http://localhost:5000/auth/register';
        };
        authButtons.innerHTML = '';
        authButtons.appendChild(loginBtn);
        authButtons.appendChild(registerBtn);
    }
}

export { showBanModal, showLoginModal, initModals, dynamicHamburgerBtn, dynamicAuthBtns };