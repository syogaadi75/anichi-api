const express = require('express')
const axios = require('axios')
const router = express.Router()
const BASEURL = 'https://nontonanimeid.buzz'

const chrome = require('chrome-aws-lambda')
const puppeteer = require('puppeteer')

router.get('/recent', async (req, res) => {
  let options = {
    args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
    defaultViewport: chrome.defaultViewport,
    executablePath: await chrome.executablePath,
    headless: true,
    ignoreHTTPSErrors: true
  }
  try {
    let browser = await puppeteer.launch(options)
    const page = await browser.newPage()
    await page.goto(BASEURL)

    const data = []
    const animes = await page.$$('#postbaru .misha_posts_wrap article')
    for (let anime of animes) {
      const title = await anime.evaluate(
        (el) => el.querySelector('.title.less.nlat.entry-title').textContent,
        anime
      )
      data.push(title)
      console.log(title, 'title')
    }
    await browser.close()
    res.send(data)
  } catch (error) {
    res.send(error)
  }
})

module.exports = router
