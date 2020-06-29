if ('serviceWorker' in navigator) {
    // TODO: Change scope of service worker...
    navigator.serviceWorker.register('/js/worker.js', { scope: '/' })
    .then(registration => {
        console.log('Registration succeeded, scope: ' + registration.scope);
    }).catch(err => {
        console.log('Error registering service worker : ' + err);
    });
}