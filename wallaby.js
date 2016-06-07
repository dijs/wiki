module.exports = function(wallaby) {
  return {
    files: [
      'src/*.js'
    ],
    tests: [
      'test/*.js',
      'test/data/*.json'
    ],
    compilers: {
      '**/*.js': wallaby.compilers.babel()
    },
    env: {
      type: 'node'
    }
  };
};
