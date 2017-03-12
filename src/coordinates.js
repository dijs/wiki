/**
 * Parses Coordinates for pages where the default Wiki Infobox Parser fails.
 * @param  {Object} infoboxData - raw data object from Wiki Infobox Parser
 * @return {Object} - formatted object containing coordinates, or null object if none.
 */
export function parseCoordinates(infoboxData) {
	if(infoboxData.coordinates) {
		// inline coordinate format
		return parseInfoboxCoords(infoboxData.coordinates);
	}
	else if(infoboxData.latd && infoboxData.longd) {
		// deprecated coordinate format
		return parseDeprecatedCoords(infoboxData.latd,infoboxData.longd);
	}else {
		return {
			lat: null,
			lon: null,
			error: 'No coordinates on page.'
		};
	}
}

// regex to match deprecated coordinates
const deprecatedCoordinatePattern = /(\d{1,3})\s*\|\s*\w{3,4}m=(\d{1,2})(?:\s*\|\s*\w{3,4}s=)?(\d{1,2})?\s*\|\s*\w+=([NSEW])/;

/**
 * Parses coordinates which are in Wikipedia Deprecated Format.
 * @example
 * parseDeprecatedCoords('00 |latm=47 |lats=59 |latNS=S','100 |longm=39 |longs=58 |longEW=E');
 * @param  {String} latString - Deprecated coordinate string for latitutde (from latd property)
 * @param  {String} lonString - Deprecated coordinate string for longitude (from longd property)
 * @return {Object} - Wiki formatted object containing lat and lon
 */
function parseDeprecatedCoords(latString,lonString) {
	var matches, latitude, longitude;
	matches = latString.match(deprecatedCoordinatePattern);
	latitude = dmsToDecimal(floatOrDefault(matches[1]),
		floatOrDefault(matches[2]),
		floatOrDefault(matches[3]),
		matches[4]);
	matches = lonString.match(deprecatedCoordinatePattern);
	longitude = dmsToDecimal(floatOrDefault(matches[1]),
		floatOrDefault(matches[2]),
		floatOrDefault(matches[3]),
		matches[4]);
	return wikiCoordinates(latitude,longitude);
}

// regex to match coordinate string in infobox
const infoboxCoordinatePattern = /\|(\d{1,2})\|(\d{1,2})\|(\d{1,2})?\|?([NSEW])\|(\d{1,3})\|(\d{1,2})\|(\d{1,2})?\|?([NSEW])/;

/**
 * Parses coordinates which are embedded in infobox instead of in the page.
 * @example
 * parseInfoboxCoord('{{coord|38|54|N|16|36|E|type:region:IT_type:city(94969)|display=inline}}')
 * @param  {String} coord - coordinate string from infobox.
 * @return {Object} - Wiki formatted object containing lat and lon
 */
function parseInfoboxCoords(coord) {
	var matches, latitude, longitude;
	matches = coord.match(infoboxCoordinatePattern);
	latitude = dmsToDecimal(floatOrDefault(matches[1]),
		floatOrDefault(matches[2]),
		floatOrDefault(matches[3]),
		matches[4]);
	longitude = dmsToDecimal(floatOrDefault(matches[5]),
		floatOrDefault(matches[6]),
		floatOrDefault(matches[7]),
		matches[8]);
	return wikiCoordinates(latitude,longitude);
}

/**
 * Converts coordinates from degrees, minutes, seconds, direction to decimal.
 * @example
 * dmsToDecimal(100,39,58,'W') == -100.6661111
 * @return {Number} - coordinate in decimal form, with proper positive / negative sign applied.
 */
const directions = {'N': 1, 'S': -1, 'E': 1, 'W': -1};
function dmsToDecimal(degrees,minutes,seconds,direction){
	return (degrees + (1/60)*minutes + (1/3600)*seconds) * (direction in directions ? directions[direction] : 1);
}

/**
 * Returns latitude and longitude in format Wikipedia Parser would do so.
 * Rounds to 4 decimal places.
 * @param  {Number} latitude - latitude in decimal form
 * @param  {Number} longitude - longitude in decimal form
 * @return {Object} - {lat: latitude, lon: longitude}
 */
function wikiCoordinates(latitude,longitude) {
	return {
		lat: Number(latitude.toFixed(4)),
		lon: Number(longitude.toFixed(4))
	};
}

/**
 * Convert numeric string to Number or return 0 if not possible
 * @example
 * floatOrDefault("5") == 5; floatOrDefault(undefined) == 0;
 * @param  {String} numStr - input number string (or undefined)
 * @return {Number} - returns numStr converted to Number or 0 if NaN
 */
function floatOrDefault(numStr) {
	var num = Number(numStr);
	return (!isNaN(num) ? num : 0);
}
