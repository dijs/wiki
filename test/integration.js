import 'should';
import wiki from '../src/wiki';

//TODO I leave this test skipped until I do the nock magic trick
describe.skip('Dublin page integration', () => {

  //TODO
  // download whatever files are needed for nock

  let dublin
  before((done) => {
    wiki().page('Dublin')
    .then((page) => {
      dublin = page
      done()
    })
  })

  it('should get Dublins info', () => {
    return dublin.info(null, {simplifyDataValues: false}).then((info) => {
      info.name.should.equal('Dublin')
      info.gdp.should.equal('US$ 90.1 billion')
      //TODO fix infobox parser to activate this test
      //info.populationTotal.should.equal(553165)
    })
  })

})

