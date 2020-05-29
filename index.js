const fs = require('fs').promises;
const fsExtra = require('fs-extra');
const MarkdownIt = require('markdown-it');

const READ_FILE_OPTIONS = {
    encoding: 'UTF-8'
};

setup();
buildArticles();
buildPages();
copyAssets();

async function setup() {
    await fs.access('./build/articles').catch(_ => {
        fs.mkdir('./build/articles');
    });
}

async function buildPageFromTemplate(filePath, destPath) {
    let template = await fs.readFile('./src/template.html', READ_FILE_OPTIONS);
    let file = await fs.readFile(filePath, READ_FILE_OPTIONS);
    fs.writeFile(destPath, template.replace('{{main-content}}', file), READ_FILE_OPTIONS);
}

async function buildArticles() {
    let markdown = new MarkdownIt();
    let folders = await fs.readdir('./src/articles');
    let globalTemplate = (await fs.readFile('./src/template.html')).toString();
    let articleTemplate = (await fs.readFile('./src/templates/article.html')).toString();

    let template = globalTemplate.replace('{{main-content}}', articleTemplate)

    for (const folder of folders) {
        let content = await fs.readFile(`./src/articles/${folder}/${folder}.md`);
        let renderedContent = markdown.render(content.toString());
        let article = template.replace('{{content}}', renderedContent);

        fs.writeFile(`./build/articles/${folder}.html`, article, READ_FILE_OPTIONS);
    }
}

async function buildPages() {
    let files = await fs.readdir('./src/pages');

    for (const file of files) {
        buildPageFromTemplate(`./src/pages/${file}`, `./build/${file}`);
    }
}

async function copyAssets() {
    fsExtra.copy('./src/styles.css', './build/styles.css', { recursive: true });
    fsExtra.copy('./src/images', './build/images', { recursive: true });
}
