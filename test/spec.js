import 'should';
import wiki from '../src/wiki';
import nock from 'nock';
import fs from 'fs';
// import rewire from 'rewire';

const described = () => {};

describe('Wiki Methods', () => {

	before(() => nock.disableNetConnect());

	after(() => nock.enableNetConnect());

	it('should not throw up when using pre 1.0.0 version', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=search&srsearch=kevin%20bacon%20number&srlimit=50&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865881452.json')));
		return new wiki().search('kevin bacon number').should.eventually.have
			.property('results').with.property('length', 50);
	});

  it('Search handle a foreign redirect', () => {
		nock('http://ru.wikipedia.org')
      .get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Boletus%20edulis&format=json&action=query&redirects=')
      .once()
      .reply(200, JSON.parse(fs.readFileSync('./test/data/redirect.json')))
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=%D0%91%D0%B5%D0%BB%D1%8B%D0%B9%20%D0%B3%D1%80%D0%B8%D0%B1&format=json&action=query&redirects=')
      .once()
      .reply(200, JSON.parse(fs.readFileSync('./test/data/redirect-target.json')));
		return wiki({ apiUrl: 'http://ru.wikipedia.org/w/api.php' }).page('Boletus edulis').should.eventually.have.property('raw').with.property('pageid', 293802);
	});

	it('Search should find an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=search&srsearch=kevin%20bacon%20number&srlimit=50&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865881452.json')));
		return wiki().search('kevin bacon number').should.eventually.have.property('results').containEql('Six degrees of separation');
	});

	it('Search should limit properly', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=search&srsearch=batman&srlimit=7&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865882183.json')));
		return wiki().search('batman', 7).should.eventually.have.property('results').with.length(7);
	});

	it('Random should return the correct number of results', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=random&rnnamespace=0&rnlimit=3&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865883005.json')));
		return wiki().random(3).should.eventually.have.length(3);
	});

	it('Should return correct page', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Batman&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865884408.json')));
		return wiki().page('Batman').should.eventually.have.property('raw').with.property('pageid', 4335);
	});

	it('Should error if page not found', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Nope&format=json&action=query&redirects=')
			.once()
			.reply(200, {
				query: {
					pages: []
				}
			});
		return wiki().page('Nope').should.be.rejectedWith('No article found');
	});

	it('Should return page from coordinates', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=geosearch&gsradius=1000&gscoord=32.329%7C-96.136&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865885241.json')));
		return wiki().geoSearch(32.329, -96.136).should.eventually.containEql('Gun Barrel City, Texas');
	});

	it('Should be able to choose wikipedia language', () => {
		nock('http://fr.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=France&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865886161.json')))
			.get('/w/api.php?prop=extracts&explaintext=&exintro=&titles=France&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865886843.json')));
		return wiki({ apiUrl: 'http://fr.wikipedia.org/w/api.php' })
			.page('France')
			.should.eventually.have.property('raw')
			.with.property('canonicalurl', 'https://fr.wikipedia.org/wiki/France');
	});
});

