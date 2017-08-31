/**
 * @ignore
 * @description Parses Coordinates for pages where the default Wiki Infobox Parser fails.
 * @param  {Object} infoboxData - raw data object from Wiki Infobox Parser
 * @returns {Object} - formatted object containing coordinates, or null object if none.
 */
export function parseCoordinates(infoboxData) {
	if(infoboxData.coordinates) {
		return parseInfoboxCoords(infoboxData.coordinates);
	}
	if(infoboxData.latd && infoboxData.longd) {
		return parseDeprecatedCoords(infoboxData);
	}
	return {
		lat: null,
		lon: null,
		error: 'No coordinates on page.'
	};
}

/**
	* @ignore
 * @description Parses coordinates which are in Wikipedia Deprecated Format.
 * @example
 * parseDeprecatedCoords('00 |latm=47 |lats=59 |latNS=S','100 |longm=39 |longs=58 |longEW=E');
 * @param  {String} latString - Deprecated coordinate string for latitutde (from latd property)
 * @param  {String} lonString - Deprecated coordinate string for longitude (from longd property)
 * @returns {Object} - Wiki formatted object containing lat and lon
 */
function parseDeprecatedCoords(data) {
	const latitude = dmsToDecimal(
		floatOrDefault(data.latd),
		floatOrDefault(data.latm),
		floatOrDefault(data.lats),
		data.latNs
	);
	const longitude = dmsToDecimal(
		floatOrDefault(data.longd),
		floatOrDefault(data.longm),
		floatOrDefault(data.longs),
		data.longEw
	);
	return wikiCoordinates(latitude,longitude);
}

// regex to match coordinate string in infobox
const infoboxCoordinatePattern = /(\d{1,2})\|(\d{1,2})\|(\d{1,2})?\|?([NSEW])\|(\d{1,3})\|(\d{1,2})\|(\d{1,2})?\|?([NSEW])/;

/**
 * @ignore
 * @description Parses coordinates which are embedded in infobox instead of in the page.
 * @example
 * parseInfoboxCoord('{{coord|38|54|N|16|36|E|type:region:IT_type:city(94969)|display=inline}}')
 * @param  {String} coord - coordinate string from infobox.
 * @return {Object} - Wiki formatted object containing lat and lon
 */
function parseInfoboxCoords(coord) {
	let matches, latitude, longitude;
	matches = coord.match(infoboxCoordinatePattern);
	latitude = convertCoordinatesFromStrings(matches.slice(0,4));
	longitude = convertCoordinatesFromStrings(matches.slice(4));
	return wikiCoordinates(latitude,longitude);
}

/**
	* @ignore
 * @description Converts coordinates after they've been separated into components by regex matching.
 * Missing or undefined elements in array will be treated as 0. Missing direction will
 * result in positive coordinate.
 * @example
 * convertCoordinatesFromStrings(['38','54','23','N'])
 * @param {Array} matches - array in format ['degrees','minutes','seconds','direction']
 * @returns {Number} - coordinate in decimal form, with proper positive / negative sign applied.
 */
function convertCoordinatesFromStrings(matches) {
	return dmsToDecimal(floatOrDefault(matches[1]),
		floatOrDefault(matches[2]),
		floatOrDefault(matches[3]),
		matches[4]);
}

// simplifies positive / negative calculation in decimal conversion
const directions = {'N': 1, 'S': -1, 'E': 1, 'W': -1};

/**
 * @ignore
 * @description Converts coordinates from degrees, minutes, seconds, direction to decimal.
 * @example
 * dmsToDecimal(100,39,58,'W') == -100.6661111
 * @returns {Number} - coordinate in decimal form, with proper positive / negative sign applied.
 */
function dmsToDecimal(degrees,minutes,seconds,direction) {
	return (degrees + (1/60)*minutes + (1/3600)*seconds) * (directions[direction] || 1);
}

/**
 * @ignore
 * @description Returns latitude and longitude in format Wikipedia Parser would do so.
 * Rounds to 4 decimal places.
 * @param  {Number} latitude - latitude in decimal form
 * @param  {Number} longitude - longitude in decimal form
 * @returns {Object} - {lat: latitude, lon: longitude}
 */
function wikiCoordinates(latitude,longitude) {
	return {
		lat: Number(latitude.toFixed(4)),
		lon: Number(longitude.toFixed(4))
	};
}

/**
 * @ignore
 * @description Convert numeric string to Number or return 0 if not possible
 * @example
 * floatOrDefault("5") == 5; floatOrDefault(undefined) == 0;
 * @param  {String} numStr - input number string (or undefined)
 * @returns {Number} - returns numStr converted to Number or 0 if NaN
 */
function floatOrDefault(numStr) {
	const num = Number(numStr);
	return (!isNaN(num) ? num : 0);
}
