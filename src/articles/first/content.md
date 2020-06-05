# Oui

## Ceci est un test très poussé

Ne me jugez pas

```javascript
import test from "test";

test.callFunction();
```

Ceci est censé être un autre paragraphe

```javascript
for (const folder of folders) {
    let folderPath = `./src/articles/${folder}`;
    let content = await fs.readFile(`${folderPath}/content.md`);
    let renderedContent = markdown.render(content.toString());
    let article = template.replace('{{content}}', renderedContent);

    let metadata = JSON.parse(await fs.readFile(`${folderPath}/metadata.json`));
    article = article.replace('{{title}}', metadata.title)

    fs.writeFile(`./build/articles/${folder}.html`, article, READ_FILE_OPTIONS);
}
```