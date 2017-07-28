import 'should';
import wiki from '../src/wiki';

describe('Live tests', () => {
  it('should handle non existent pages properly', function(done) {
    this.timeout(5000);
    wiki()
      .page('asdasdlkalskdjalsdjalskdalsdjasdasd')
      .catch(e => {
        e.message.should.equal('No article found');
        done();
      });
  });
  it('should return first foreign image as main', function(done) {
    this.timeout(5000);
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
    this.timeout(5000);
    wiki({ apiUrl: 'https://es.wikipedia.org/w/api.php' })
      .page('Cristiano Ronaldo')
      .then(page => {
        page.mainImage().then(mainImage => {
          mainImage.should.equal('https://upload.wikimedia.org/wikipedia/commons/3/3e/Ronaldo_vs._FC_Schalke_04_%2816854146922%29.jpg');
          done();
        });
      });
  });
});