//dependencies
// const fetch = require("node-fetch");
const { default: axios } = require("axios");
const { load } = require("cheerio");
const fs = require("fs");
require = require("esm")(module);
// import { registerInterceptor } from "axios-cached-dns-resolve";
const { registerInterceptor } = require("axios-cached-dns-resolve");

const config = {
  disabled: process.env.AXIOS_DNS_DISABLE === "true",
  dnsTtlMs: process.env.AXIOS_DNS_CACHE_TTL_MS || 5000, // when to refresh actively used dns entries (5 sec)
  cacheGraceExpireMultiplier:
    process.env.AXIOS_DNS_CACHE_EXPIRE_MULTIPLIER || 2, // maximum grace to use entry beyond TTL
  dnsIdleTtlMs: process.env.AXIOS_DNS_CACHE_IDLE_TTL_MS || 1000 * 60 * 60, // when to remove entry entirely if not being used (1 hour)
  backgroundScanMs: process.env.AXIOS_DNS_BACKGROUND_SCAN_MS || 2400, // how frequently to scan for expired TTL and refresh (2.4 sec)
  dnsCacheSize: process.env.AXIOS_DNS_CACHE_SIZE || 100, // maximum number of entries to keep in cache
  // pino logging options
  //   logging: {
  //     name: "axios-cache-dns-resolve",
  //     // enabled: true,
  //     level: process.env.AXIOS_DNS_LOG_LEVEL || "info", // default 'info' others trace, debug, info, warn, error, and fatal
  //     // timestamp: true,
  //     prettyPrint: process.env.NODE_ENV === "DEBUG" || false,
  //     useLevelLabels: true,
  //   },
};
console.log(config);

const axiosClient = axios.create(config);

registerInterceptor(axiosClient);

const fetchHtml = async (url) => {
  const response = await axiosClient.get(url);
  const body = await response.data;

  return body;
};

const fasterFetchHtml = () => {};

/**
 * NOTES:
 * - div with class "p24_results" constains a list of property listings
 * - div with class "js_listingResultsContainer" constains a list of property listings
 * - div with class "p24_promotedTile" contains the listing details (see below)
 * - div with class "p24_content" has the details of a property listing:price, bedrooms, bathroom, size
 */

const extractListingsData = (htmlPage) => {
  const listingsArr = [];

  //loading the html
  let $ = load(htmlPage);

  $("div.p24_regularTile").each((i, e) => {
    const listing = {};

    listing["listing_id"] = e.attribs["data-listing-number"];
    listing["title"] = $(e).find("meta[itemprop=name]").attr("content");

    listing["price"] = parseFloat(
      $(e).find(".p24_price").text().trim().replace(/[R ]+/g, "")
    );
    listing["size"] = parseFloat($(e).find(".p24_size").find("span").text());
    listing["no_bedrooms"] = parseFloat(
      $(e).find("span[title=Bedrooms]").find("span").text()
    );
    listing["no_bathrooms"] = parseFloat(
      $(e).find("span[title=Bathrooms]").find("span").text()
    );
    listing["no_parking_spaces"] = parseFloat(
      $(e).find("span[title='Parking Spaces']").find("span").text()
    );
    listing["location"] = $(e).find(".p24_location").text();
    listing["address"] = $(e).find(".p24_address").text();

    listingsArr.push(listing);
  });

  //   console.log(l);

  return listingsArr;
};

const extractLastPageFromPaginationBar = (htmlPage) => {
  let $ = load(htmlPage);
  const lastPageNumber = parseFloat(
    $("ul.pagination").find("li").last().text()
  );
  return lastPageNumber;
};

const createPageNumberList = (lastPageNumber) => {
  const arr = [];
  for (let i = 0; i < lastPageNumber; i++) {
    arr.push(i + 1);
  }
  return arr;
};

const extractListingsPerPage = async (url, pageNumber) => {
  let html;
  if (pageNumber === 1) {
    html = await fetchHtml(url);
  } else {
    html = await fetchHtml(`${url}/p${pageNumber}`);
  }

  console.log(`extracting PAGE ${pageNumber} `);
  return await extractListingsData(html);
};

const storeData = (data) => {
  console.log("writing to filesystem ...");

  const dir = "./outputs";

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const writeStream = fs.createWriteStream("./outputs/data.json");
  writeStream.write(JSON.stringify(data));

  writeStream.end();

  console.log("writing to filesystem was successful");
};

const scrapper = async () => {
  console.time("normal");
  let url =
    "https://www.property24.com/for-sale/douglasdale/sandton/gauteng/3903";

  console.log("fetching");
  const html = await fetchHtml(url);
  const lastPage = extractLastPageFromPaginationBar(html);

  const pageNumberList = createPageNumberList(lastPage);

  const getListingsAsync = pageNumberList.map((pageNumber) =>
    extractListingsPerPage(url, pageNumber)
  );
  const listOfListingArrays = await Promise.all(getListingsAsync);

  const newList = [].concat.apply([], listOfListingArrays);
  console.timeEnd("normal");

  storeData(newList);
};

//   let url = "https://www.property24.com/for-sale/gauteng/1";
const slowScrapper = async () => {
  console.time("slow");

  let url =
    "https://www.property24.com/for-sale/douglasdale/sandton/gauteng/3903";
  console.log("fetching");
  const html = await fetchHtml(url);
  const lastPage = extractLastPageFromPaginationBar(html);
  const pageNumberList = createPageNumberList(lastPage);
  const listings = [];

  for (let page in pageNumberList) {
    const pageDataList = await extractListingsPerPage(url, page);
    listings.push(pageDataList);
  }
  const newList = [].concat.apply([], listings);
  console.timeEnd("slow");

  storeData(newList);
};

//todo
const fastScrapper = async () => {
  console.time("fast");

  let url = "https://www.property24.com/for-sale/gauteng/1";
  console.log("fetching");
  const html = await fetchHtml(url);
  const lastPage = extractLastPageFromPaginationBar(html);
  const pageNumberList = createPageNumberList(lastPage);

  const pgNoList = [];
  while (pageNumberList.length) pgNoList.push(pageNumberList.splice(0, 50));

  console.log(pgNoList);
  let list = [];
  for (let index in pgNoList) {
    console.log();
    const getListingsAsync = pgNoList[index].map(async (pageNumber) => {
      let x = [];
      try {
        x = await extractListingsPerPage(url, pageNumber);
      } catch (err) {
        console.log("FUCK !!!!!!!!!!!!!!!!!!!!!!!");
        console.log(err);
      }
      return x;
    });
    const listOfListingArrays = await Promise.all(getListingsAsync);

    _list = [].concat.apply([], listOfListingArrays);
    list.push(_list);
  }

  const newList = [].concat.apply([], list);

  console.timeEnd("fast");

  storeData(newList);
};

//todo
const superFastScrapper = async () => {};

module.exports = { scrapper, slowScrapper, fastScrapper };
