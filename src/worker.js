self.addEventListener('install', evt => {
    evt.waitUntil(caches.open('v1').then(cache => {
        return cache.addAll([
            '/templates/articles.html'
        ]);
    }));
});

function getText(response) {
    return response.then(result => result.text());
}

self.addEventListener('fetch', evt => {
    // We only intercept navigation requests (e.g. click on a href)
    // if (evt.request.mode === 'navigate') {
    //     evt.respondWith((async () => {
    //         // if (evt.request.url.includes('articles')) {
    //         //     let requests = await Promise.all([
    //         //         getText(caches.match('/templates/articles.html')),
    //         //         getText(fetch(`${evt.request.url}/index.content.html`))
    //         //     ]);

    //         //     return new Response(requests[0].replace('{{content}}', requests[1]), {
    //         //         headers: { 'content-type': 'text/html' }
    //         //     });
    //         // }
    //         evt.respondWith((async() => {
    //             let result = await fetch(evt.request.url);
    //             let text = await result.text();
    //             return new Response(text, {
    //                 headers: { 'content-type': 'text/html' }
    //             });
    //         })());
    //     })());
    // }
});