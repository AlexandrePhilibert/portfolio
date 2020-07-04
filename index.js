const fs = require('fs').promises;
const path = require('path');
const fsExtra = require('fs-extra');
const hljs = require('highlight.js');
const RSS = require('rss');
const MarkdownIt = require('markdown-it');
const urlSlug = require('url-slug');

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

Markdown.use(require('markdown-it-anchor'), {
	slugify: s => urlSlug(s),
});

class Resource {

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
		this.url = '/articles/' + this.urlTitle + '/';

		if (this.content) {
			let date = new Date();
			this.content = this.content.replace('{{title}}', metadata.title);
			this.content = this.content.replace('{{published-datetime}}', date.toISOString());
			this.content = this.content.replace('{{published-datestring}}', date.toLocaleDateString('fr-FR', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			}));
		}

		return this;
	}
}

setup();
buildArticles();
buildProjects();
buildPages();
copyAssets();

function setup() {
	if (!fsExtra.existsSync('./build/articles')) {
		fsExtra.mkdirSync('./build/articles');
	}
	if (!fsExtra.existsSync('./build/projects')) {
		fsExtra.mkdirSync('./build/projects');
	}
	if (!fsExtra.existsSync('./build/js')) {
		fsExtra.mkdirSync('./build/js');
	}
}

async function buildPageFromTemplate(filePath, destPath) {
	let template = await fs.readFile('./src/template.html', READ_FILE_OPTIONS);
	let file = await fs.readFile(filePath, READ_FILE_OPTIONS);
	let content = template.replace('{{main-content}}', file)
		.replace('{{header-title}}', 'Alexandre Philibert');
	fs.writeFile(destPath, content, READ_FILE_OPTIONS);
}

async function buildArticles() {
	let folders = await fs.readdir('./src/articles');
	let globalTemplate = (await fs.readFile('./src/template.html')).toString();
	let articleTemplate = (await fs.readFile('./src/templates/article.html')).toString();
	let template = globalTemplate.replace('{{main-content}}', articleTemplate);

	let articles = [];
	for (const folder of folders) {
		let folderPath = `./src/articles/${folder}`;
		let content = await fs.readFile(`${folderPath}/content.md`, READ_FILE_OPTIONS);
		let metadata = JSON.parse(await fs.readFile(`${folderPath}/metadata.json`));

		template = template.replace('{{header-title}}', `Alexandre Philibert | ${metadata.title}`);

		let article = new Resource().fromFile(template, content);
		article.setMetaData(metadata);
		articles.push(article);

		if (!fsExtra.existsSync(`./build/articles/${article.urlTitle}`)) {
			fs.mkdir(`./build/articles/${article.urlTitle}`);
		}
		if (fsExtra.existsSync(`${folderPath}/assets`)) {
			fsExtra.copy(`${folderPath}/assets`, `./build/articles/${article.urlTitle}/assets`, { recursive: true });
		}
		fs.writeFile(`./build/articles/${article.urlTitle}/index.html`, article.content);
	}

	buildRSSFeed(articles);
	buildRecentArticles(articles);
}

async function buildProjects() {
	let folders = await fs.readdir('./src/projects');
	let globalTemplate = (await fs.readFile('./src/template.html')).toString();
	let projectsTemplate = await fs.readFile('./src/projects.html', READ_FILE_OPTIONS);
	let projectTemplate = (await fs.readFile('./src/templates/project.html')).toString();

	globalTemplate = globalTemplate.replace('{{main-content}}', projectsTemplate)
		.replace('{{header-title}}', 'Alexandre Philibert | Projets')
		.replace('{{main-title}}', 'Articles');

	let content = '';
	for (const folder of folders) {
		let folderPath = `./src/projects/${folder}`;
		let metadata = JSON.parse(fsExtra.readFileSync(`${folderPath}/metadata.json`));

		let project = new Resource();
		project.setMetaData(metadata);

		let template = projectTemplate.replace('{{title}}', metadata.title);
		template = template.replace('{{url}}', metadata.url);
		template = template.replace('{{description}}', metadata.description);
		template = template.replace('{{image}}', path.join(`/${project.urlTitle}/${metadata.image}`));

		content += template;

		if (!fsExtra.existsSync(`./build/projects/${project.urlTitle}`)) {
			fs.mkdir(`./build/projects/${project.urlTitle}`);
		}
		if (fsExtra.existsSync(`${folderPath}/assets`)) {
			fsExtra.copy(`${folderPath}/assets`, `./build/projects/${project.urlTitle}/assets`, { recursive: true });
		}
	}

	let renderedContent = globalTemplate.replace('{{main-content}}', content);
	fs.writeFile(`./build/projects.html`, renderedContent, READ_FILE_OPTIONS);
}

async function buildRecentArticles(articles) {
	let globalTemplate = await fs.readFile('./src/template.html', READ_FILE_OPTIONS);
	let indexTemplate = await fs.readFile('./src/index.html', READ_FILE_OPTIONS);
	let recentTemplate = await fs.readFile('./src/templates/recent.html', READ_FILE_OPTIONS);

	globalTemplate = globalTemplate.replace('{{main-content}}', indexTemplate)
		.replace('{{header-title}}', 'Alexandre Philibert')
		.replace('{{main-title}}', 'Articles');

	let content = '';
	articles.slice(0, 10).map(article => {
		let recent = recentTemplate.replace('{{title}}', article.title);
		recent = recent.replace('{{url}}', article.url);
		recent = recent.replace('{{datetime}}', article.publishedDate);
		recent = recent.replace('{{datestring}}', article.publishedDate.toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}));
		recent = recent.replace('{{description}}', article.description);

		content += recent;
	});

	let renderedContent = globalTemplate.replace('{{main-content}}', content);
	fs.writeFile('./build/index.html', renderedContent);
}

async function buildPages() {
	let files = [
		'about.html'
	];

	for (const file of files) {
		buildPageFromTemplate(`./src/pages/${file}`, `./build/${file}`);
	}
}

async function copyAssets() {
	fsExtra.copy('./src/images', './build/images', { recursive: true });
	fsExtra.copy('./src/styles', './build/styles', { recursive: true });
	fsExtra.copy('./src/app.js', './build/app.js', { recursive: true });
	fsExtra.copy('./src/worker.js', './build/worker.js', { recursive: true });
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