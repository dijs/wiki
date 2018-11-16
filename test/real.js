import should from 'should';
import wiki from '../src/wiki';

const timeoutTime = 30000;

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
  it('should use different names for "image" for foreign wikis', function() {
    this.timeout(timeoutTime);
    return wiki({ apiUrl: 'https://es.wikipedia.org/w/api.php' })
      .page('Cristiano Ronaldo')
      .then(page => {
        return page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg');
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
            lang: 'ru',
            title: 'Бэтмен'
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
  it('should handle Issue #63', function() {
    this.timeout(timeoutTime);
    return wiki()
      .findById(250197)
      .then(page => {
        return page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/en/1/12/France_national_football_team_seal.svg');
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
  it('should handle Issue #80 -> implement find method (default behavior)', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .find('kylie jenner')
      .then(page => page.fullInfo())
      .then(info => {
        info.general.birthName.should.equal('Kylie Kristen Jenner');
        done();
      });
  });
  it('should handle Issue #80 -> implement find method with predicate', function(done) {
    this.timeout(timeoutTime);
    wiki()
      .find('kylie jenner', results => results.find(result => result.includes('Kim')))
      .then(page => page.fullInfo())
      .then(info => {
        info.general.birthName.should.equal('Kimberly Noel Kardashian');
        done();
      });
  });
  it('should fetch all pages of wiki', function() {
    this.timeout(timeoutTime);
    return wiki({
      apiUrl: 'http://batman.wikia.com/api.php'
    })
      .allPages()
      .then(pages => pages.length.should.be.above(7000));
  });
  it('should fetch all categories of wiki', function() {
    this.timeout(timeoutTime);
    return wiki({
      apiUrl: 'http://batman.wikia.com/api.php'
    })
      .allCategories()
      .then(cats => cats.should.containEql('Characters'))
  });
  it('should fetch all pages in category', function() {
    this.timeout(timeoutTime);
    return wiki({
      apiUrl: 'http://batman.wikia.com/api.php'
    })
      .pagesInCategory('Category:Characters')
      .then(pages => pages.should.containEql('Robin (Damian Wayne)'))
  });
  it('should handle issue #83', function() {
    this.timeout(timeoutTime);
    return wiki().page('athena').then(p => {
      return p.mainImage().then(name => {
        return name.should.equal('https://upload.wikimedia.org/wikipedia/commons/2/22/Mattei_Athena_Louvre_Ma530_n2.jpg');
      });
    });
  });
  it('should handle opensearch', function() {
    this.timeout(timeoutTime);
    return wiki({
      apiUrl: 'https://lol.gamepedia.com/api.php'
    })
      .opensearch('Ashe')
      .then(titles => titles.should.containEql('Ashe/Old Lore'))
  });
  it('should use opensearch as backup when text search is disabled', function() {
    this.timeout(timeoutTime);
    return wiki({
      apiUrl: 'https://lol.gamepedia.com/api.php'
    })
      .search('Ashe')
      .then(titles => titles.should.containEql('Ashe/Old Lore'))
  });
});
