const fs = require('fs').promises;
const fsExtra = require('fs-extra');
const hljs = require('highlight.js');
const RSS = require('rss');
const MarkdownIt = require('markdown-it');

const READ_FILE_OPTIONS = {
    encoding: 'UTF-8'
};

const Markdown = new MarkdownIt({
    highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return `<pre class="hljs"><code>${hljs.highlight(lang, str).value}</code></pre>`;
            } catch (err) {
                console.error(err);
            }
        }
        return '';
    }
});

class Article {

    constructor() {
        this.title;
        this.description;
        this.content;
        this.publishedDate;
        this.url;
    }

    fromFile(template, content) {
        let renderedContent = Markdown.render(content);
        this.content = template.replace('{{content}}', renderedContent);

        return this;
    }

    setMetaData(metadata) {
        this.title = metadata.title;
        this.description = metadata.description || '';

        if (metadata.publishedDate) 
            this.publishedDate = metadata.publishedDate;
        else 
            this.publishedDate = new Date();

        this.urlTitle = metadata.title.toLowerCase().replace(' ', '-');
        this.url = '/articles/' + this.urlTitle + '.html';
        this.content = this.content.replace('{{title}}', metadata.title)

        return this;
    }
}

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
    let folders = await fs.readdir('./src/articles');
    let globalTemplate = (await fs.readFile('./src/template.html')).toString();
    let articleTemplate = (await fs.readFile('./src/templates/article.html')).toString();
    let template = globalTemplate.replace('{{main-content}}', articleTemplate)

    let articles = [];
    for (const folder of folders) {
        let folderPath = `./src/articles/${folder}`;
        let content = await fs.readFile(`${folderPath}/content.md`, READ_FILE_OPTIONS);
        let metadata = JSON.parse(await fs.readFile(`${folderPath}/metadata.json`));

        let article = new Article().fromFile(template, content);
        article.setMetaData(metadata);
        articles.push(article);

        fs.writeFile(`./build/articles/${article.urlTitle}.html`, article.content, READ_FILE_OPTIONS);
    }

    buildRSSFeed(articles);
    buildRecentArticles(articles);
}

async function buildRecentArticles(articles) {
    let globalTemplate = await fs.readFile('./src/template.html', READ_FILE_OPTIONS);
    let indexTemplate = await fs.readFile('./src/index.html', READ_FILE_OPTIONS);
    let recentTemplate = await fs.readFile('./src/templates/recent.html', READ_FILE_OPTIONS);

    globalTemplate = globalTemplate.replace('{{main-content}}', indexTemplate);

    let content = '';
    articles.slice(0, 10).map(article => {
        let recent = recentTemplate.replace('{{title}}', article.title);
        recent = recent.replace('{{url}}', article.url);
        recent = recent.replace('{{datetime}}', article.publishedDate);
        recent = recent.replace('{{datestring}}', article.publishedDate.toDateString());
        recent = recent.replace('{{description}}', article.description);

        content += recent;
    });

    let renderedContent = globalTemplate.replace('{{main-content}}', content);
    fs.writeFile('./build/index.html', renderedContent);
}

async function buildPages() {
    let files = await fs.readdir('./src/pages');

    for (const file of files) {
        buildPageFromTemplate(`./src/pages/${file}`, `./build/${file}`);
    }
}

async function copyAssets() {
    fsExtra.copy('./src/images', './build/images', { recursive: true });
    fsExtra.copy('./src/styles', './build/styles', { recursive: true });
    fsExtra.copy('./src/js', './build/js', { recursive: true });
}

async function buildRSSFeed(articles) {
    let date = new Date();
    let feed = new RSS({
        title: 'Alexandre Philibert',
        description: '',
        feed_url: 'alexandrephilibert.com/rss.xml',
        site_url: 'alexandrephilibert.com',
        image_url: 'alexandrephilibert.com/images/alexandre.jpg',
        managingEditor: 'Alexandre Philibert',
        webMaster: 'Alexandre Philibert',
        copyright: `${date.getFullYear()} Alexandre Philibert`,
        language: 'en',
        pubDate: date.getUTCDate(),
        ttl: '1440'
    });

    articles.forEach(article => {
        feed.item({
            title: article.title,
            description: article.description,
            url: 'alexandrephilibert.com' + article.url,
            author: 'Alexandre Philibert',
            date: article.publishedDate
        });
    });

    fs.writeFile('./build/rss.xml', feed.xml());
}