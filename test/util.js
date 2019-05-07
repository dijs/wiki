import 'should';
import { parseContent } from '../src/util';
import fs from 'fs';

describe('parseContent', () => {
  it('should parse input text properly', function(done) {
    const content = parseContent(
      fs.readFileSync('./test/data/content.txt').toString()
    );
    content.should.deepEqual([
      { title: 'section 1', content: 'content 1' },
      { title: 'section 2 (empty)', content: '' },
      { title: 'section 3', content: 'content 3' }
    ]);

    done();
  });
});
