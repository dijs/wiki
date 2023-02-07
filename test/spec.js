import 'should';

import { Polly, setupMocha as setupPolly } from '@pollyjs/core';
import NodeHttpAdapter from '@pollyjs/adapter-node-http';
import FSPersister from '@pollyjs/persister-fs';

import wiki from '../src/wiki.js';

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

const timeoutTime = 30000;

describe('Wiki Methods', () => {
	setupPolly.beforeEach({
		adapters: ['node-http'],
		persister: 'fs',
		recordFailedRequests: true
	});
	setupPolly.afterEach();

	it('should not throw up when using pre 1.0.0 version', () => {
		return new wiki()
			.search('kevin bacon number')
			.should.eventually.have.property('results')
			.with.property('length', 50);
	});

	it('Search handle a foreign redirect', () => {
		return wiki({ apiUrl: 'http://ru.wikipedia.org/w/api.php' })
			.page('Boletus edulis')
			.should.eventually.have.property('raw')
			.with.property('pageid', 293802);
	});

	it('Search should find an article', () => {
		const promise = wiki().search('kevin bacon number');
		return Promise.all([
			promise.should.eventually.have
				.property('results')
				.containEql('Six degrees of separation'),
			promise.should.eventually.have.property('query', 'kevin bacon number')
		]);
	});

	it('Prefix search should find an article', () => {
		return wiki()
			.prefixSearch('mic')
			.should.eventually.have.property('results')
			.containEql('Michael Jordan');
	});

	it('Search should limit properly', () => {
		return wiki()
			.search('batman', 7)
			.should.eventually.have.property('results')
			.with.length(7);
	});

	it('Random should return the correct number of results', () => {
		return wiki()
			.random(3)
			.should.eventually.have.length(3);
	});

	it('Should return correct page', () => {
		return wiki()
			.page('Batman')
			.should.eventually.have.property('raw')
			.with.property('pageid', 4335);
	});

	it('Should return page from coordinates', () => {
		return wiki()
			.geoSearch(32.329, -96.136)
			.should.eventually.containEql('Gun Barrel City, Texas');
	});

	it('Should be able to choose wikipedia language', () => {
		return wiki({ apiUrl: 'http://fr.wikipedia.org/w/api.php' })
			.page('France')
			.should.eventually.have.property('raw')
			.with.property('canonicalurl', 'https://fr.wikipedia.org/wiki/France');
	});

	it('Should find page by given id', () => {
		return wiki()
			.findById(4335)
			.should.eventually.have.property('raw')
			.with.property('title', 'Batman');
	});
});

describe('Page Methods', () => {
	let luke;

	setupPolly.beforeEach({
		adapters: ['node-http'],
		persister: 'fs',
		recordFailedRequests: true
	});
	setupPolly.afterEach();

	beforeEach(function(done) {
		this.timeout(timeoutTime);
		setTimeout(() => {
			done();
		}, 100);
	});

	before(done => {
		wiki()
			.page('Luke Skywalker')
			.then(page => {
				luke = page;
				done();
			});
	});

	it('should get correct content from a non-default wiki', () => {
		return wiki({ apiUrl: 'http://fr.wikipedia.org/w/api.php' })
			.page('France')
			.then(page => page.summary())
			.should.eventually.containEql('République française');
	});

	it('should get html from an article', function() {
		this.timeout(timeoutTime);
		return luke.html().should.eventually.containEql('<b>Luke Skywalker</b>');
	});

	it('should get content from an article', () => {
		return luke.rawContent().should.eventually.containEql('Star Wars');
	});

	it('should get summary from an article', () => {
		return luke.summary().should.eventually.containEql('Mark Hamill');
	});

	it('should get images from an article', () => {
		return luke
			.images()
			.should.eventually.containEql(
				'https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png'
			);
	});

	it('should get raw images from an article', () => {
		return luke.rawImages().then(images => {
			const lightsaber = images.find(
				image => image.title === 'File:Luke Skywalker.png'
			);
			lightsaber.should.exist;
		});
	});

	it('should get main image from an article', () => {
		return luke
			.mainImage()
			.should.eventually.equal(
				'https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png'
			);
	});

	it('should get main image from a foreign article', () => {
		return luke
			.mainImage()
			.should.eventually.equal(
				'https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png'
			);
	});

	it('should get links from an article', function() {
		this.timeout(timeoutTime);
		return luke.links().should.eventually.containEql('Jedi');
	});

	it('should get partial links from an article', () => {
		return luke
			.links(false, 1)
			.should.eventually.have.property('results')
			.containEql('A-wing');
	});

	it('should get categories from an article', function() {
		this.timeout(timeoutTime);
		return luke
			.categories()
			.should.eventually.containEql('Category:Fictional farmers');
	});

	it('should get partial categories from an article', () => {
		return luke
			.categories(false, 1)
			.should.eventually.have.property('results')
			.containEql('Category:Characters created by George Lucas');
	});

	it('should get backlinks from an article', function() {
		this.timeout(timeoutTime);
		return luke.backlinks().should.eventually.containEql('Jedi');
	});

	it('should get partial backlinks from an article', () => {
		return luke
			.backlinks(false, 1)
			.should.eventually.have.property('results')
			.containEql('Talk:Cyborgs in fiction');
	});

	it('should get info', () => {
		return luke.info().then(info => {
			info.should.have.property('gender', 'Male');
			info.species.should.containEql('Human');
			info.relatives.should.containEql('Shmi Skywalker');
		});
	});

	it('should get specific info by key', () => {
		return luke.info('gender').should.eventually.equal('Male');
	});

	it('should get coordinates from an article', () => {
		return wiki()
			.page('Texas')
			.then(texas => texas.coordinates())
			.should.eventually.have.properties({
				lat: 31.4757,
				lon: -99.3312
			});
	});

	it('should parse coordinates located in infobox', () => {
		return wiki()
			.page('Catanzaro')
			.then(page => page.coordinates())
			.should.eventually.have.properties({
				lat: 38.9,
				lon: 16.6
			});
	});

	it.skip('should parse deprecated format coordinates', () => {
		return wiki()
			.page('Solok')
			.then(page => page.coordinates())
			.should.eventually.have.properties({
				lat: -0.7997,
				lon: 100.6661
			});
	});

	it('should know who batman is', () => {
		return wiki()
			.page('Batman')
			.then(batman => {
				return batman
					.info()
					.should.eventually.have.property('alterEgo', 'Bruce Wayne');
			});
	});

	it('should determine information from metadata', () => {
		return wiki()
			.page('Elizabeth II')
			.then(queen => queen.info('father'))
			.then(father => {
				father.should.equal('George VI');
			});
	});

	it('should pass headers to API', () => {
		return wiki({
			headers: {
				Cookie: 'name=value; name2=value2; name3=value3'
			}
		})
			.findById(4335)
			.should.eventually.have.property('raw')
			.with.property('title', 'Batman');
	});
});
