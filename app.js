const puppeteer = require("puppeteer");
const express = require("express");

const app = express();

const port = process.env.PORT || 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/asl", async (req, res) => {
  console.log("accessing scrapper...");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on("request", req => {
    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() == "image"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
  console.log(`scrapping for ${req.query.search}...`);
  try {
    await page.goto(
      "https://courses.startasl.com/mod/glossary/view.php?id=463"
    ); // URL is given by the "user" (your client-side application)
    await page.type("input.form-control", req.query.search);
    await page.click("input.btn.btn-secondary.mr-1");
    await page.waitForSelector("video.jw-video.jw-reset");

    const videos = await page.$$("div.jw-media.jw-reset");
    const titles = await page.$$("div.jw-title.jw-reset");

    let links = [];
    for (let i = 0; i < videos.length; i++) {
      let title = await titles[i].$eval(
        "div.jw-title-primary.jw-reset",
        div => div.textContent
      );

      let link = await videos[i].$eval(
        "video.jw-video.jw-reset",
        video => video.src
      );
      links.push({ title, link });
    }

    res.json({ links });
    await browser.close();
    console.log("Done scraping");
  } catch (error) {
    console.log("ERROR: ", error);
  }
  // await page.goto("https://courses.startasl.com/mod/glossary/view.php?id=463"); // URL is given by the "user" (your client-side application)
  // await page.type("input.form-control", req.query.search);
  // await page.click("input.btn.btn-secondary.mr-1");
  // await page.waitForSelector("video.jw-video.jw-reset");
});

app.post("/asl", function(req, res, next) {
  console.log("post");
});

app.listen(port, () => console.log(`url-scrapper listening on port ${port}!`));
