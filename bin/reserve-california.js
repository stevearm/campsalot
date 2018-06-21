const program = require('commander');
const reserveCalifornia = require("../lib/reserve-california");

program
  .option('-v, --verbose', 'Make more verbose')
  .parse(process.argv);

campground = "Henry Cowell Redwoods SP";
startDate = new Date("09/13/2018");
length = 2;

reserveCalifornia.getSites(campground, startDate, length).then((sites) => {
    console.log("Got sites", sites);
});
