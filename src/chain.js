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
		return {
			langlinks: data.langlinks.map(link => {
				return {
					lang: link.lang,
					title: link['*'],
					url: link.url
				};
			})
		};
	},
	coordinates: data => {
		if (data.coordinates) {
			return { coordinates: data.coordinates[0] };
		} else {
			return {};
		}
	},
	categories: data => {
		return { categories: data.categories.map(e => e.title) };
	},
	pageimages: data => {
		return {
			image: {
				name: data.pageimage,
				thumbnail: data.thumbnail,
				original: data.original
			}
		};
	}
};

function process(props, rawPageData) {
	const data = { title: rawPageData.title };
	return props.reduce((memo, prop) => {
		if (processors[prop]) Object.assign(memo, processors[prop](rawPageData));
		return memo;
	}, data);
}

/**
 * Chain API requests together
 * @example
 * // Get page summary and images in same request
 * wiki.page('batman').then(page => page.chain().summary().image().request()).then(console.log);
 * @namespace QueryChain
 */
export default class QueryChain {
	constructor(apiOptions, id) {
		this.id = id;
		this.apiOptions = apiOptions;
		this._params = { pageids: id };
		this.props = new Set();
	}

	params() {
		const prop = [...this.props].join('|');
		return Object.assign({}, this._params, { prop });
	}

	direct(key, ...args) {
		return this[key](...args)
			.request()
			.then(res => res[key]);
	}

	// TODO: Add page searches for root calls - generators

	// TODO: Add pagination helper method

	/**
	 * Make combined API request
	 * @method QueryChain#request
	 * @returns {Object|Array} - Data object(s) depending on where the chain was created from
	 */
	request() {
		const props = [...this.props];
		return api(this.apiOptions, this.params())
			.then(res => {
				if (this.id) {
					return res.query.pages[this.id];
				} else {
					return Object.values(res.query.pages);
				}
			})
			.then(data => {
				if (Array.isArray(data)) {
					return data.map(e => process(props, e));
				} else {
					return process(props, data);
				}
			});
	}

	chain(prop, params = {}) {
		if (prop) {
			this.props.add(prop);
		}
		Object.assign(this._params, params);
		return this;
	}

	/**
	 * @summary Finds pages near a specific point
	 * @method QueryChain#geosearch
	 * @returns {QueryChain}
	 */
	geosearch(latitude, longitude, radius) {
		return this.chain(undefined, {
			generator: 'geosearch',
			ggsradius: radius,
			ggscoord: `${latitude}|${longitude}`
		});
	}

	search(query, limit = 50) {
		return this.chain(undefined, {
			list: 'search',
			srsearch: query,
			srlimit: limit
		});
	}

	/**
	 * @summary Useful for extracting structured section content
	 * @method QueryChain#content
	 * @returns {QueryChain}
	 */
	content() {
		return this.chain('extracts', {
			explaintext: '1'
		});
	}

	/**
	 * @summary Useful for extracting summary content
	 * @method QueryChain#summary
	 * @returns {QueryChain}
	 */
	summary() {
		return this.chain('extracts', {
			explaintext: '1',
			exintro: '1'
		});
	}

	/**
	 * @summary Extract image
	 * @method QueryChain#image
	 * @returns {QueryChain}
	 */
	image(types = { thumbnail: true, original: false, name: true }) {
		return this.chain('pageimages', {
			piprop: Object.keys(types)
				.filter(k => types[k])
				.join('|')
		});
	}

	/**
	 * @summary Extract external links
	 * @method QueryChain#extlinks
	 * @returns {QueryChain}
	 */
	extlinks() {
		return this.chain('extlinks', {
			ellimit: 'max'
		});
	}

	/**
	 * @summary Extract page links
	 * @method QueryChain#links
	 * @returns {QueryChain}
	 */
	links(limit = 100) {
		return this.chain('links', {
			plnamespace: 0,
			pllimit: limit
		});
	}

	/**
	 * @summary Extract categories
	 * @method QueryChain#categories
	 * @returns {QueryChain}
	 */
	categories(limit = 100) {
		return this.chain('categories', {
			pllimit: limit
		});
	}

	/**
	 * @summary Extract coordinates
	 * @method QueryChain#coordinates
	 * @returns {QueryChain}
	 */
	coordinates() {
		return this.chain('coordinates');
	}

	/**
	 * @summary Get list of links to different translations
	 * @method QueryChain#langlinks
	 * @returns {QueryChain}
	 */
	langlinks() {
		return this.chain('langlinks', {
			lllimit: 'max',
			llprop: 'url'
		});
	}
}