describe('Page Methods', () => {
	let luke;

	before((done) => {
		nock.disableNetConnect();

		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865887477.json')))

		wiki().page('Luke Skywalker')
		.then(page => {
			luke = page;
			done();
		})
	});

	after(() => nock.enableNetConnect());

	it('should get correct content from a non-default wiki', () => {
		nock('http://fr.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=France&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865886161.json')))
			.get('/w/api.php?prop=extracts&explaintext=&exintro=&titles=France&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865886843.json')));
		return wiki({ apiUrl: 'http://fr.wikipedia.org/w/api.php' })
			.page('France')
			.then(page => page.summary())
			.should.eventually.containEql('La France, officiellement République française');
	});

	it('should get html from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=revisions&rvprop=content&rvlimit=1&rvparse=&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865889595.json')))
		return luke.html().should.eventually.containEql('<b>Luke Skywalker</b>');
	});

	it('should get content from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=extracts&explaintext=&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865890274.json')))
		return luke.content().should.eventually.containEql('Star Wars');
	});

	it('should get summary from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=extracts&explaintext=&exintro=&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865891199.json')))
		return luke.summary().should.eventually.containEql('Mark Hamill');
	});

	it('should get images from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?generator=images&gimlimit=max&prop=imageinfo&iiprop=url&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865891844.json')))
		return luke.images().should.eventually.containEql('https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png');
	});

	it('should get raw images from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?generator=images&gimlimit=max&prop=imageinfo&iiprop=url&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865891844.json')))
		return luke.rawImages().then(images => {
			const lightsaber = images.find(image => image.title === 'File:Lightsaber blue.svg');
			lightsaber.should.exist;
		});
	});

	it('should get main image from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?generator=images&gimlimit=max&prop=imageinfo&iiprop=url&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865891844.json')))
			.get('/w/api.php?prop=revisions&rvprop=content&rvsection=0&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865915453.json')))
		return luke.mainImage().should.eventually.equal('https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png');
	});

	it('should get empty image list if no query data', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?generator=images&gimlimit=max&prop=imageinfo&iiprop=url&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, {});
		return luke.images().should.eventually.have.property('length', 0);
	});

	it('should get references from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=extlinks&ellimit=max&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865892848.json')))
		return luke.references().should.eventually.containEql('http://www.starwars.com/databank/luke-skywalker');
	});

	it('should get links from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=100&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865893591.json')))
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=100&titles=Luke%20Skywalker&plcontinue=53602%7C0%7CJango_Fett&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865894283.json')))
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=100&titles=Luke%20Skywalker&plcontinue=53602%7C0%7CSkywalker_family&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865895017.json')))
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=100&titles=Luke%20Skywalker&plcontinue=53602%7C0%7CYoda&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865896368.json')))
		return luke.links().should.eventually.containEql('Jedi');
	});

	it('should get partial links from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=1&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865893591.json')))
		return luke.links(false, 1).should.eventually.have.property('results').containEql('A-wing');
	});

	it('should get categories from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=categories&pllimit=100&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865898699.json')))
			.get('/w/api.php?prop=categories&pllimit=100&titles=Luke%20Skywalker&clcontinue=53602%7CFictional_hermits&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865900848.json')))
			.get('/w/api.php?prop=categories&pllimit=100&titles=Luke%20Skywalker&clcontinue=53602%7CWikipedia_protected_pages_without_expiry&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865905051.json')))
		return luke.categories().should.eventually.containEql('Category:Fictional farmers');
	});

	it('should get partial categories from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=categories&pllimit=1&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865898699.json')));
		return luke.categories(false, 1).should.eventually.have.property('results').containEql('Category:Action heroes');
	});

	it('should get backlinks from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865905740.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=1%7C398180&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865907167.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=0%7C1759525&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865907889.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=0%7C3137992&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865908539.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=2%7C5279310&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865909279.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=3%7C9378934&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865910008.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=4%7C14504799&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865910768.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=0%7C18617763&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865911458.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=0%7C23219359&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865912046.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=3%7C32891902&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865912820.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=4%7C40396152&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865913602.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&blcontinue=0%7C48176993&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865914719.json')))
		return luke.backlinks().should.eventually.containEql('Jedi');
	});

	it('should get partial backlinks from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=backlinks&bllimit=1&bltitle=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865905740.json')))
		return luke.backlinks(false, 1).should.eventually.have.property('results').containEql('Jedi');
	});

	it('should get info', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=revisions&rvprop=content&rvsection=0&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865915453.json')))
		return luke.info().should.eventually.have.properties({
			gender: 'Male',
			species: 'Human'
		});
	});

	it('should get specific info by key', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=revisions&rvprop=content&rvsection=0&titles=Luke%20Skywalker&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865915453.json')))
		return luke.info('gender').should.eventually.equal('Male');
	});

	it('should get coordinates from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Texas&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865916169.json')))
			.get('/w/api.php?prop=coordinates&titles=Texas&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865916863.json')))
		return wiki().page('Texas').then(texas => texas.coordinates()).should.eventually.have.properties({
			lat: 31,
			lon: -100
		});
	});

	it('should parse coordinates located in infobox', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Catanzaro&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/coord_test_infobox_initial.json')))
			.get('/w/api.php?prop=coordinates&titles=Catanzaro&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/coord_test_infobox_nullresp.json')))
			.get('/w/api.php?prop=revisions&rvprop=content&rvsection=0&titles=Catanzaro&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/coord_test_infobox.json')))
		return wiki().page('Catanzaro').then(page => page.coordinates()).should.eventually.have.properties({
			lat: 38.9,
			lon: 16.6
		});
	});

	it('should parse deprecated format coordinates', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Solok&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/coord_test_deprecated_initial.json')))
			.get('/w/api.php?prop=coordinates&titles=Solok&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/coord_test_deprecated_nullresp.json')))
			.get('/w/api.php?prop=revisions&rvprop=content&rvsection=0&titles=Solok&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/coord_test_deprecated.json')))
		return wiki().page('Solok').then(page => page.coordinates()).should.eventually.have.properties({
			lat: -0.7997,
			lon: 100.6661
		});
	});

	it('should know who batman is', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=revisions&rvprop=content&rvsection=0&titles=Batman&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/batman_1465345136921.json')))
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Batman&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/batman_1465345136432.json')))
		return wiki().page('Batman')
		.then(batman => {
			return batman.info().should.eventually.have.property('alter_ego', 'Bruce Wayne');
		});
	});

	it('should determine information from metadata', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=revisions&rvprop=content&rvsection=0&titles=Elizabeth%20II&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/queen_1465350664332.json')))
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Elizabeth%20II&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/queen_1465350664030.json')))
		return wiki()
			.page('Elizabeth II')
			.then(queen => queen.info('age').should.eventually.equal(90));
	});

	it('should handle empty images properly', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=The%20Future%20Kings%20of%20England&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865918307.json')))
			.get('/w/api.php?generator=images&gimlimit=max&prop=imageinfo&iiprop=url&titles=The%20Future%20Kings%20of%20England&format=json&action=query&redirects=')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865919502.json')))
		const searchImages = term => wiki().page(term).then(page => page.images());
		return searchImages('The Future Kings of England').should.eventually.have.property('length', 0);
	});
});
