import fetch from 'isomorphic-fetch';
import querystring from 'querystring';

const fetchOptions = {
	method: 'GET'	,
	mode: 'cors',
	credentials: 'omit'
};

export function api(apiOptions, params = {}) {
	const qs = Object.assign({}, params, {
		format: 'json',
		action: 'query',
		redirects: ''
	});
	if (apiOptions.origin) {
		qs.origin = apiOptions.origin;
	}
	const url = `${apiOptions.apiUrl}?${querystring.stringify(qs)}`;
	return fetch(url, fetchOptions)
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
