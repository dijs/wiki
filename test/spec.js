import 'should-promised';
import Wiki from './wiki';

let wiki = new Wiki();

describe('Wiki Methods', () => {

	it('Search should find an article', () => {
		return wiki.search('kevin bacon number').should.eventually.have.property('results').containEql('Six degrees of separation');
	});

	it('Search should limit properly', () => {
		return wiki.search('batman', 7).should.eventually.have.property('results').with.length(7);
	});

	it('Random should return the correct number of results', () => {
		return wiki.random(3).should.eventually.have.length(3);
	});

	it('Should return correct page', () => {
		return wiki.page('Batman').should.eventually.have.property('pageid', 4335);
	});

	it('Should return page from coordinates', () => {
		return wiki.geoSearch(32.329, -96.136).should.eventually.containEql('Gun Barrel City, Texas');
	});

});

describe('Page Methods', () => {
	
	let page;

	before((done) => {
		wiki.page('Luke Skywalker').then((p) => {
			page = p;
			done();
		});
	});

	it('should get html from an article', () => {
		return page.html().should.eventually.containEql('<b>Luke Skywalker</b>');
	});

	it('should get content from an article', () => {
		return page.content().should.eventually.containEql('Star Wars');
	});

	it('should get summary from an article', () => {
		return page.summary().should.eventually.containEql('Mark Hamill');
	});

	it('should get images from an article', () => {
		return page.images().should.eventually.containEql('http://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png');
	});

	it('should get references from an article', () => {
		return page.references().should.eventually.containEql('http://www.starwars.com/databank/luke-skywalker');
	});

	it('should get links from an article', () => {
		return page.links().should.eventually.containEql('Jedi');
	});

	it('should get categories from an article', () => {
		return page.categories().should.eventually.containEql('Category:Fictional farmers');
	});

	it('should get backlinks from an article', () => {
		return page.backlinks().should.eventually.containEql('Jedi');
	});

	it('should get coordinates from an article', (done) => {
		wiki.page('Texas').then((texas) => {
			texas.coordinates().then((coords) => {
				coords.should.have.properties({
					lat: 31,
					lon: -100
				});
				done();
			});
		});
	});

	it('should get info', () => {
		return page.info().should.eventually.have.properties({
			gender: 'Male',
			species: 'Human'
		});
	});

});