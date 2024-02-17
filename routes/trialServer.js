const express = require('express')
const axios = require('axios')
const router = express.Router()
const cheerio = require('cheerio')
var request = require('request')
const zlib = require('zlib')
const jsdom = require('jsdom')
const puppeteer = require('puppeteer')
const BASEURL = 'https://nontonanimeid.buzz'

router.get('/recent', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: './tmp'
  })
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
})

module.exports = router
