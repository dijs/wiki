import { api } from './util';

const processors = {
	extracts: data => {
		return { extract: data.extract };
	},
	links: data => {
		return { links: data.links.map(e => e.title) };
	},
	extlinks: data => {
		return { extlinks: data.extlinks.map(e => e['*']) };
	},
	langlinks: data => {
		return { langlinks: data.langlinks };
	},
	categories: data => {
		return { categories: data.categories.map(e => e.title) };
	},
	pageimages: data => {
		return {
			image: {
				name: data.pageimage,
				thumbnail: data.thumbnail
			}
		};
	}
};

export default class QueryChain {
	constructor(apiOptions, id) {
		this.id = id;
		this.apiOptions = apiOptions;
		this.params = { pageids: id };
		this.props = new Set();
	}

	/**
	 * Make combined API request
	 * @param {Object} params - Extra params to pass to the API
	 * @returns {Object}
	 */
	request(params = {}) {
		const props = [...this.props];
		const prop = props.join('|');
		return api(this.apiOptions, Object.assign(this.params, { prop }, params))
			.then(res => res.query.pages[this.id])
			.then(data => {
				return props.reduce((memo, prop) => {
					if (processors[prop]) Object.assign(memo, processors[prop](data));
					return memo;
				}, {});
			});
	}

	chain(prop, params = {}) {
		this.props.add(prop);
		Object.assign(this.params, params);
		return this;
	}

	// TODO: add geo

	content() {
		return this.chain('extracts', {
			explaintext: '1'
		});
	}

	summary() {
		return this.chain('extracts', {
			explaintext: '1',
			exintro: '1'
		});
	}

	images(types = { thumbnail: true, original: false, name: true }) {
		return this.chain('pageimages', {
			piprop: Object.keys(types)
				.filter(k => types[k])
				.join('|')
		});
	}

	extlinks() {
		return this.chain('extlinks', {
			ellimit: 'max'
		});
	}

	links(limit = 100) {
		return this.chain('links', {
			plnamespace: 0,
			pllimit: limit
		});
	}

	categories(limit = 100) {
		return this.chain('categories', {
			pllimit: limit
		});
	}

	coordinates() {
		return this.chain('coordinates');
	}

	info() {
		return this.chain('revisions', {
			rvprop: 'content',
			rvsection: 0
		});
	}

	langlinks() {
		return this.chain('langlinks', {
			lllimit: 'max',
			llprop: 'url'
		});
	}
}
