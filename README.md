# WikiJs

WikiJs is a simple node.js library which serves as an interface to Wikipedia.

This project started as just a test application in order to learn [Kal](http://rzimmerman.github.io/kal/), but hopefully
this can serve as a helpful tool for others!

## Build it yourself

In order to build, you will need the latest version of Kal globally installed on your machine.

You can run these commands in order to build and test WikiJs:

```
git clone git@github.com:rompetoto/wiki.git
cd wiki
npm install
grunt
```

## Usage

#### Load in library

```
var Wiki = require("wikijs");
```

#### Search Wikipedia for articles

```
/**
 * @param {string} query - The search query.
 * @param {number} limit - The number of results. (Optional: Default is 10)
 * @param {boolean} suggestion - Allow  Wikipedia to return a suggested article (Optional: Default is true)
 * @param {function} callback - Callback with parameters (error, results, suggestion)
 */
Wiki.search("joker comics", 3, function(err, results){
    // results = ['Joker (comics)', 'Joker (comic book)', 'DC Comics']
});
```

#### Obtain random articles

```
/**
 * @param {number} pages - The number of random articles. (Optional: Default is 1)
 * @param {function} callback - Callback with parameters (error, results)
 */
Wiki.random(function(err, results){
	// results = ['Star Wars']
});
```

#### Get page from article title

```
/** 
 * @param {string} title - Article title
 * @param {boolean} autoSuggest - Allow Wikipedia to return a suggested article (Optional: Default is true
 * @param {function} callback - Callback with parameters (error, page)
 */
Wiki.page("Batman", function(err, page){
	// page = WikiPage object for 'Batman' article
});
```

#### Search for articles by geographical coordinates

```
/**
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Radial search distance in meters (Optional: Default is 1km)
 * @param {function} callback - Callback with parameters (error, results)
 */
Wiki.geoSearch(36.109,-115.178, function(err, results){
	// results = ['Las Vegas']
});
```

## Page methods

```
page.html(function(err, html){
	// html of the article
});

page.content(function(err, content){
	// content of the article
});

page.summary(function(err, summary){
	// summary of the article
});

page.images(function(err, images){
	// list of image URL's in the article
});

page.references(function(err, references){
	// list of reference URL's in the article
});

/**
 * @param {number} limit - Number of results (Optional: Default is max)
 */	
page.links(function(err, links){
	// list of links in the article
});

/**
 * @param {number} limit - Number of results (Optional: Default is max)
 */	
page.categories(function(err, categories){
	// list of categories the article belongs to
});

/**
 * @param {string} category - Category to check
 */	
page.withinCategory(function(err, result){
	// result of category check
});

page.coordinates(function(err, coordinates){
	// get the geographical coordinates of the article, if any
});

page.infobox(function(err, info){
	// get a JSON object filled with data from the article's infobox
});

/**
 * @param {number} limit - Number of results (Optional: Default is max)
 */	
page.backlinks(function(err, backlinks){
	// list of backlink URL's in the article
});

```
