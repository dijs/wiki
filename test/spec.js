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

	let luke;

	before((done) => {
		wiki.page('Luke Skywalker').then((page) => {
			luke = page;
			done();
		});
	});

	it('should get html from an article', () => {
		return luke.html().should.eventually.containEql('<b>Luke Skywalker</b>');
	});

	it('should get content from an article', () => {
		return luke.content().should.eventually.containEql('Star Wars');
	});

	it('should get summary from an article', () => {
		return luke.summary().should.eventually.containEql('Mark Hamill');
	});

	it('should get images from an article', () => {
		return luke.images().should.eventually.containEql('https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png');
	});

	it('should get references from an article', () => {
		return luke.references().should.eventually.containEql('http://www.starwars.com/databank/luke-skywalker');
	});

	it('should get links from an article', () => {
		return luke.links().should.eventually.containEql('Jedi');
	});

	it('should get categories from an article', () => {
		return luke.categories().should.eventually.containEql('Category:Fictional farmers');
	});

	it('should get backlinks from an article', () => {
		return luke.backlinks().should.eventually.containEql('Jedi');
	});

	it('should get info', () => {
		return luke.info().should.eventually.have.properties({
			gender: 'Male',
			species: 'Human'
		});
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

	it('should know who batman is', (done) => {
		wiki.page('Batman').then((batman) => {
			done(null, batman.info().should.eventually.have.property('alter_ego', 'Bruce Wayne'));
		});
	});

});
