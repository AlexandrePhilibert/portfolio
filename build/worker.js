self.addEventListener('install', evt => {
    evt.waitUntil(caches.open('v1').then(cache => {
        return cache.addAll([
            '/styles/styles.css',
            '/styles/vs2015.css',
            '/js/app.js'
        ]);
    }));
});

function getText(response) {
    return response.then(result => result.text());
}

self.addEventListener('fetch', evt => {
    // We only intercept navigation requests (e.g. click on a href)
    if (evt.request.mode === 'navigate') {
        evt.respondWith((async () => {
            evt.respondWith((async () => {
                let result = await fetch(evt.request.url);
                let content = await result.text();
                return new Response(content, {
                    headers: { 'content-type': 'text/html' }
                });
            })());
        })());
    }
});