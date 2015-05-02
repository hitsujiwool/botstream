var through = require('through');
var c = require('stream-combiner');

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
    var d;
    if (transform) {
      d = transform(opts);
    }
    var to = through();
    var from = through(function(event) {
      for (var i = 0, len = that.cases.length; i < len; i++) {
        if (that.cases[i].pattern.test(event.input)) {
          streams[i].write(event);
          return;
        }
      }
      if (d) d.write(event);
    });
    var streams = that.cases.map(function(c) {
      var s = c.f();
      s.pipe(to);
      return s;
    });
    if (d) d.pipe(to);
    return c([from, to]);
  };
};
