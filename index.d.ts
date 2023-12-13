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
		/**
		 * The Headers sent to be sent along with the request 
		 *
		 * @type {HeadersInit}
		 * @memberof Options
		 */
		headers?: HeadersInit;
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

	/**
	 * Page section object
	 *
	 * @interface PageSection
	 */
	interface PageSection {
		title: string;
		content: string;
		items?: PageSection[];
	}

	interface Result {
		results: string[];
		query: string;
		next(): Promise<Result>;
	}

	interface RawPage {
		pageid: number;
		ns: number;
		title: string;
		touched: string;
		lastrevid: number;
		counter: number;
		length: number;
		fullurl: string;
		editurl: string;
	}

	/**
	 * WikiPage
	 *
	 * @interface Page
	 */
	interface Page {
		raw: RawPage;
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
		 * Array of page sections
		 *
		 * @returns {Promise<PageSection[]>}
		 * @memberof Page
		 */
		content(): Promise<PageSection[]>;

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
		 * Raw content from page
		 * 
		 * @returns {Promise<string>}
		 * @memberof Page
		 */
		rawContent(): Promise<string>;

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
		 * @return {String}
		 * @memberof Page
		 */
		url(): string;
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
		 * Fetch all page titles in wiki
		 * @method Wiki#allPages
		 * @return {Array} Array of pages
		 */
		allPages(): Promise<string[]>;

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
		 * Opensearch (mainly used as a backup to normal text search)
		 * @param  {string} query - keyword query
		 * @param  {Number} limit - limits the number of results
		 * @return {Promise<string[]>}       List of page title results
		 */
		opensearch(query: string, limit?: number): Promise<string[]>;

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

		/**
		 * @summary Find the most viewed pages with counts
		 * @example
		 * wiki.mostViewed().then(list => console.log(`${list[0].title}: ${list[0].count}`))
		 * @method Wiki#mostViewed
		 * @returns {Promise} - Array of {title,count}
		 */
		mostViewed(): Promise<{ title: string; count: number }[]>;

		/**
		   * Fetch all page titles in wiki
		   * @method Wiki#allPages
		   * @return {Promise<string[]>} Array of pages
		   */
		allPages(): Promise<string[]>;

		/**
		 * Fetch all categories in wiki
		 * @method Wiki#allCategories
		 * @return {Promise<string[]>} Array of categories
		 */
		allCategories(): Promise<string[]>;

		/**
		 * Fetch all pages in category
		 * @method Wiki#pagesInCategory
		 * @param  {String} category Category to fetch from
		 * @return {Promise<string[]>} Array of pages
		 */
		pagesInCategory(category: string): Promise<string[]>;
	};
}
