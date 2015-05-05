var through = require('event-stream').through;
var merge = require('event-stream').merge;
var map = require('event-stream').map;
var duplex = require('event-stream').duplex;

module.exports = function() {
  return new Select();
};

function Select() {
  this.cases = [];
};

Select.prototype.case = function(pattern, transform, opts) {
  opts = opts || {};
  this.cases.push({ pattern: pattern, f: function() { return transform(opts); } });
  return this;
};

Select.prototype.default = function(transform, opts) {
  opts = opts || {};
  var that = this;
  return function() {
    var resolved = false;
    var from = through(function(data) {
      resolved = false;
      this.queue(data);
    });
    var to = through();
    var filter = function(pattern) {
      return map(function(event, cb) {
        if (pattern.test(event.input) && !resolved) {
          resolved = true;
          cb(null, event);
        } else {
          cb();
        }
      });
    };
    var streams = that.cases.map(function(c) {
      return from.pipe(filter(c.pattern)).pipe(c.f());
    });
    if (transform) {
      streams.push(from.pipe(transform(opts)));
    }
    merge(streams).pipe(to);
    return duplex(from, to);
  };
};
