import _ from 'underscore';
import { aggregatePagination, pagination, api } from './util';
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

/**
 * WikiPage
 * @namespace WikiPage
 */
export default function wikiPage(rawPageInfo, apiOptions) {

	const raw = rawPageInfo;

	/**
	 * HTML from page
	 * @example
	 * wiki.page('batman').then(page => page.html()).then(console.log);
	 * @method WikiPage#html
	 * @return {Promise}
	 */
	function html() {
		return api(apiOptions, {
				prop: 'revisions',
				rvprop: 'content',
				rvlimit: 1,
				rvparse: '',
				titles: raw.title
			})
			.then(res => res.query.pages[raw.pageid].revisions[0]['*']);
	}

	/**
	 * Text content from page
	 * @example
	 * wiki.page('batman').then(page => page.content()).then(console.log);
	 * @method WikiPage#content
	 * @return {Promise}
	 */
	function content() {
		return api(apiOptions, {
				prop: 'extracts',
				explaintext: '',
				titles: raw.title
			})
			.then(res => res.query.pages[raw.pageid].extract);
	}

	/**
	 * Text summary from page
	 * @example
	 * wiki.page('batman').then(page => page.summary()).then(console.log);
	 * @method WikiPage#summary
	 * @return {Promise}
	 */
	function summary() {
		return api(apiOptions, {
				prop: 'extracts',
				explaintext: '',
				exintro: '',
				titles: raw.title
			})
			.then(res => res.query.pages[raw.pageid].extract);
	}

	/**
	 * Image URL's from page
	 * @example
	 * wiki.page('batman').then(page => page.image()).then(console.log);
	 * @method WikiPage#images
	 * @return {Promise}
	 */
	function images() {
		return api(apiOptions, {
				generator: 'images',
				gimlimit: 'max',
				prop: 'imageinfo',
				iiprop: 'url',
				titles: raw.title
			})
			.then(res => {
				if (res.query) {
					return _.chain(res.query.pages)
						.pluck('imageinfo')
						.flatten()
						.pluck('url')
						.value();
				}
				return [];
			});
	}

	/**
	 * References from page
	 * @example
	 * wiki.page('batman').then(page => page.references()).then(console.log);
	 * @method WikiPage#references
	 * @return {Promise}
	 */
	function references() {
		return api(apiOptions, {
				prop: 'extlinks',
				ellimit: 'max',
				titles: raw.title
			})
			.then(res => _.pluck(res.query.pages[raw.pageid].extlinks, '*'));
	}

	/**
	 * Paginated links from page
	 * @example
	 * wiki.page('batman').then(page => page.links()).then(console.log);
	 * @method WikiPage#links
	 * @param  {Boolean} [aggregated] - return all links (default is true)
	 * @param  {Number} [limit] - number of links per page
	 * @return {Promise} - returns results if aggregated [and next function for more results if not aggregated]
	 */
	function links(aggregated = true, limit = 100) {
		const _pagination = pagination(apiOptions, {
			prop: 'links',
			plnamespace: 0,
			pllimit: limit,
			titles: raw.title
		}, res => _.pluck(res.query.pages[raw.pageid].links, 'title'));
		if (aggregated) {
			return aggregatePagination(_pagination);
		}
		return _pagination;
	}

	/**
	 * Paginated categories from page
	 * @example
	 * wiki.page('batman').then(page => page.categories()).then(console.log);
	 * @method WikiPage#categories
	 * @param  {Boolean} [aggregated] - return all categories (default is true)
	 * @param  {Number} [limit] - number of categories per page
	 * @return {Promise} - returns results if aggregated [and next function for more results if not aggregated]
	 */
	function categories(aggregated = true, limit = 100) {
		const _pagination = pagination(apiOptions, {
			prop: 'categories',
			pllimit: limit,
			titles: raw.title
		}, res => _.pluck(res.query.pages[raw.pageid].categories, 'title'));
		if (aggregated) {
			return aggregatePagination(_pagination);
		}
		return _pagination;
	}

	/**
	 * Geographical coordinates from page
	 * @example
	 * wiki().page('Texas').then(texas => texas.coordinates())
	 * @method WikiPage#coordinates
	 * @return {Promise}
	 */
	function coordinates() {
		return api(apiOptions, {
				prop: 'coordinates',
				titles: raw.title
			})
			.then(res => res.query.pages[raw.pageid].coordinates[0]);
	}

	/**
	 * Get information from page
	 * @example
	 * new Wiki().page('Batman').then(page => page.info('alter_ego'));
	 * @method WikiPage#info
	 * @param  {String} [key] - Information key
	 * @return {Promise} - info Object contains key/value pairs of infobox data, or specific value if key given
	 */
	function info(key) {
		return api(apiOptions, {
				prop: 'revisions',
				rvprop: 'content',
				rvsection: 0,
				titles: raw.title
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
	function backlinks(aggregated = true, limit = 100) {
		const _pagination = pagination(apiOptions, {
			list: 'backlinks',
			bllimit: limit,
			bltitle: raw.title
		}, res => _.pluck(res.query.backlinks, 'title'));
		if (aggregated) {
			return aggregatePagination(_pagination);
		}
		return _pagination;
	}

	const page = {
		raw,
		html,
		content,
		summary,
		images,
		references,
		links,
		categories,
		coordinates,
		info,
		backlinks
	};

  return page;
}
