'use strict';

// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/worker.js', { scope: '/' }).then(registration => {
//         console.log('Registration succeeded, scope: ' + registration.scope);
//     }).catch(err => {
//         console.log('Error registering service worker : ' + err);
//     });
// }

const headers = document.querySelectorAll('h2,h3,h4,h5,h6');
const mainContent = document.querySelector('div[class=main-content]');
const scrollContainer = document.querySelector('main[class=main-content-scroller]');
const scrollContent = document.querySelector('section[class="main-section"');
const menu = document.querySelector('div[class=left-menu]');
const menuButton = document.querySelector('button[class=presentation-icon-menu]');

let arrowUp = document.createElement('button');
arrowUp.className = 'arrow-up';
arrowUp.innerHTML = `<svg viewBox="0 0 16 16"><use xlink:href=#icon-arrow></use></svg>`;
mainContent.appendChild(arrowUp);

function handleArrowUpVisibility() {
    if (scrollContainer.scrollTop > 100) {
        arrowUp.classList.add('arrow-up-visible');
    } else {
        arrowUp.classList.remove('arrow-up-visible');
    }
}

menuButton.addEventListener('click', evt => {
    evt.stopPropagation();
    menu.classList.toggle('left-menu-open');
});

arrowUp.addEventListener('click', evt => {
    evt.preventDefault();
    evt.stopPropagation();
    scrollContainer.scrollTo({top: 0, behavior: 'smooth'});
});

scrollContainer.addEventListener('scroll', evt => {
    for (let i = 1; i < headers.length; i++) {
        if (headers[i].offsetTop - headers[i].clientHeight > scrollContainer.scrollTop) {
            history.pushState(null, null, `#${headers[i - 1].id}`);
            break;
        }
    }
    handleArrowUpVisibility();
});

handleArrowUpVisibility();

window.addEventListener('hashchange', evt => {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    evt.stopPropagation();
});

function findHref(element) {
    if (element.nodeName === 'A')
        return element.href;
    if (element.parentNode)
        return findHref(element.parentNode);
    return false;
}

document.body.addEventListener('click', evt => {
    menu.classList.remove('left-menu-open');
});

// window.addEventListener('popstate', async evt => {
//     let response = await fetch(evt.state.url);
//     let content = await response.text();
//     document.documentElement.innerHTML = content;
// });

// Handle navigation when the users clicks on a link
// window.addEventListener('click', async evt => {
//     if (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey || evt.which > 1) return;

//     if (evt.target.href) {
//         let hash = evt.target.href.split('#')[1];
//         if (hash) {
//             location.hash = `#${hash}`;
//         }
//     }

//     let href = findHref(evt.target);

//     if (!href) return;

//     // TODO: Check if we are on our domain

//     evt.preventDefault();

//     history.pushState({ url: href }, false, href);

//     let response = await fetch(href);
//     let content = await response.text();
//     document.documentElement.innerHTML = content;
// });