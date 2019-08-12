// Definitions by: Balazs Mocsai <https://github.com/mbale>

declare module 'wikijs' {
	/**
	 * Default Options
	 *
	 * @interface Options
	 */
	interface Options {
		/**
		 * URL of Wikipedia API
		 *
		 * @type {string}
		 * @memberof Options
		 */
		apiUrl?: string;
		/**
		 * When accessing the API using a cross-domain AJAX request (CORS), set this to the originating domain.
		 * This must be included in any pre-flight request, and therefore must be part of the request URI (not the POST body).
		 * This must match one of the origins in the Origin header exactly, so it has to be set to something like https://en.wikipedia.org or https://meta.wikimedia.org.
		 * If this parameter does not match the Origin header, a 403 response will be returned.
		 * If this parameter matches the Origin header and the origin is whitelisted, an Access-Control-Allow-Origin header will be set.
		 *
		 * @type {string}
		 * @memberof Options
		 */
		origin?: string;
	}

	/**
	 * Coordinate object
	 *
	 * @interface Coordinates
	 */
	interface Coordinates {
		lat: number;
		lon: number;
		primary: string;
		globe: string;
	}

	/**
	 * Link object { lang, title }
	 *
	 * @interface Link
	 */
	interface Link {
		lang: string;
		title: string;
	}

	/**
	 * Image container
	 *
	 * @interface Image
	 */
	interface Image {
		ns: number;
		title: string;
		missing: string;
		known: string;
		imagerepository: string;
		imageinfo: object[];
	}

	interface Result {
		results: string[];
		query: string;
		next(): Promise<Result>;
	}

	/**
	 * WikiPage
	 *
	 * @interface Page
	 */
	interface Page {
		/**
		 * Paginated backlinks from page
		 *
		 * @param {boolean} aggregated
		 * @param {number} limit
		 * @returns {Promise<string[]>}
		 * @memberof Page
		 */
		backlinks(aggregated?: boolean, limit?: number): Promise<string[]>;

		/**
		 * Paginated categories from page
		 *
		 * @param {boolean} aggregated
		 * @param {number} limit
		 * @returns {Promise<string[]>}
		 * @memberof Page
		 */
		categories(aggregated?: boolean, limit?: number): Promise<string[]>;

		/**
		 * Text content from page
		 *
		 * @returns {Promise<string>}
		 * @memberof Page
		 */
		content(): Promise<string>;

		/**
		 * Geographical coordinates from page
		 *
		 * @returns {Promise<Coordinates>}
		 * @memberof Page
		 */
		coordinates(): Promise<Coordinates>;

		/**
		 * Get full information from page
		 *
		 * @returns {Promise<object>}
		 * @memberof Page
		 */
		fullInfo(): Promise<object>;

		/**
		 * HTML from page
		 *
		 * @returns {Promise<string>}
		 * @memberof Page
		 */
		html(): Promise<string>;

		/**
		 * Image URL's from page
		 *
		 * info Object contains key/value pairs of infobox data, or specific value if key given
		 * @returns {Promise<string[]>}
		 * @memberof Page
		 */
		images(): Promise<string[]>;

		/**
		 * Get information from page
		 *
		 * @param {string} [key]
		 * Information key. Falsy keys are ignored
		 * @returns {Promise<object>}
		 * @memberof Page
		 */
		info(key?: string): Promise<object>;

		/**
		 * Get list of links to different translations
		 *
		 * @returns {Promise<Link[]>}
		 * @memberof Page
		 */
		langlinks(): Promise<Link[]>;

		/**
		 * Paginated links from page
		 *
		 * @param {boolean} [aggregated]
		 * return all links (default is true)
		 * @param {number} [limit]
		 * number of links per page
		 * @returns {Promise<string[]>}
		 * @memberof Page
		 */
		links(aggregated?: boolean, limit?: number): Promise<string[]>;

		/**
		 * Main image URL from infobox on page
		 *
		 * @returns {Promise<string>}
		 * @memberof Page
		 */
		mainImage(): Promise<string>;

		/**
		 * Raw data from images from page
		 *
		 * @returns {Promise<Image[]>}
		 * @memberof Page
		 */
		rawImages(): Promise<Image[]>;

		/**
		 * References from page
		 *
		 * @returns {Promise<string[]>}
		 * @memberof Page
		 */
		references(): Promise<string[]>;

		/**
		 * Text summary from page
		 *
		 * @returns {Promise<string>}
		 * @memberof Page
		 */
		summary(): Promise<string>;

		/**
		 * Tables from page
		 *
		 * @returns {Promise<any>}
		 * @memberof Page
		 */
		tables(): Promise<any>;

		/**
		 * Get URL for wiki page
		 *
		 * @return {URL}
		 * @memberof Page
		 */
		url(): URL;
	}

	/**
	 * WikiJs is a node.js library which serves as an interface to Wikipedia (or any MediaWiki).
	 *
	 * @param {Options} [options]
	 */
	export default function WikiJS(
		options?: Options
	): {
		/**
		 * Get Page by PageId
		 *
		 * @param {string} pageID
		 * id of the page
		 * @returns {Promise<Page>}
		 */
		findById(pageID: string): Promise<Page>;

		/**
		 * Find page by query and optional predicate
		 * @example
		 * wiki.find('luke skywalker').then(page => console.log(page.title));
		 * @method Wiki#find
		 * @param {string} search query
		 * @param {function} [predicate] - testing function for choosing which page result to fetch. Default is first result.
		 * @return {Promise}
		 */
		find(query: string, predicate?: (pages: Page[]) => Page): Promise<Page>;

		/**
		 * Geographical Search
		 *
		 * @param {number} lat
		 * latitude
		 * @param {number} lon
		 * longitude
		 * @param {number} [radius]
		 * search radius in kilometers (default: 1km)
		 * @returns {Promise<string[]>}
		 */
		geoSearch(lat: number, lon: number, radius?: number): Promise<string[]>;

		/**
		 * Get Page
		 *
		 * @param {string} title
		 * title of article
		 * @returns {Promise<Page>}
		 */
		page(title: string): Promise<Page>;

		/**
		 * Random articles
		 *
		 * @param {number} [limit]
		 * limits the number of random articles
		 * @returns {Promise<string[]>}
		 */
		random(limit?: number): Promise<string[]>;

		/**
		 * Search articles
		 *
		 * @param {string} query
		 * keyword query
		 * @param {number} [limit]
		 * limits the number of results
		 * @returns {Promise<Result>}
		 */
		search(query: string, limit?: number): Promise<Result>;

		/**
		 * Search articles using "fuzzy" prefixsearch
		 *
		 * @param {string} query
		 * keyword query
		 * @param {number} [limit]
		 * limits the number of results
		 * @returns {Promise<Result>}
		 */
		prefixSearch(query: string, limit?: number): Promise<Result>;
	};
}
