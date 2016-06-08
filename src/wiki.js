'use strict';

import 'babel-polyfill';
import fetch from 'isomorphic-fetch';
import _ from 'underscore';
import wikiInfoboxParser from 'wiki-infobox-parser-core';
import querystring from 'querystring';
import determiners from './determiners';

/**
 * @namespace
 * @property {string} apiUrl - URL of Wikipedia API
 */
let defaultOptions = {
	apiUrl: 'http://en.wikipedia.org/w/api.php'
};

const fetchOptions = {
	method: 'GET',
	headers: {
		'User-Agent': 'WikiJs/0.1 (https://github.com/dijs/wiki; richard.vanderdys@gmail.com)'
	}
};

function markupParser(data) {
	return new Promise((resolve, reject) => {
		wikiInfoboxParser(data, (err, resultString) => {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(resultString));
			}
		});
	});
}

/**
* Wiki
* @class
* @param  {Object} [options] - override options for API (only apiUrl for now)
* @return {Wiki}
*/
class Wiki {
	constructor(options) {
		this.options = Object.assign({}, defaultOptions, options || {});
	}
	api(params = {}) {
		const qs = _.extend(params, {
			format: 'json',
			action: 'query'
		});
		const url = `${this.options.apiUrl}?${querystring.stringify(qs)}`;
		return fetch(url, fetchOptions).then(res => res.json());
	}
	pagination(params, parseResults) {
		return this.api(params)
			.then((res) => {
				let resolution = {};
				resolution.results = parseResults(res);
				if (res['continue']) {
					const continueType = Object
						.keys(res['continue'])
						.filter(key => key !== 'continue')[0];
					const continueKey = res['continue'][continueType];
					params[continueType] = continueKey;
					resolution.next = () => this.pagination(params, parseResults);
				}
				return resolution;
			});
	}
	aggregatePagination(pagination, previousResults = []) {
		return pagination
			.then(res => {
				const results = previousResults.concat(res.results);
				if (res.next) {
					return this.aggregatePagination(res.next(), results);
				} else {
					return results;
				}
			});
	}
	/**
	 * Search articles
	 * @example
	 * new Wiki().search('star wars').then((data) => console.log(data.results.length));
	 * @example
	 * new Wiki().search('star wars').then((data) => {
	 * 	data.next().then(...);
	 * });
	 * @method Wiki#search
	 * @param  {string} query - keyword query
	 * @param  {Number} [limit] - limits the number of results
	 * @return {Promise} - pagination promise with results and next page function
	 */
	search(query, limit = 50) {
		return this.pagination({
			list: 'search',
			srsearch: query,
			srlimit: limit
		}, (res) => _.pluck(res.query.search, 'title'));
	}
	/**
	 * Random articles
	 * @method Wiki#random
	 * @param  {Number} [limit] - limits the number of random articles
	 * @return {Promise}
	 */
	random(limit = 1) {
		return this.api({
				list: 'random',
				rnnamespace: 0,
				rnlimit: limit
			})
			.then(res => _.pluck(res.query.random, 'title'));
	}
	/**
	 * Create Page Interface
	 * @example
	 * new Wiki().page('Batman').then((page) => console.log(page.pageid));
	 * @method Wiki#page
	 * @param  {string} title - title of article
	 * @return {Promise}
	 */
	page(title) {
		return this.api({
				prop: 'info|pageprops',
				inprop: 'url',
				ppprop: 'disambiguation',
				titles: title
			})
			.then(res => {
				let id = _.findKey(res.query.pages, (page) => page.title === title);
				if (!id) {
					throw new Error('No article found');
				} else {
					return new WikiPage(res.query.pages[id], this);
				}
			});
	}
	/**
	 * Geographical Search
	 * @method Wiki#geoSearch
	 * @param  {Number} lat - latitude
	 * @param  {Number} lon - longitude
	 * @param  {Number} [radius] - search radius in kilometers
	 * @return {Promise}
	 */
	geoSearch(lat, lon, radius = 1000) { // 1km
		return this.api({
				list: 'geosearch',
				gsradius: radius,
				gscoord: lat + '|' + lon
			})
			.then(res => _.pluck(res.query.geosearch, 'title'));
	}
}

