let fs = require('fs');

let MarkdownIt = require('markdown-it');

let markdown = new MarkdownIt();

if(!fs.existsSync('./build/articles')) {
    fs.mkdirSync('./build/articles');
}

let files = fs.readdirSync('./src/articles');

for (const file of files) {
    let content = fs.readFileSync(`./src/articles/${file}`, { 
        encoding: 'UTF-8' 
    });

    let rendered = markdown.render(content);

    fs.writeFileSync(`./build/articles/${file.replace('.md', '')}.html`, rendered, {
        encoding: 'UTF-8'
    });
}
