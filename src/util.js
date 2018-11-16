import fetch from 'isomorphic-fetch';
import querystring from 'querystring';

const fetchOptions = {
	method: 'GET'	,
	mode: 'cors',
	credentials: 'omit'
};

export function api(apiOptions, params = {}) {
	const qs = Object.assign({
		format: 'json',
		action: 'query',
		redirects: ''
	}, params);
	// Remove undefined properties
	Object.keys(qs).forEach(key => {
		if (qs[key] === undefined) {
			delete qs[key];
		}
	});
	if (apiOptions.origin) {
		qs.origin = apiOptions.origin;
	}
	const url = `${apiOptions.apiUrl}?${querystring.stringify(qs)}`;
	return fetch(url, Object.assign({ headers: apiOptions.headers }, fetchOptions))
		.then(res => res.json())
		.then(res => {
			if (res.error) {
				throw new Error(res.error.info);
			}
			return res;
		});
}

export function pagination(apiOptions, params, parseResults) {
	return api(apiOptions, params)
		.then(res => {
			let resolution = {};
			resolution.results = parseResults(res);
			resolution.query = params.srsearch;
			if (res['continue']) {
				const continueType = Object
					.keys(res['continue'])
					.filter(key => key !== 'continue')[0];
				const continueKey = res['continue'][continueType];
				params[continueType] = continueKey;
				resolution.next = () => pagination(apiOptions, params, parseResults);
			}
			return resolution;
		});
}

export function aggregatePagination(pagination, previousResults = []) {
	return pagination
		.then(res => {
			const results = [...previousResults, ...res.results];
			if (res.next) {
				return aggregatePagination(res.next(), results);
			} else {
				return results;
			}
		});
}

const pageLimit = 500;

export function aggregate(apiOptions, params, list, key, prefix, results = []) {
	params.list = list;
	params[prefix + 'limit'] = pageLimit;
	return api(apiOptions, params)
		.then(res => {
			const nextResults = [...results, ...res.query[list].map(e => e[key])];
			const continueWith = res['query-continue'] || res.continue;
			if (continueWith) {
				const nextFromKey = (continueWith[list] && continueWith[list][prefix + 'from']) || continueWith[prefix + 'continue'];
				params[prefix + 'continue'] = nextFromKey;
				params[prefix + 'from'] = nextFromKey;
				return aggregate(apiOptions, params, list, key, prefix, nextResults);
			}
			return nextResults;
		});
}