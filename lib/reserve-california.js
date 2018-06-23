// Debugging
const debug = require("debug");
const log = debug("campsalot:reserve-california");
const browserLog = debug("campsalot:reserve-california:browser");

const puppeteer = require('puppeteer');
const request = require('request');

var lookupCampground = async function(campground) {
    return new Promise(function(resolve, reject) {
        request({
            uri: "https://www.reservecalifornia.com/CaliforniaWebHome/Facilities/AdvanceSearch.aspx/GetCityPlacename",
            method: "POST",
            json: {name: campground},
        }, function (error, response, body) {
            if (error) {
                reject(error);
            } else if (response.statusCode != 200) {
                reject("Bad status code: " + response.statusCode);
            } else {
                const result = body.d.map(function(x) {
                    /*
                    Got:
                    {   __type: 'USeDirect.RDClasses.CityParkPlaceInfo',
                        CityParkId: 655,
                        Name: 'Henry Cowell Redwoods SP',
                        Latitude: 37.040103912353516,
                        Longitude: -122.06401062011719,
                        Isactive: false,
                        EntityType: 'Park',
                        EnterpriseId: 1,
                        ParkSize: 'Medium',
                        PlaceId: 655 }
                    Need:
                    {   CityPark: 655,
                        ParkSize: "Medium",
                        Placeid: 655,
                        label: "Henry Cowell Redwoods SP",
                        logo:"Park",
                        value:"37.040103912353516,-122.06401062011719" }
                    */
                    return {
                        CityPark: x.CityParkId,
                        ParkSize: x.ParkSize,
                        Placeid: x.PlaceId,
                        label: x.Name,
                        logo: x.EntityType,
                        value: "" + x.Latitude + "," + x.Longitude };
                });
                resolve(result);
            };
        });
    });
}

/**
 * @param campground: Expected to be the return value from lookupCampground
 * @param startDate: a Date object
 * @param length: an integer
 */
var getSites = async function(campground, startDate, length) {
    const formattedStartDate = startDate.toLocaleDateString("en-US", {day:"2-digit", month:"2-digit", year:"numeric"});

    const browserSettings = {};
    if (browserLog.enabled) {
        browserSettings.headless = false; // Launch visible for debugging
    }

    const browser = await puppeteer.launch(browserSettings);
    try {
        const page = await browser.newPage();

        // Setup console logger inside page context
        page.on('console', x => browserLog(x._text));

        await page.goto("https://www.reservecalifornia.com/CaliforniaWebHome/");

        const searchResultPromise = page.waitForNavigation();
        await page.evaluate(function(campgroundDetails, startDate) {
            $("#hdnsearchplaceid").val(campgroundDetails.Placeid);
            $("#hdnparksize").val(campgroundDetails.ParkSize);
            $("#hdndefaultLat").val(campgroundDetails.value.split(',')[0]);
            $("#hdndefaultLag").val(campgroundDetails.value.split(',')[1]);
            $("#hdnAutoPlaceId").val(campgroundDetails.CityPark);
            $("#hdnMasterPlaceId").val(campgroundDetails.CityPark);
            $("#txtSearchparkautocomplete").val(campgroundDetails.label);
            $("#mainContent_hdnSearchtype").val(campgroundDetails.logo);
            $("#txtDefaultautocomplete").val(campgroundDetails.label);
            $("#hdnSearchPlaceName").val(campgroundDetails.label);
            $("#mainContent_txtArrivalDate")[0].value = startDate;
            $("#ddlHomeNights option")[4].selected = true;
            $("#btnSearch")[0].click();
        }, campground, formattedStartDate);
        await searchResultPromise;

        await page.waitForSelector(".facilility_sub_box");
        const results = await page.evaluate(function() {
            return $(".facilility_sub_box").map(function(i, row) {
                const element = $(row);
                const result = { title: element.find(".main_tit_sub_facility").text() };
                const url = $(element.find(".faci_icn img")[0]).attr("src");
                if (url == "https://www.reservecalifornia.com/CaliforniaWebHome/themes/California/GoogleMapIcons/Camping/AvailableWithCriteria.png") {
                    result.type = "camping";
                    result.available = true;
                } else if (url == "https://www.reservecalifornia.com/CaliforniaWebHome/themes/California/GoogleMapIcons/Camping/AvailableNotCriteria.png") {
                    result.type = "camping";
                    result.available = false;
                } else if (url == "https://www.reservecalifornia.com/CaliforniaWebHome/themes/California/GoogleMapIcons/GroupCamping/AvailableWithCriteria.png") {
                    result.type = "groupCamping";
                    result.available = true;
                } else if (url == "https://www.reservecalifornia.com/CaliforniaWebHome/themes/California/GoogleMapIcons/GroupCamping/AvailableNotCriteria.png") {
                    result.type = "groupCamping";
                    result.available = false;
                } else {
                    result.error = "Unknown source url: " + url;
                }
                return result;
            }).get();
        });

        return results;
    } finally {
        await browser.close();
    }
};

module.exports = {
    lookupCampground: lookupCampground,
    getSites: getSites
};
