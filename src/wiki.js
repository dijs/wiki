'use strict';

import { pagination, api } from './util';
import wikiPage from './page';

/**
 * @namespace
 * @constant
 * @property {string} apiUrl - URL of Wikipedia API
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
	apiUrl: 'http://fr.wikipedia.org/w/api.php',
        origin: null,
        prop: 'revisions',
        rvprop:'content',
        action:'query',
        format:'json',
        ppprop: null,
        inprop: null,
        redirects: null
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
		console.log('Please do not use wikijs ^1.0.0 as a class. Please see the new README.'); // eslint-disable-line
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
	 * @return {Promise} - pagination promise with results and next page function
	 */
	function search(query, limit = 50) {
		return pagination(apiOptions, {
			list: 'search',
			srsearch: query,
			srlimit: limit
		}, res => res.query.search.map(article => article.title));
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
			})
			.then(res => res.query.random.map(article => article.title));
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
	 * wiki.findById('Batman').then(page => console.log(page.title));
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
			})

	}

	/**
	 * Geographical Search
	 * @example
	 * wiki.geoSearch(32.329, -96.136).then(titles => console.log(titles.length));
	 * @method Wiki#geoSearch
	 * @param  {Number} lat - latitude
	 * @param  {Number} lon - longitude
	 * @param  {Number} [radius=1000] - search radius in kilometers (default: 1km)
	 * @return {Promise} - List of page titles
	 */
	function geoSearch(lat, lon, radius = 1000) {
		return api(apiOptions, {
				list: 'geosearch',
				gsradius: radius,
				gscoord: `${lat}|${lon}`
			})
			.then(res => res.query.geosearch.map(article => article.title));
	}

	return {
		search,
		random,
		page,
		geoSearch,
		options,
		findById
	};
}
