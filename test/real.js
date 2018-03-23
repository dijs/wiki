import should from 'should';
import wiki from '../src/wiki';

const timeoutTime = 10000;

describe('Live tests', () => {
  it('should handle non existent pages properly', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .page('asdasdlkalskdjalsdjalskdalsdjasdasd')
      .catch(e => {
        e.message.should.equal('No article found');
        done();
      });
  });
  it('should return first foreign image as main', function(done) {
    this.timeout(timeoutTime);
    wiki({ apiUrl: 'https://de.wikipedia.org/w/api.php' })
      .page('Batman')
      .then(page => {
        page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/commons/0/07/Gotham_City_Saviour_%282430422247%29.jpg');
          done();
        });
      });
  });
  it('should use different names for "image" for foreign wikis', function(done) {
    this.timeout(timeoutTime);
    wiki({ apiUrl: 'https://es.wikipedia.org/w/api.php' })
      .page('Cristiano Ronaldo')
      .then(page => {
        page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/commons/d/db/New_Zealand-Portugal_%2820%29.jpg');
          done();
        });
      });
  });
  it('should handle Issue #53', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .page('FC Copenhagen')
      .then(page => {
        page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/en/9/93/FC_K%C3%B8benhavn.svg');
          done();
        });
      });
  });
  it('should handle Issue #54', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .page('FC Santa Coloma')
      .then(page => {
        page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/en/a/ab/Santa-Coloma1.png');
          done();
        });
      });
  });
  it('should handle Issue #55', function() {
    this.timeout(timeoutTime);
    return wiki({
      apiUrl: 'https://awoiaf.westeros.org/api.php',
      origin: null
    })
      .search('Winterfell')
      .should.eventually.have.property('results').containEql('Crypt of Winterfell');
  });
  it('should handle Issue #57', function() {
    this.timeout(timeoutTime);
    return wiki({
      apiUrl: 'https://oldschoolrunescape.wikia.com/api.php',
      origin: null
    }).search('Bob').catch(e => e.message.should.equal('text search is disabled'));
  });
  it('should handle Issue #59', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .page('Batman')
      .then(page => {
        page.langlinks().then(links => {
          links.should.containEql({
            lang: 'el',
            title: 'Μπάτμαν'
          });
          links.should.containEql({
            lang: 'az',
            title: 'Betmen'
          });
          done();
        });
      });
  });
  it('should handle Issue #62', function(done) {
    this.timeout(timeoutTime);
    const wi = wiki({
      apiUrl: 'http://fr.wikipedia.org/w/api.php'
    });
    wi.search('royan') .then(data => {
      wi.page(data.results[0]).then(page => {
        page.mainImage().then(img => {
          img.should.equal('https://upload.wikimedia.org/wikipedia/commons/1/18/Port_Royan.jpg');
          done();
        });
      });
    });
  });
  it('should handle Issue #63', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .findById(250197)
      .then(page => {
        page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/en/a/a3/Equipe_de_France_de_football_Logo.png');
          done();
        });
      });
  });
  it('should handle Issue #64', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .findById(3165)
      .then(page => {
        page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/en/b/ba/ACF_Fiorentina_2.svg');
          done();
        });
      });
  });
  it('should handle Issue #72', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .page('Java_Classloader')
      .then(page => {
        page.mainImage().then(mainImage => {
          should.equal(mainImage, undefined);
          done();
        });
      });
  });
  it('should handle Issue #74 -> make all infoboxes available', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .page('Cross_Game')
      .then(page => page.fullInfo())
      .then(info => {
        info.tvSeries.director.should.equal('Osamu Sekita');
        done();
      });
  });
});