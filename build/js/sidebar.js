function getHeaderDepth(header) {
    switch (header.nodeName) {
        case 'H2':
            return 0;
        case 'H3':
            return 1;
        case 'h4':
            return 2;
        case 'h5':
            return 3;
        case 'h6':
            return 4;
    }
}

export default class Sidebar extends HTMLElement {

    get contentElement() {
        return this._contentElement;
    }

    set contentElement(element) {
        this._contentElement = element;
    }

    constructor() {
        super();
        this._contentElement;
        this._links = [];
    }

    connectedCallback() {
        let list = document.createElement('ul');
        this.appendChild(list);

        const headers = this._contentElement.querySelectorAll('h2,h3,h4');

        let uls = [list];
        let depth = 0;
        for (let i = 0; i < headers.length; i++) {
            let ul;
            let li = document.createElement('li');
            let a = document.createElement('a');
            a.href = `#${headers[i].id}`;
            a.textContent = headers[i].textContent;
            this._links.push(a);
            li.appendChild(a);

            if (!headers[i - 1]) {
                ul = uls[depth];
            } else if (headers[i - 1].nodeName == headers[i].nodeName) {
                ul = uls[depth];
            } else if (headers[i - 1].nodeName < headers[i].nodeName) {
                ul = document.createElement('ul');
                uls[depth + 1] = ul;
                uls[depth].appendChild(ul);
                depth++;
            } else if (headers[i - 1].nodeName > headers[i].nodeName) {
                depth = getHeaderDepth(headers[i]);
                ul = uls[depth];
            }

            ul.appendChild(li);
        }
    }

    active(hash) {
        let link = this.querySelector(`a[href='${hash}']`);
        for (const link of this._links) {
            link.parentNode.classList.remove('active');
        }
        if (!link) {
            return false;
        }
        link.parentNode.classList.add('active');
    }
}