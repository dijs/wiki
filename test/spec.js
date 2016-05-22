import 'should-promised';
import Wiki from '../dist/wiki';
import nock from 'nock';
import fs from 'fs';

describe('Wiki Methods', () => {

	before(() => nock.disableNetConnect());

	after(() => nock.enableNetConnect());

	it('Search structure API request correctly', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?name=John&format=json&action=query')
			.once()
			.reply(200, {
				success: true
			});
		return new Wiki().api({
			name: 'John'
		}).should.eventually.have.property('success', true);
	});

	it('Search should find an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=search&srsearch=kevin%20bacon%20number&srlimit=50&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865881452.json')));
		return new Wiki().search('kevin bacon number').should.eventually.have.property('results').containEql('Six degrees of separation');
	});

	it('Search should limit properly', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=search&srsearch=batman&srlimit=7&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865882183.json')));
		return new Wiki().search('batman', 7).should.eventually.have.property('results').with.length(7);
	});

	it('Random should return the correct number of results', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=random&rnnamespace=0&rnlimit=3&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865883005.json')));
		return new Wiki().random(3).should.eventually.have.length(3);
	});

	it('Should return correct page', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Batman&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865884408.json')));
		return new Wiki().page('Batman').should.eventually.have.property('pageid', 4335);
	});

	it('Should return page from coordinates', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=geosearch&gsradius=1000&gscoord=32.329%7C-96.136&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865885241.json')));
		return new Wiki().geoSearch(32.329, -96.136).should.eventually.containEql('Gun Barrel City, Texas');
	});

	it('Should be able to choose wikipedia language', () => {
		nock('http://fr.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=France&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865886161.json')))
			.get('/w/api.php?prop=extracts&explaintext=&exintro=&titles=France&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865886843.json')));
		return new Wiki({ apiUrl: 'http://fr.wikipedia.org/w/api.php' })
			.page('France')
			.then(page => page.summary())
			.should.eventually.containEql('La France, officiellement République française');
	});

});

describe('Page Methods', () => {

	let luke;

	before((done) => {
		nock.disableNetConnect();

		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865887477.json')))

		new Wiki().page('Luke Skywalker')
		.then(page => {
			luke = page;
			done();
		})
		.catch(err => done(err))
	});

	after(() => nock.enableNetConnect());

	it('should get html from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=revisions&rvprop=content&rvlimit=1&rvparse=&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865889595.json')))
		return luke.html().should.eventually.containEql('<b>Luke Skywalker</b>');
	});

	it('should get content from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=extracts&explaintext=&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865890274.json')))
		return luke.content().should.eventually.containEql('Star Wars');
	});

	it('should get summary from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=extracts&explaintext=&exintro=&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865891199.json')))
		return luke.summary().should.eventually.containEql('Mark Hamill');
	});

	it('should get images from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?generator=images&gimlimit=max&prop=imageinfo&iiprop=url&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865891844.json')))
		return luke.images().should.eventually.containEql('https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png');
	});

	it('should get references from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=extlinks&ellimit=max&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865892848.json')))
		return luke.references().should.eventually.containEql('http://www.starwars.com/databank/luke-skywalker');
	});

	it('should get links from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=100&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865893591.json')))
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=100&titles=Luke%20Skywalker&format=json&action=query&plcontinue=53602%7C0%7CJango_Fett')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865894283.json')))
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=100&titles=Luke%20Skywalker&format=json&action=query&plcontinue=53602%7C0%7CSkywalker_family')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865895017.json')))
			.get('/w/api.php?prop=links&plnamespace=0&pllimit=100&titles=Luke%20Skywalker&format=json&action=query&plcontinue=53602%7C0%7CYoda')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865896368.json')))
		return luke.links().should.eventually.containEql('Jedi');
	});

	it('should get categories from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=categories&pllimit=100&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865898699.json')))
			.get('/w/api.php?prop=categories&pllimit=100&titles=Luke%20Skywalker&format=json&action=query&clcontinue=53602%7CFictional_hermits')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865900848.json')))
			.get('/w/api.php?prop=categories&pllimit=100&titles=Luke%20Skywalker&format=json&action=query&clcontinue=53602%7CWikipedia_protected_pages_without_expiry')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865905051.json')))
		return luke.categories().should.eventually.containEql('Category:Fictional farmers');
	});

	it('should get backlinks from an article', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865905740.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=1%7C398180')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865907167.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=0%7C1759525')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865907889.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=0%7C3137992')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865908539.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=2%7C5279310')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865909279.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=3%7C9378934')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865910008.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=4%7C14504799')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865910768.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=0%7C18617763')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865911458.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=0%7C23219359')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865912046.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=3%7C32891902')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865912820.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=4%7C40396152')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865913602.json')))
			.get('/w/api.php?list=backlinks&bllimit=100&bltitle=Luke%20Skywalker&format=json&action=query&blcontinue=0%7C48176993')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865914719.json')))
		return luke.backlinks().should.eventually.containEql('Jedi');
	});

	it('should get info', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=revisions&rvprop=content&rvsection=0&titles=Luke%20Skywalker&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865915453.json')))
		return luke.info().should.eventually.have.properties({
			gender: 'Male',
			species: 'Human'
		});
	});

	it('should get coordinates from an article', (done) => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Texas&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865916169.json')))
			.get('/w/api.php?prop=coordinates&titles=Texas&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865916863.json')))
		new Wiki().page('Texas')
		.then((texas) => {
			texas.coordinates().then((coords) => {
				coords.should.have.properties({
					lat: 31,
					lon: -100
				});
				done();
			})
			.catch(err => done(err));
		})
		.catch(err => done(err));
	});

	it('should know who batman is', (done) => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=Batman&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865917587.json')))
		new Wiki().page('Batman')
		.then((batman) => {
			done(null, batman.info().should.eventually.have.property('alter_ego', 'Bruce Wayne'));
		})
		.catch(err => done(err));
	});

	it('should handle empty images properly', () => {
		nock('http://en.wikipedia.org')
			.get('/w/api.php?prop=info%7Cpageprops&inprop=url&ppprop=disambiguation&titles=The%20Future%20Kings%20of%20England&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865918307.json')))
			.get('/w/api.php?generator=images&gimlimit=max&prop=imageinfo&iiprop=url&titles=The%20Future%20Kings%20of%20England&format=json&action=query')
			.once()
			.reply(200, JSON.parse(fs.readFileSync('./test/data/1463865919502.json')))
		const searchImages = term => new Wiki().page(term).then(page => page.images());
		return searchImages('The Future Kings of England').should.eventually.have.property('length', 0);
	});

});
