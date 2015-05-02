# botstream

stream-based bot micro framework

## Example

### 1. Define Message Parser (from slack)

Parse [slack outgoing webhooks](https://api.slack.com/outgoing-webhooks) POST data and convert it to an object with properties `user` and `input`.

```javascript
var parse = require('querystring').parse;
var through = require('through');

function slackParser(options) {
  var buffer = [];
  return through(function(data) {
    buffer.push(data.toString('utf8'));
  }, function() {
    var parsed = parse(buffer.join(''));
    this.queue({
      user: parsed.user_name,
      input: parsed.text,
    });
    this.queue(null);
  });
};
```

### 2. Define Actions

Here we define some rules to compose the outgoing message. Action must be defined as a function which returns a through (both readable and writable) stream.

```javascript
var through = require('through');

function hello() {
  return through(function(event) {
    event.output = "hello " + event.user
    this.queue(event);
  })
}

function bye() {
  return through(function(event) {
    event.output = "bye " + event.user
    this.queue(event);
  })
}
```

### 3. Define Outgoing (to slack)

If we want to response messages via an outgoing URL (or we may call it [incoming](https://api.slack.com/incoming-webhooks) from the viewpoint of message receiver), we have to define another through stream which posts the `output` value as a side effect.

```javascript
var https = require('https');
var through = require('through');
var parse = require('url').parse;

function slackOutgoing() {
  return through(function(event) {
    var parsed = parse(process.env.SLACK_URL);
    https.request({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      host: parsed.host,
      path: parsed.pathname
    }).end(JSON.stringify({ text: event.output }));
  });
};
```

### 4. Register Actions

Integrate all the functions into a botstream application.

```javascript
var botstream = require('botstream');

var actions = botstream.select();
  .case(/hello/, hello)
  .case(/bye/, bye)

botstream.app(slackParser);
  .register(actions);
  .register(slackOutgoing);
```

### 5. Mount to HTTP(S)

Pipe it from/to existing application. Whatever application which implements stream interface is available.

```javascript
app.post('/bot', function(req, res) {
  req.pipe(bot.stream()).pipe(res);
});
```
