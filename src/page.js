import determiners from './determiners';

import wikiInfoboxParser from 'wiki-infobox-parser-core';


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

export default function wikiPage(pageInfo, options) {
    // TODO: Export functions

    return pageInfo;
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
	 * Get information from page
	 * @example
	 * new Wiki().page('Batman').then(page => page.info('alter_ego'));
	 * @method WikiPage#info
	 * @param  {String} [key] - Information key
	 * @return {Promise} - info Object contains key/value pairs of infobox data, or specific value if key given
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
