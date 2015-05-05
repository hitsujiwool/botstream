var pipeline = require('event-stream').pipeline;

module.exports = function(parser, opts) {
  return new App(parser, opts);
};

function App(parser, opts) {
  this.transforms = [];
  this.transforms.push(function() {
    return parser(opts);
  });
}

App.prototype.register = function(transform, opts) {
  this.transforms.push(function() {
    return transform(opts);
  });
  return this;  
};

App.prototype.stream = function() {
  var transforms = this.transforms.map(function(gen) {
    return gen();
  });
  return pipeline.apply(null, transforms);
};
