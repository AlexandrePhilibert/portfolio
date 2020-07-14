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
const darkmodeButton = document.querySelector('button[class=presentation-icon-darkmode]');
const title = document.querySelector('h1[class=presentation-title]');

let arrowUp = document.createElement('button');
arrowUp.className = 'arrow-up';
arrowUp.title = 'Atteindre le haut de la page';
arrowUp.innerHTML = `<svg viewBox="0 0 16 16"><use xlink:href=#icon-arrow></use></svg>`;
mainContent.appendChild(arrowUp);

function handleArrowUpVisibility() {
    if (scrollContainer.scrollTop > 0) {
        arrowUp.classList.add('arrow-up-visible');
        title.classList.add('presentation-title-visible');
    } else {
        arrowUp.classList.remove('arrow-up-visible');
        title.classList.remove('presentation-title-visible');
    }
}

function toggleDarkmode(evt) {
    let darkmode = localStorage.getItem('darkmode');
    if (darkmode === 'true') {
        localStorage.setItem('darkmode', 'false')
        document.body.classList.remove('darkmode');
    } else {
        document.body.classList.add('darkmode');
    }
}

menuButton.addEventListener('click', evt => {
    evt.stopPropagation();
    menu.classList.toggle('left-menu-open');
});

darkmodeButton.addEventListener('click', toggleDarkmode);

arrowUp.addEventListener('click', evt => {
    evt.preventDefault();
    evt.stopPropagation();
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
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

// Allow copy of code gists
let gists = document.querySelectorAll('pre[class=hljs]');

for (let gist of gists) {
    let copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.title = 'copier';
    copyButton.innerHTML = '<svg viewBox="0 0 19 22"><use xlink:href=#icon-copy></use></svg>';

    copyButton.addEventListener('click', evt => {
        navigator.clipboard.writeText(gist.childNodes[0].innerText);

        // Don't create a new bubble if one already exists
        if (!copyButton.querySelector('i')) {
            let bubble = document.createElement('i');
            bubble.innerText = 'Copié';
            copyButton.appendChild(bubble);
        }
    });

    copyButton.addEventListener('mouseout', evt => {
        let bubble  = copyButton.querySelector('i');

        if(bubble) {
            bubble.remove();
        }
    });

    gist.appendChild(copyButton);
}