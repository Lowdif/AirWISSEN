import { loadPosts, initSubmitPostBtn } from './apis.js';
import { initModals, dynamicHamburgerBtn, dynamicAuthBtns } from './dynamicUI.js';

document.addEventListener('DOMContentLoaded', () => {

    //dynamic UI
    dynamicAuthBtns();
    dynamicHamburgerBtn();

    //init UI
    initModals();
    initSubmitPostBtn();

    //initial Posts load when entering the page
    loadPosts();
});

//polling (actualizes page every minute)
setInterval(loadPosts, 60000);