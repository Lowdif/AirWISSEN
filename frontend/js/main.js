import { loadPosts, initSubmitPostBtn, initMorePostsBtn } from './apis.js';
import { initModals, dynamicHamburgerBtn, dynamicAuthBtns } from './dynamicUI.js';

document.addEventListener('DOMContentLoaded', () => {

    //dynamic UI
    dynamicAuthBtns();
    dynamicHamburgerBtn();

    //init UI
    initModals();
    initSubmitPostBtn();
    initMorePostsBtn();

    //initial Posts load when entering the page
    loadPosts();
});

//polling (actualizes page every minute)
setInterval(loadPosts, 60000);