/**
* Page Interface
* @class WikiPage
* @param  {Object} [props] - page properties from API page query
* @return {WikiPage}
*/
class WikiPage {
	constructor(props, wiki) {
		this.wiki = wiki;
		_.extend(this, props);
	}
	/**
	 * HTML from page
	 * @method WikiPage#html
	 * @return {Promise}
	 */
	html() {
		return this.wiki.api({
				prop: 'revisions',
				rvprop: 'content',
				rvlimit: 1,
				rvparse: '',
				titles: this.title
			})
			.then(res => res.query.pages[this.pageid].revisions[0]['*']);
	}
	/**
	 * Text content from page
	 * @method WikiPage#content
	 * @return {Promise}
	 */
	content() {
		return this.wiki.api({
				prop: 'extracts',
				explaintext: '',
				titles: this.title
			})
			.then(res => res.query.pages[this.pageid].extract);
	}
	/**
	 * Text summary from page
	 * @method WikiPage#summary
	 * @return {Promise}
	 */
	summary() {
		return this.wiki.api({
				prop: 'extracts',
				explaintext: '',
				exintro: '',
				titles: this.title
			})
			.then(res => res.query.pages[this.pageid].extract);
	}
	/**
	 * Image URL's from page
	 * @method WikiPage#images
	 * @return {Promise}
	 */
	images() {
		return this.wiki.api({
				generator: 'images',
				gimlimit: 'max',
				prop: 'imageinfo',
				iiprop: 'url',
				titles: this.title
			})
			.then(res => {
				let urls = null;
				if (res.query) {
					urls = _.chain(res.query.pages)
						.pluck('imageinfo')
						.flatten()
						.pluck('url')
						.value();
				} else {
					urls = [];
				}
				return urls;
			});
	}
	/**
	 * References from page
	 * @method WikiPage#references
	 * @return {Promise}
	 */
	references() {
		return this.wiki.api({
				prop: 'extlinks',
				ellimit: 'max',
				titles: this.title
			})
			.then(res => _.pluck(res.query.pages[this.pageid].extlinks, '*'));
	}
	/**
	 * Paginated links from page
	 * @method WikiPage#links
	 * @param  {Boolean} [aggregated] - return all links (default is true)
	 * @param  {Number} [limit] - number of links per page
	 * @return {Promise} - includes results [and next function for more results if not aggregated]
	 */
	links(aggregated = true, limit = 100) {
		let pagination = this.wiki.pagination({
			prop: 'links',
			plnamespace: 0,
			pllimit: limit,
			titles: this.title
		}, (res) => _.pluck(res.query.pages[this.pageid].links, 'title'));
		if (aggregated) {
			return this.wiki.aggregatePagination(pagination);
		} else {
			return pagination;
		}
	}
	/**
	 * Paginated categories from page
	 * @method WikiPage#categories
	 * @param  {Boolean} [aggregated] - return all categories (default is true)
	 * @param  {Number} [limit] - number of categories per page
	 * @return {Promise} - includes results [and next function for more results if not aggregated]
	 */
	categories(aggregated = true, limit = 100) {
		let pagination = this.wiki.pagination({
			prop: 'categories',
			pllimit: limit,
			titles: this.title
		}, (res) => _.pluck(res.query.pages[this.pageid].categories, 'title'));
		if (aggregated) {
			return this.wiki.aggregatePagination(pagination);
		} else {
			return pagination;
		}
	}
	/**
	 * Geographical coordinates from page
	 * @method WikiPage#coordinates
	 * @return {Promise}
	 */
	coordinates() {
		return this.wiki.api({
				prop: 'coordinates',
				titles: this.title
			})
			.then(res => res.query.pages[this.pageid].coordinates[0]);
	}
	/**
	 * Get info from page
	 * @method WikiPage#info
	 * @param  {String} key Information key (Optional)
	 * @return {Promise} - info Object contains key/value pairs of infobox data
	 */
	info(key) {
		return this.wiki.api({
				prop: 'revisions',
				rvprop: 'content',
				rvsection: 0,
				titles: this.title
			})
			.then(res => markupParser(JSON.stringify(res)))
			.then(metadata => {
				if (!key) {
					return metadata;
				}
				if (metadata.hasOwnProperty(key)) {
					return metadata[key];
				}
				if (determiners.hasOwnProperty(key)) {
					const value = determiners[key](metadata);
					if (value) {
						return value;
					}
				}
				return undefined;
			});
	}
	/**
	 * Paginated backlinks from page
	 * @method WikiPage#backlinks
	 * @param  {Boolean} [aggregated] - return all backlinks (default is true)
	 * @param  {Number} [limit] - number of backlinks per page
	 * @return {Promise} - includes results [and next function for more results if not aggregated]
	 */
	backlinks(aggregated = true, limit = 100) {
		let pagination = this.wiki.pagination({
			list: 'backlinks',
			bllimit: limit,
			bltitle: this.title
		}, (res) => _.pluck(res.query.backlinks, 'title'));
		if (aggregated) {
			return this.wiki.aggregatePagination(pagination);
		} else {
			return pagination;
		}
	}
}

/**
 * @module Wiki
 */
export default Wiki;
