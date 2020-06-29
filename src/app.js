'use strict';

import Sidebar from './js/sidebar.js';

let sidebar;

if ('customElements' in window) {
    customElements.define('nav-sidebar', Sidebar);
    let mainSection = document.querySelector('div[class=main-content]');
    sidebar = document.createElement('nav-sidebar');
    sidebar.className = 'side-bar';
    sidebar.contentElement = document.querySelector('section[class=article-content]');
    mainSection.prepend(sidebar);
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/worker.js', { scope: '/' }).then(registration => {
        console.log('Registration succeeded, scope: ' + registration.scope);
    }).catch(err => {
        console.log('Error registering service worker : ' + err);
    });
}

window.addEventListener('popstate', evt => {

});

const headers = document.querySelectorAll('h2,h3,h4,h5,h6');
const scrollContainer = document.querySelector('main[class=main-content-scroller]');
scrollContainer.addEventListener('scroll', evt => {
    evt.preventDefault();
    for (let i = 1; i < headers.length; i++) {
        if (headers[i].offsetTop - headers[i].clientHeight > scrollContainer.scrollTop) {
            history.pushState(null, null, `#${headers[i - 1].id}`);
            sidebar.active(`#${headers[i - 1].id}`);
            return;
        }
    }
});

window.addEventListener('hashchange', evt => {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    evt.stopPropagation();
});

// Handle navigation when the users clicks on a link
window.addEventListener('click', evt => {
    if (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey || evt.which > 1) return;

    if (evt.target.href) {
        let hash = evt.target.href.split('#')[1];
        if (hash) {
            location.hash = `#${hash}`;
        }
    }

    console.log(evt);

    event.preventDefault();
});