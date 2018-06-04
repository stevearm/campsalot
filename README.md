This is a search layer on top of various campsite reservation systems. It is read-only and will just link you to the right place when it finds availability. Sites include:

* [San Mateo Memorial Park](https://secure.itinio.com/sanmateo/memorial-park) (not yet working)
* [Reserve California](https://www.reservecalifornia.com/CaliforniaWebHome/) (not yet working)

## Local Dev

1. Clone repo
2. `npm install` in this folder
3. `node bin/reserve-california.js` to run a local script

### Misc notes
* I think [async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) basically wrap themselves in a Promise automagically. Kind of cool.
* Looks like [puppeteer](https://github.com/GoogleChrome/puppeteer) has replaced PhantomJS
