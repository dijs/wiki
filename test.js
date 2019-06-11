const wiki = require('./dist/wiki').default;

wiki()
	.page('Batman')
	.then(page => page.content())
	.then(content => JSON.stringify(content, null, 3))
	.then(console.log);
