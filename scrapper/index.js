//dependencies
import fetch from "node-fetch";
import { load } from "cheerio";
import fs from "fs/promises";

const fetchHtml = async (url) => {
  const response = await fetch(url);
  const body = await response.text();

  return body;
};

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

const scrapper = async () => {
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
  console.log(newList);
};

const slowScrapper = async () => {
  let url = "https://www.property24.com/for-sale/gauteng/1";

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
  
  console.log(newList);
};

//todo
const fastScrapper = async () => {};

//todo
const superFastScrapper = async () => {};

export default scrapper;
