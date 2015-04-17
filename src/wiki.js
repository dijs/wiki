'use strict';

import request from 'request-promise';
import _ from 'underscore';
import markupParser from './wiki-markup-parser';

let defaultOptions = {
	apiUrl: 'http://en.wikipedia.org/w/api.php'
};

class Wiki {
	constructor(options) {
		this.options = _.extend(options || {}, defaultOptions);
	}
	api(params) {
		return new Promise((resolve, reject) => {
			request.get({
					uri: this.options.apiUrl,
					qs: _.extend(params, {
						format: 'json',
						action: 'query'
					}),
					headers: {
						'User-Agent': 'WikiJs/0.1 (https://github.com/dijs/wiki; richard.vanderdys@gmail.com)'
					}
				})
				.then((res) => resolve(JSON.parse(res)))
				.catch(reject);
		});
	}
	pagination(params, parseResults) {
		return new Promise((resolve, reject) => {
			this.api(params)
				.then((res) => {
					let resolution = {};
					resolution.results = parseResults(res);
					if (res['query-continue']) {
						let type = Object.keys(res['query-continue'])[0];
						let continueKey = Object.keys(res['query-continue'][type])[0];
						params[continueKey] = res['query-continue'][type][continueKey];
						resolution.next = () => this.pagination(params, parseResults);
					}
					resolve(resolution);
				})
				.catch(reject);
		});
	}
	aggregatePagination(pagination, allResults = []) {
		return new Promise((resolve, reject) => {
			pagination
				.then((res) => {
					res.results.forEach((result) => allResults.push(result));
					if (res.next) {
						resolve(this.aggregatePagination(res.next(), allResults));
					} else {
						resolve(allResults);
					}
				})
				.catch(reject);
		});
	}
	search(query, limit = 50) {
		return this.pagination({
			list: 'search',
			srsearch: query,
			srlimit: limit
		}, (res) => _.pluck(res.query.search, 'title'));
	}
	random(limit = 1) {
		return new Promise((resolve, reject) => {
			this.api({
					list: 'random',
					rnnamespace: 0,
					rnlimit: limit
				})
				.then((res) => resolve(_.pluck(res.query.random, 'title')))
				.catch(reject);
		});
	}
	page(title) {
		return new Promise((resolve, reject) => {
			this.api({
					prop: 'info|pageprops',
					inprop: 'url',
					ppprop: 'disambiguation',
					titles: title
				})
				.then((res) => {
					let id = _.findKey(res.query.pages, (page) => page.title === title);
					if (!id) {
						reject(new Error('No article found'));
					} else {
						resolve(new WikiPage(res.query.pages[id], this));
					}
				})
				.catch(reject);
		});
	}
	geoSearch(lat, lon, radius = 1000) { // 1km
		return new Promise((resolve, reject) => {
			this.api({
					list: 'geosearch',
					gsradius: radius,
					gscoord: lat + '|' + lon
				})
				.then((res) => resolve(_.pluck(res.query.geosearch, 'title')))
				.catch(reject);
		});
	}
}

class WikiPage {
	constructor(props, wiki) {
		this.wiki = wiki;
		_.extend(this, props);
	}
	html() {
		return new Promise((resolve, reject) => {
			this.wiki.api({
					prop: 'revisions',
					rvprop: 'content',
					rvlimit: 1,
					rvparse: '',
					titles: this.title
				})
				.then((res) => resolve(res.query.pages[this.pageid].revisions[0]['*']))
				.catch(reject);
		});
	}
	content() {
		return new Promise((resolve, reject) => {
			this.wiki.api({
					prop: 'extracts',
					explaintext: '',
					titles: this.title
				})
				.then((res) => resolve(res.query.pages[this.pageid].extract))
				.catch(reject);
		});
	}
	summary() {
		return new Promise((resolve, reject) => {
			this.wiki.api({
					prop: 'extracts',
					explaintext: '',
					exintro: '',
					titles: this.title
				})
				.then((res) => resolve(res.query.pages[this.pageid].extract))
				.catch(reject);
		});
	}
	images() {
		return new Promise((resolve, reject) => {
			this.wiki.api({
					generator: 'images',
					gimlimit: 'max',
					prop: 'imageinfo',
					iiprop: 'url',
					titles: this.title
				})
				.then((res) => resolve(_.chain(res.query.pages).pluck('imageinfo').flatten().pluck('url').value()))
				.catch(reject);
		});
	}
	references() {
		return new Promise((resolve, reject) => {
			this.wiki.api({
					prop: 'extlinks',
					ellimit: 'max',
					titles: this.title
				})
				.then((res) => resolve(_.pluck(res.query.pages[this.pageid].extlinks, '*')))
				.catch(reject);
		});
	}
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
	coordinates() {
		return new Promise((resolve, reject) => {
			this.wiki.api({
					prop: 'coordinates',
					titles: this.title
				})
				.then((res) => resolve(res.query.pages[this.pageid].coordinates[0]))
				.catch(reject);
		});
	}
	info() {
		return new Promise((resolve, reject) => {
			this.wiki.api({
					prop: 'revisions',
					rvprop: 'content',
					rvsection: 0,
					titles: this.title
				})
				.then((res) => resolve(markupParser(res.query.pages[this.pageid].revisions[0]['*'])))
				.catch(reject);
		});
	}
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

export default Wiki;