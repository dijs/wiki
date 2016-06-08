[![NPM Version](https://img.shields.io/npm/v/wikijs.svg)](https://www.npmjs.com/package/wikijs)
[![Build Status](https://travis-ci.org/dijs/wiki.svg)](https://travis-ci.org/dijs/wiki)
[![Coverage Status](https://coveralls.io/repos/dijs/wiki/badge.svg)](https://coveralls.io/r/dijs/wiki)

# WikiJs

WikiJs is a node.js library which serves as an interface to Wikipedia (or any MediaWiki).

## What can it do?

- Search wiki articles
- Fetch article content
- Find all links/images/categories in a article page
- Get parsed information about articles
- Find articles by geographical location
- and much more!

## Documentation

<https://dijs.github.io/wiki>

## Install

```bash
npm install wikijs
```

## Build yourself

You can run these commands in order to build and test WikiJs:

```bash
git clone git@github.com:dijs/wiki.git
cd wiki
npm install
npm run build
npm test
```

## Usage

```javascript
import Wiki from 'wikijs';

const wiki = new Wiki();

wiki.page('Batman')
	.then(page => page.info('alter_ego'))
	.then(console.log); // Bruce Wayne
```

## Usage with webpack

In order for webpack to build wikijs properly, you must add an option to
your webpack configuration file. [Documentation](https://webpack.github.io/docs/configuration.html#externals)

```json
externals: {
  "isomorphic-fetch": "fetch"
}
```
