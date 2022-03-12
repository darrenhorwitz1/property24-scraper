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

    console.log(listing);
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
