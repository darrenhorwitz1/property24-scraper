// import scrapper, { slowScrapper } from "./scrapper/index.js";
const { scrapper, slowScrapper, fastScrapper } = require("./scrapper");

const main = async () => {
//   await scrapper();
//   await slowScrapper();
  await fastScrapper();
  console.log("finito");
};

main();
