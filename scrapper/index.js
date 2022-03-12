//dependencies
import fetch from "node-fetch";
import cheerio, { load } from "cheerio";

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

const extractListings = (htmlPage) => {
  //loading the html
  let $ = load(htmlPage);

  //   return $("div[class=js_listingResultsContainer]").html();
  let l;
  $("div.p24_promotedTile").each((i, e) => {
    console.log(i);
    if (i === 0) {
      const title = e.attribs.title;
      const listing_id = e.attribs["data-listing-number"];
      const price = $(e).find(".p24_price").text().trim();
      const size = $(e).find(".p24_size").find("span").text();
      //   const no_bedrooms = $(e).find(".p24_price").html();
      //   const no_bathrooms = $(e).find(".p24_price").html();
      console.log({ title, listing_id, price, size });
    }
  });

  //   console.log(l);

  return "done";
};

const extractPaginationBar = (htmlPage) => {};

const scrapper = async () => {
  let url =
    "https://www.property24.com/for-sale/douglasdale/sandton/gauteng/3903";

  console.log("fetching");
  const html = await fetchHtml(url);

  const listings = extractListings(html);
  console.log(listings);
};

export default scrapper;
