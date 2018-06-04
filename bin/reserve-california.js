const program = require('commander');
const reserveCalifornia = require("../lib/reserve-california");

program
  .option('-v, --verbose', 'Make more verbose')
  .parse(process.argv);

campground = "Henry Cowell Redwoods SP";
startDate = "07/13/2018";
length = 2;

console.log("Pre");
reserveCalifornia.getSites(campground, startDate, length).then((sites) => {
    console.log("Got sites %s", sites);
});
console.log("Post");
