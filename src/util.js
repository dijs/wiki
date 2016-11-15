import fetch from 'isomorphic-fetch';
import querystring from 'querystring';

const fetchOptions = {
	method: 'GET',
	headers: {
		'User-Agent': 'WikiJs/0.1 (https://github.com/dijs/wiki; richard.vanderdys@gmail.com)'
	}
};

export function api(apiOptions, params = {}) {
	const qs = Object.assign({}, params, {
		format: 'json',
		action: 'query',
		redirects: ''
	});
	const url = `${apiOptions.apiUrl}?${querystring.stringify(qs)}`;
	return fetch(url, fetchOptions).then(res => res.json());
}

export function pagination(apiOptions, params, parseResults) {
	return api(apiOptions, params)
		.then(res => {
			let resolution = {};
			resolution.results = parseResults(res);
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
