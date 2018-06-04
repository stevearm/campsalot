const puppeteer = require('puppeteer');

var getSites = async function(campground, startDate, length) {
  console.log("Starting single");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.reservecalifornia.com/CaliforniaWebHome/");
  await page.screenshot({path: 'example.png'});
  await browser.close();
  return "FAKE";
};

module.exports = {
    getSites: getSites
};
