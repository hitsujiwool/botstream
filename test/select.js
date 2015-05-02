var assert = require('power-assert');
var through = require('through');

var select = require('../lib/select');

function foo() {
  return through(function(data) {
    this.queue('foo selected');
  });
};

function anotherFoo() {
  return through(function(data) {
    this.queue('foo selected');
  });  
};

function bar() {
  return through(function(data) {
    this.queue('bar selected');
  });
};

function defaults() {
  return through(function(data) {
    this.queue('defaults selected');
  }); 
}

describe('select()', function() {
  it('should pipe stream to foo', function(done) {
    var didOnData = false;
    var t = select()
          .case(/foo/, foo)
          .case(/bar/, bar)
          .default();
    var s = t();
    s
      .on('data', function(data) {
        didOnData = true;
        assert.equal(data, 'foo selected');
      })
      .on('end', function() {
        assert(didOnData);
        done();
      });
    s.write({ input: 'foo' });
    s.end();
  });

  it('should pipe stream to bar', function(done) {
    var didOnData = false;
    var t = select()
          .case(/foo/, foo)
          .case(/bar/, bar)    
          .default();
    var s = t();
    s
      .on('data', function(data) {
        didOnData = true;
        assert.equal(data, 'bar selected');
      })
      .on('end', function() {
        assert(didOnData);
        done();
      });
    s.write({ input: 'bar' });
    s.end();
  });

  it('should do nothing', function(done) {
    var didOnData = false;
    var t = select()
          .case(/foo/, foo)
          .case(/bar/, bar)    
          .default();
    var s = t();
    s
      .on('data', function(data) {
        didOnData = true;
        assert.equal(data, 'something selected');
      })
      .on('end', function() {
        assert(!didOnData);
        done();
      });
    s.write({ input: 'baz' });
    s.end();
  });

  it('should use default stream', function(done) {
    var didOnData = false;
    var t = select()
          .case(/foo/, foo)
          .case(/bar/, bar)    
          .default(defaults);
    var s = t();
    s
      .on('data', function(data) {
        didOnData = true;
        assert.equal(data, 'defaults selected');
      })
      .on('end', function() {
        assert(didOnData);
        done();
      });
    s.write({ input: 'baz' });
    s.end();
  });    

  it('first come, first served', function(done) {
    var didOnData = false;
    var t = select()
          .case(/foo/, foo)
          .case(/foo/, anotherFoo) 
          .default();
    var s = t();
    s
      .on('data', function(data) {
        didOnData = true;
        assert.equal(data, 'foo selected');
      })
      .on('end', function() {
        assert(didOnData);
        done();
      });
    s.write({ input: 'foo' });
    s.end();
  });  
});
