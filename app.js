const puppeteer = require('puppeteer');
const express = require('express');

const app = express();

app.get('/asl', async (req, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
          req.abort();
      }
      else {
          req.continue();
      }
    })

    await page.goto('https://courses.startasl.com/mod/glossary/view.php?id=463'); // URL is given by the "user" (your client-side application)
    await page.type('input.form-control', req.query.search)
    await page.click('input.btn.btn-secondary.mr-1')
    await page.waitForSelector('video.jw-video.jw-reset')

    const videos = await page.$$('div.jw-media.jw-reset')

    let links = []
    for (let i = 0; i < videos.length; i++) {
      let link = await videos[i].$eval('video.jw-video.jw-reset', video => video.src)
      links.push(link)
    }

    res.json({links})
    await browser.close();
})

app.listen(4000);