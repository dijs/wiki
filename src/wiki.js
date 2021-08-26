'use strict';

import { pagination, api, aggregate } from './util';
import wikiPage from './page';
import QueryChain from './chain';

/**
 * @namespace
 * @constant
 * @property {string} apiUrl - URL of Wikipedia API
 * @property {string} headers - Headers to pass through to the API request
 * @property {string} origin - When accessing the API using a cross-domain AJAX
 * request (CORS), set this to the originating domain. This must be included in
 * any pre-flight request, and therefore must be part of the request URI (not
 * the POST body). This must match one of the origins in the Origin header
 * exactly, so it has to be set to something like https://en.wikipedia.org or
 * https://meta.wikimedia.org. If this parameter does not match the Origin
 * header, a 403 response will be returned. If this parameter matches the Origin
 * header and the origin is whitelisted, an Access-Control-Allow-Origin header
 * will be set.
 */
const defaultOptions = {
	apiUrl: '//en.wikipedia.org/w/api.php',
	origin: '*'
};

/**
 * wiki
 * @example
 * wiki({ apiUrl: 'http://fr.wikipedia.org/w/api.php' }).search(...);
 * @namespace Wiki
 * @param  {Object} options
 * @return {Object} - wiki (for chaining methods)
 */
export default function wiki(options = {}) {
	if (this instanceof wiki) {
		// eslint-disable-next-line
		console.log(
			'Please do not use wikijs ^1.0.0 as a class. Please see the new README.'
		);
	}

	const apiOptions = Object.assign({}, defaultOptions, options);

	function handleRedirect(res) {
		if (res.query.redirects && res.query.redirects.length === 1) {
			return api(apiOptions, {
				prop: 'info|pageprops',
				inprop: 'url',
				ppprop: 'disambiguation',
				titles: res.query.redirects[0].to
			});
		}
		return res;
	}

	/**
	 * Search articles
	 * @example
	 * wiki.search('star wars').then(data => console.log(data.results.length));
	 * @example
	 * wiki.search('star wars').then(data => {
	 * 	data.next().then(...);
	 * });
	 * @method Wiki#search
	 * @param  {string} query - keyword query
	 * @param  {Number} [limit] - limits the number of results
	 * @param  {Boolean} [all] - returns entire article objects instead of just titles
	 * @return {Promise} - pagination promise with results and next page function
	 */
	function search(query, limit = 50, all = false) {
		return pagination(
			apiOptions,
			{
				list: 'search',
				srsearch: query,
				srlimit: limit
			},
			res =>
				res.query.search.map(article => {
					return all ? article : article.title;
				})
		).catch(err => {
			if (err.message === '"text" search is disabled.') {
				// Try backup search method
				return opensearch(query, limit);
			}
			throw err;
		});
	}

	/**
	 * Search articles using "fuzzy" prefixsearch
	 * @example
	 * wiki.prefixSearch('star wars').then(data => console.log(data.results.length));
	 * @example
	 * wiki.prefixSearch('star wars').then(data => {
	 * 	data.next().then(...);
	 * });
	 * @method Wiki#prefixSearch
	 * @param  {string} query - keyword query
	 * @param  {Number} [limit] - limits the number of results
	 * @return {Promise} - pagination promise with results and next page function
	 */
	function prefixSearch(query, limit = 50) {
		return pagination(
			apiOptions,
			{
				list: 'prefixsearch',
				pslimit: limit,
				psprofile: 'fuzzy',
				pssearch: query
			},
			res => res.query.prefixsearch.map(article => article.title)
		);
	}

	/**
	 * Opensearch (mainly used as a backup to normal text search)
	 * @param  {string} query - keyword query
	 * @param  {Number} limit - limits the number of results
	 * @return {Array}       List of page title results
	 */
	function opensearch(query, limit = 50) {
		return api(apiOptions, {
			search: query,
			limit,
			namespace: 0,
			action: 'opensearch',
			redirects: undefined
		}).then(res => res[1]);
	}

	/**
	 * Random articles
	 * @example
	 * wiki.random(3).then(results => console.log(results[0]));
	 * @method Wiki#random
	 * @param  {Number} [limit] - limits the number of random articles
	 * @return {Promise} - List of page titles
	 */
	function random(limit = 1) {
		return api(apiOptions, {
			list: 'random',
			rnnamespace: 0,
			rnlimit: limit
		}).then(res => res.query.random.map(article => article.title));
	}

	/**
	 * Get Page
	 * @example
	 * wiki.page('Batman').then(page => console.log(page.pageid));
	 * @method Wiki#page
	 * @param  {string} title - title of article
	 * @return {Promise}
	 */
	function page(title) {
		return api(apiOptions, {
			prop: 'info|pageprops',
			inprop: 'url',
			ppprop: 'disambiguation',
			titles: title
		})
			.then(handleRedirect)
			.then(res => {
				const id = Object.keys(res.query.pages)[0];
				if (!id || id === '-1') {
					throw new Error('No article found');
				}
				return wikiPage(res.query.pages[id], apiOptions);
			});
	}

	/**
	 * Get Page by PageId
	 * @example
	 * wiki.findById(4335).then(page => console.log(page.title));
	 * @method Wiki#findById
	 * @param {integer} pageid, id of the page
	 * @return {Promise}
	 */
	function findById(pageid) {
		return api(apiOptions, {
			prop: 'info|pageprops',
			inprop: 'url',
			ppprop: 'disambiguation',
			pageids: pageid
		})
			.then(handleRedirect)
			.then(res => {
				const id = Object.keys(res.query.pages)[0];
				if (!id || id === '-1') {
					throw new Error('No article found');
				}
				return wikiPage(res.query.pages[id], apiOptions);
			});
	}

	/**
	 * Find page by query and optional predicate
	 * @example
	 * wiki.find('luke skywalker').then(page => console.log(page.title));
	 * @method Wiki#find
	 * @param {string} search query
	 * @param {function} [predicate] - testing function for choosing which page result to fetch. Default is first result.
	 * @return {Promise}
	 */
	function find(query, predicate = results => results[0]) {
		return search(query)
			.then(res => predicate(res.results))
			.then(name => page(name));
	}

	/**
	 * Geographical Search
	 * @example
	 * wiki.geoSearch(32.329, -96.136).then(titles => console.log(titles.length));
	 * @method Wiki#geoSearch
	 * @param  {Number} lat - latitude
	 * @param  {Number} lon - longitude
	 * @param  {Number} [radius=1000] - search radius in meters (default: 1km)
	 * @param  {Number} [limit=10] - number of results (default: 10 results)
	 * @return {Promise} - List of page titles
	 */
	function geoSearch(lat, lon, radius = 1000, limit = 10) {
		return api(apiOptions, {
			list: 'geosearch',
			gsradius: radius,
			gscoord: `${lat}|${lon}`,
			gslimit: limit
		}).then(res => res.query.geosearch.map(article => article.title));
	}

	/**
	 * @summary Find the most viewed pages with counts
	 * @example
	 * wiki.mostViewed().then(list => console.log(`${list[0].title}: ${list[0].count}`))
	 * @method Wiki#mostViewed
	 * @returns {Promise} - Array of {title,count}
	 */
	function mostViewed() {
		return api(apiOptions, {
			list: 'mostviewed'
		}).then(res => {
			return res.query.mostviewed.map(({ title, count }) => ({ title, count }));
		});
	}

	/**
	 * Fetch all page titles in wiki
	 * @method Wiki#allPages
	 * @return {Array} Array of pages
	 */
	function allPages() {
		return aggregate(apiOptions, {}, 'allpages', 'title', 'ap');
	}

	/**
	 * Fetch all categories in wiki
	 * @method Wiki#allCategories
	 * @return {Array} Array of categories
	 */
	function allCategories() {
		return aggregate(apiOptions, {}, 'allcategories', '*', 'ac');
	}

	/**
	 * Fetch all pages in category
	 * @method Wiki#pagesInCategory
	 * @param  {String} category Category to fetch from
	 * @return {Array} Array of pages
	 */
	function pagesInCategory(category) {
		return aggregate(
			apiOptions,
			{
				cmtitle: category
			},
			'categorymembers',
			'title',
			'cm'
		);
	}

	/**
	 * @summary Helper function to query API directly
	 * @method Wiki#api
	 * @param {Object} params [https://www.mediawiki.org/wiki/API:Query](https://www.mediawiki.org/wiki/API:Query)
	 * @returns {Promise} Query Response
	 * @example
	 * wiki().api({
	 *	action: 'parse',
	 *	page: 'Pet_door'
	 * }).then(res => res.parse.title.should.equal('Pet door'));
	 */
	function rawApi(params) {
		return api(apiOptions, params);
	}

	/**
	 * @summary Returns a QueryChain to efficiently query specific data
	 * @method Wiki#chain
	 * @returns {QueryChain}
	 * @example
	 * // Find summaries and images of places near a specific location
	 * wiki()
	 *	.chain()
	 *	.geosearch(52.52437, 13.41053)
	 *	.summary()
	 *	.image()
	 *	.coordinates()
	 *	.request()
	 */
	function chain() {
		return new QueryChain(apiOptions);
	}

	return {
		search,
		random,
		page,
		geoSearch,
		options,
		findById,
		find,
		allPages,
		allCategories,
		pagesInCategory,
		opensearch,
		prefixSearch,
		mostViewed,
		api: rawApi,
		chain
	};
}
