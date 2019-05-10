import fetch from 'cross-fetch';
import querystring from 'querystring';

const fetchOptions = {
	method: 'GET',
	mode: 'cors',
	credentials: 'omit'
};

export function api(apiOptions, params = {}) {
	const qs = Object.assign(
		{
			format: 'json',
			action: 'query',
			redirects: ''
		},
		params
	);
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
	return fetch(
		url,
		Object.assign({ headers: apiOptions.headers }, fetchOptions)
	)
		.then(res => res.json())
		.then(res => {
			if (res.error) {
				throw new Error(res.error.info);
			}
			return res;
		});
}

export function pagination(apiOptions, params, parseResults) {
	return api(apiOptions, params).then(res => {
		let resolution = {};
		resolution.results = parseResults(res);
		resolution.query = params.srsearch;
		if (res['continue']) {
			const continueType = Object.keys(res['continue']).filter(
				key => key !== 'continue'
			)[0];
			const continueKey = res['continue'][continueType];
			params[continueType] = continueKey;
			resolution.next = () => pagination(apiOptions, params, parseResults);
		}
		return resolution;
	});
}

export function aggregatePagination(pagination, previousResults = []) {
	return pagination.then(res => {
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
	return api(apiOptions, params).then(res => {
		const nextResults = [...results, ...res.query[list].map(e => e[key])];
		const continueWith = res['query-continue'] || res.continue;
		if (continueWith) {
			const nextFromKey =
				(continueWith[list] && continueWith[list][prefix + 'from']) ||
				continueWith[prefix + 'continue'];
			params[prefix + 'continue'] = nextFromKey;
			params[prefix + 'from'] = nextFromKey;
			return aggregate(apiOptions, params, list, key, prefix, nextResults);
		}
		return nextResults;
	});
}

const headingPattern = /(==+)(?:(?!\n)\s?)((?:(?!==|\n)[^])+)(?:(?!\n)\s?)(==+)/g;

function getHeadings(text) {
	let match;
	const matches = [];
	while ((match = headingPattern.exec(text)) !== null) {
		matches.push({
			level: match[1].trim().length,
			text: match[2].trim(),
			start: match.index,
			end: match.index + match[0].length
		});
	}
	return matches;
}

export function parseContent(source) {
	const headings = getHeadings(source);

	const minLevel = Math.min(...headings.map(({ level }) => level));

	const sections = headings.map((heading, index) => {
		const next = headings[index + 1];
		const content = source
			.substring(heading.end, next ? next.start : undefined)
			.trim();
		return {
			title: heading.text,
			level: heading.level - minLevel,
			id: index,
			content,
			items: []
		};
	});

	const lastParentLevel = (index, level) => {
		if (level === 0) return null;
		for (let i = index - 1; i >= 0; i--) {
			if (sections[i].level < level) {
				return sections[i].id;
			}
		}
		return null;
	};

	// Set parents
	sections.forEach((section, index) => {
		section.parent = lastParentLevel(index, section.level);
	});

	const root = {
		items: []
	};

	const findSection = id => sections.find(s => id === s.id);

	// Organize
	sections.forEach(section => {
		if (section.parent === null) {
			root.items.push(section);
		} else {
			findSection(section.parent).items.push(section);
		}
	});

	// Clean up
	sections.forEach(section => {
		delete section.id;
		delete section.parent;
		delete section.level;
		if (!section.items.length) {
			delete section.items;
		}
	});

	return root.items;
}
