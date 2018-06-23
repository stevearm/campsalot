const program = require('commander');

const formatDate = function(date) {
    return date.toLocaleDateString("en-US", {day:"2-digit", month:"2-digit", year:"numeric"});
}

const main = async function() {

    var fortnightAway = new Date(Date.now() + 12096e5);

    program
        .option("-v, --verbose", "Make more verbose")
        .option("-c, --campground [name]", "The campground to search for", "Henry Cowell Redwoods SP")
        .option("-s, --start [date]", "The date you check in on", formatDate(fortnightAway))
        .option("-l, --length [nights]", "The nights you want to stay", 2)
        .parse(process.argv);

    if (program.verbose) {
        // Same thing is accomplished with `DEBUG=campsalot* node bin/reserve-california.js`
        // Ensure this happens before we load reserveCalifornia library
        require("debug").enable("campsalot*");
    }

    const reserveCalifornia = require("../lib/reserve-california");

    var campgrounds = await reserveCalifornia.lookupCampground(program.campground);
    if (!campgrounds) {
        console.error("Something went wrong resolving '%s'", program.campground);
        return 1;
    }
    if (campgrounds.length == 0) {
        console.error("Did not find any campgrounds for '%s'", program.campground);
        return 1;
    }
    if (campgrounds.length > 1) {
        console.error("Found %d campgrounds for '%s'", campgrounds.length, program.campground);
        for (var i = 0; i < campgrounds.length; i++) {
            console.error("  - %s", campgrounds[i].label);
        }
        console.error("Refine search to only a single campground");
        return 1;
    }
    const campgroundDetails = campgrounds[0];

    var startDate = new Date(program.start);
    if (formatDate(startDate) != program.start) {
        console.error("Unparsable start date: %s", program.start);
        return 1;
    }

    console.log("Searching '%s' for a %d night stay starting on %s", campgroundDetails.label, program.length, program.start);
    reserveCalifornia.getSites(campgroundDetails, startDate, program.length).then((sites) => {
        console.log("Got sites", sites);
    });
    return 0;
}

main().then(function(result) {
    process.exitCode = result;
});
