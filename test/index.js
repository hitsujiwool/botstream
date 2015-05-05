var assert = require('power-assert');
var through = require('event-stream').through;

var botstream = require('..');

var parse = function() {
  return through(function(data) {
    this.queue({ output: data });
  });
};

var add = function(opts) {
  return through(function(event) {
    event.output += opts.n;
    this.queue(event);
  });
};

describe('botstream', function() {
  it('should parse inputs, process all the transforms', function(done) {
    var didOnData = false;
    var bot = botstream.app(parse);
    bot.register(add, { n: 2 });
    bot.register(add, { n: 3 });
    var s = bot.stream();
    s
      .on('data', function(data) {
        didOnData = true;
        assert.deepEqual(data, { output: 6 });
      })
      .on('end', function() {
        assert(didOnData);
        done();
      });
    s.write(1);
    s.end();
  });
});
