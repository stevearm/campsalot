const program = require('commander');

const formatDate = function(date) {
  return date.toLocaleDateString("en-US", {day:"2-digit", month:"2-digit", year:"numeric"});
}

const main = function() {

  var fortnightAway = new Date(Date.now() + 12096e5);

  program
    .option("-v, --verbose", "Make more verbose")
    .option("-c, --campground [name]", "The campground to search for", "Henry Cowell Redwoods SP")
    .option("-s, --start [date]", "The date you check in on", formatDate(fortnightAway))
    .option("-l, --length [nights]", "The nights you want to stay", 2)
    .parse(process.argv);

  if (program.verbose) {
    // Same thing is accomplished with `DEBUG=campsalot* node bin/reserve-california.js`
    require("debug").enable("campsalot*");
  }

  if (program.campground != "Henry Cowell Redwoods SP") {
    console.error("Currently only support 'Henry Cowell Redwoods SP' because this script is garbage");
    return 1;
  }

  var startDate = new Date(program.start);
  if (formatDate(startDate) != program.start) {
    console.error("Unparsable start date: %s", program.start);
    return 1;
  }

  console.log("Searching '%s' for a %d night stay starting on %s", program.campground, program.length, program.start);

  require("../lib/reserve-california").getSites(program.campground, startDate, program.length).then((sites) => {
      console.log("Got sites", sites);
  });
  return 0;
}

process.exitCode = main();
