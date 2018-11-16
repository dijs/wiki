import 'should';
import fs from 'fs';
import nock from 'nock';
import wiki from '../src/wiki';

describe('Dublin page integration', () => {

  let dublin;
  before(done => {
    nock('http://en.wikipedia.org')
      .get('/w/api.php')
      .query({
        prop: 'info|pageprops',
        inprop: 'url',
        ppprop: 'disambiguation',
        titles: 'Dublin',
        format: 'json',
        action: 'query',
        redirects: '',
        origin: '*'
      })
      .once()
      .reply(200, JSON.parse(fs.readFileSync('./test/data/dublin-page.json')));

    const opts = {
      parser: {
        simplifyDataValues: false
      }
    }

    wiki(opts).page('Dublin')
    .then((page) => {
      dublin = page
      done()
    })
    .catch(done)
  });
  
  after(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('should get Dublins info', () => {
    nock('http://en.wikipedia.org')
      .get('/w/api.php')
      .query({
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
        titles: 'Dublin',
        format: 'json',
        action: 'query',
        redirects: '',
        origin: '*'
      })
      .once()
      .reply(200, JSON.parse(fs.readFileSync('./test/data/dublin-info.json')));

    return dublin.info().then((info) => {
      info.name.should.equal('Dublin');
      info.gdp.should.equal('American dollar 90.1 billion');
      info.populationTotal.should.equal(553165)
    });
  });

});

