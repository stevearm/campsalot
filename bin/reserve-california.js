const program = require('commander');

program
  .option('-v, --verbose', 'Make more verbose')
  .parse(process.argv);

campground = "Henry Cowell Redwoods SP";
startDate = new Date("09/13/2018");
length = 2;

if (program.verbose) {
  // Same thing is accomplished with `DEBUG=campsalot* node bin/reserve-california.js`
  require("debug").enable("campsalot*");
}

require("../lib/reserve-california").getSites(campground, startDate, length).then((sites) => {
    console.log("Got sites", sites);
});
