const fs = require('fs').promises;
const path = require('path');
const fsExtra = require('fs-extra');
const hljs = require('highlight.js');
const urlSlug = require('url-slug');
const RSS = require('rss');
const MarkdownIt = require('markdown-it');

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
		this.metadata;
		this.template;
		this.content;
	}


	setMetaData(metadata) {
		this.title = metadata.title;
		this.description = metadata.description || '';

		if (metadata.published)
			this.published = new Date(metadata.published);
		else
			this.published = new Date();

		this.urlTitle = metadata.title.toLowerCase().replace(' ', '-');
		this.url = '/articles/' + this.urlTitle + '/';

		this.metadata = {
			published: this.published,
			title: this.title
		};
	}

	render() {
		this.template = this.template.replace('{{title}}', this.title);
		this.template = this.template.replace('{{published-datetime}}', this.published.toISOString());
		this.template = this.template.replace('{{published-datestring}}', this.published.toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}));

		this.template = this.template.replace('{{content}}', Markdown.render(this.content));
	}
}

async function buildProjects() {
	let folders = await fs.readdir('./src/projects');
	let globalTemplate = await fs.readFile('./src/template.html', { encoding: 'utf-8' });
	let projectsTemplate = await fs.readFile('./src/projects.html', { encoding: 'utf-8' });
	let projectTemplate = await fs.readFile('./src/templates/project.html', { encoding: 'utf-8' });

	globalTemplate = globalTemplate.replace('{{main-content}}', projectsTemplate)
		.replace('{{header-title}}', 'Alexandre Philibert | Projets')
		.replace('{{main-title}}', 'Projets');

	let content = '';
	for (const folder of folders) {
		let folderPath = `./src/projects/${folder}`;
		let metadata = JSON.parse(await fs.readFile(`${folderPath}/metadata.json`, { encoding: 'utf-8' }));

		let project = new Resource(globalTemplate);
		project.setMetaData(metadata);

		let template = projectTemplate.replace('{{title}}', metadata.title);
		template = template.replace('{{url}}', metadata.url);
		template = template.replace('{{description}}', metadata.description || '');
		template = template.replace('{{image}}', path.join(`/projects/${project.urlTitle}/${metadata.image}`));

		content += template;

		await fs.mkdir(`./build/projects/${project.urlTitle}`, { recursive: true });
		if (fsExtra.existsSync(`${folderPath}/assets`)) {
			fsExtra.copy(`${folderPath}/assets`, `./build/projects/${project.urlTitle}/assets`, { recursive: true });
		}
	}

	let renderedContent = globalTemplate.replace('{{main-content}}', content);
	fs.writeFile(`./build/projects/index.html`, renderedContent);
}

async function buildHome(articles) {
	let globalTemplate = await fs.readFile('./src/template.html', { encoding: 'utf-8' });
	let indexTemplate = await fs.readFile('./src/index.html', { encoding: 'utf-8' });
	let recentTemplate = await fs.readFile('./src/templates/recent.html', { encoding: 'utf-8' });

	globalTemplate = globalTemplate.replace('{{main-content}}', indexTemplate)
		.replace('{{header-title}}', 'Alexandre Philibert')
		.replace('{{main-title}}', 'Articles');

	let content = '';
	articles.slice(0, 10).map(article => {
		let recent = recentTemplate.replace('{{title}}', article.title);
		recent = recent.replace('{{url}}', article.url);
		recent = recent.replace('{{datetime}}', article.published);
		recent = recent.replace('{{datestring}}', article.published.toLocaleDateString('fr-FR', {
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
		language: 'fr',
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


///////

build();

async function build() {
	await setup();
	await copy();
	await buildStatic();
	
	buildArticles();
	buildProjects();
}

async function setup() {
	await Promise.all([
		fs.mkdir('./build/articles', { recursive: true }),
		fs.mkdir('./build/projects', { recursive: true }),
		fs.mkdir('./build/js', { recursive: true })
	]);
}

async function copy() {
	await Promise.all([
		fsExtra.copy('./src/images', './build/images', { recursive: true }),
		fsExtra.copy('./src/styles', './build/styles', { recursive: true }),
		fsExtra.copy('./src/js', './build/js', { recursive: true })
	]);
}

async function buildStatic() {
	let pages = await fs.readdir('./src/pages/');

	for (const page of pages) {
		let template = await fs.readFile('./src/template.html', { encoding: 'utf-8' });
		let file = await fs.readFile(`./src/pages/${page}`, { encoding: 'utf-8' });

		let content = template.replace('{{main-content}}', file)
			.replace('{{header-title}}', 'Alexandre Philibert');

		fs.writeFile(`./build/${page}`, content);
	}
}

async function buildArticles() {
	let folders = await fs.readdir('./src/articles');
	let globalTemplate = await fs.readFile('./src/template.html', { encoding: 'utf-8' });
	let articleTemplate = await fs.readFile('./src/templates/article.html', { encoding: 'utf-8' });
	let template = globalTemplate.replace('{{main-content}}', articleTemplate);

	let articles = [];
	for (const folder of folders) {
		let folderPath = `./src/articles/${folder}`;
		let content = await fs.readFile(`${folderPath}/content.md`, { encoding: 'utf-8' });
		let metadata = JSON.parse(await fs.readFile(`${folderPath}/metadata.json`, { encoding: 'utf-8' }));

		template = template.replace('{{header-title}}', `Alexandre Philibert | ${metadata.title}`);

		let article = new Resource();
		article.template = template;
		article.content = content;
		article.setMetaData(metadata);
		article.render();
		articles.push(article);

		await fs.mkdir(`./build/articles/${article.urlTitle}`, { recursive: true });

		if (fsExtra.existsSync(`${folderPath}/assets`)) {
			await fsExtra.copy(`${folderPath}/assets`, `./build/articles/${article.urlTitle}/assets`, { recursive: true });
		}

		await fs.writeFile(`${folderPath}/metadata.json`, JSON.stringify(article.metadata, null, 4));

		fs.writeFile(`./build/articles/${article.urlTitle}/index.html`, article.template);
	}

	buildHome(articles);
	buildRSSFeed(articles);
}