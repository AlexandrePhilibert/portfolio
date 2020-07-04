const path = require('path');
const connect = require('connect');
const serveStatic = require('serve-static');

connect()
    .use(serveStatic(path.join(__dirname, '/build/'), { extensions: 'html', redirect: false, cacheControl: false }))
    .listen(8080, () => console.log('Server running on 8080...'));