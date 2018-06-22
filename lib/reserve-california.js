const debug = require("debug");
const log = debug("campsalot:reserve-california");
const browserLog = debug("campsalot:reserve-california:browser");

const puppeteer = require('puppeteer');

var _lookupCampground = function(campground) {
  // This is garbage until I figure out how to really look up the right details
  // POST to https://www.reservecalifornia.com/CaliforniaWebHome/Facilities/AdvanceSearch.aspx/GetCityPlacename
  // Cookie: AWSALB=...
  // Payload: {"name":"henry "}
  // {"d":[{"__type":"USeDirect.RDClasses.CityParkPlaceInfo","CityParkId":655,"Name":"Henry Cowell Redwoods SP","Latitude":37.040103912353516,"Longitude":-122.06401062011719,"Isactive":false,"EntityType":"Park","EnterpriseId":1,"ParkSize":"Medium","PlaceId":655},{"__type":"USeDirect.RDClasses.CityParkPlaceInfo","CityParkId":656,"Name":"Henry W Coe SP","Latitude":37.188003540039063,"Longitude":-121.54801177978516,"Isactive":false,"EntityType":"Park","EnterpriseId":1,"ParkSize":"Medium","PlaceId":656}]}
  if (campground == "Henry Cowell Redwoods SP") {
    return { CityPark: 655, ParkSize: "Medium", Placeid: 655, label: "Henry Cowell Redwoods SP", logo:"Park", value:"37.040103912353516,-122.06401062011719" };
  }
  return null;
}

var getSites = async function(campground, startDate, length) {
  const formattedStartDate = startDate.toLocaleDateString("en-US", {day:"2-digit", month:"2-digit", year:"numeric"});
  var campgroundDetails = _lookupCampground(campground);
  if (campgroundDetails === null) {
    return null;
  }

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
    }, campgroundDetails, formattedStartDate);
    await searchResultPromise;

    await page.waitForSelector(".facilility_sub_box");
    const results = await page.evaluate(function() {
      const tmp = $(".facilility_sub_box").map(function(i, row) {
        const element = $(row);
        var error = null;
        const title = element.find(".main_tit_sub_facility").text();
        const url = $(element.find(".faci_icn img")[0]).attr("src");
        var type = null;
        var available = null;
        if (url == "https://www.reservecalifornia.com/CaliforniaWebHome/themes/California/GoogleMapIcons/Camping/AvailableWithCriteria.png") {
          type = "camping";
          available = true;
        } else if (url == "https://www.reservecalifornia.com/CaliforniaWebHome/themes/California/GoogleMapIcons/Camping/AvailableNotCriteria.png") {
          type = "camping";
          available = false;
        } else if (url == "https://www.reservecalifornia.com/CaliforniaWebHome/themes/California/GoogleMapIcons/GroupCamping/AvailableWithCriteria.png") {
          type = "groupCamping";
          available = true;
        } else if (url == "https://www.reservecalifornia.com/CaliforniaWebHome/themes/California/GoogleMapIcons/GroupCamping/AvailableNotCriteria.png") {
          type = "groupCamping";
          available = false;
        } else {
          error = "Unknown source url: " + url;
        }
        return {title: title, available: available, error: error};
      }).get();
      return tmp;
    });

    return results;
  } catch(error) {
    console.log("Failed to get sites");
    console.error(error);
    return "Failed";
  } finally {
    await browser.close();
  }
};

module.exports = {
    getSites: getSites
};

// Fill in form
// $("#hdnparksize").val("Medium"); $("#hdndefaultLat").val("37.040103912353516"); $("#hdndefaultLag").val("-122.06401062011719"); $("#txtSearchparkautocomplete").val("Henry Cowell Redwoods SP"); $("#mainContent_hdnSearchtype").val("Park"); $("#txtDefaultautocomplete").val("Henry Cowell Redwoods SP"); $("#hdnSearchPlaceName").val("Henry Cowell Redwoods SP");
// $("#mainContent_txtArrivalDate")[0].value = "06/14/2018"; $("#ddlHomeNights option")[4].selected = true; $("#btnSearch")[0].click();
