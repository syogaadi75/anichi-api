const express = require('express')
const axios = require('axios')
const router = express.Router()
const BASEURL = 'https://otakudesu.cloud'
const SECONDBASEURL = 'https://nontonanimeid.buzz'
const cheerio = require('cheerio')

const chrome = require('chrome-aws-lambda')
const puppeteer = require('puppeteer')

var options = {
  url: null,
  withCredentials: true,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
}

router.get('/recent2', async (req, res) => {
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
    await page.goto(SECONDBASEURL)

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

router.get('/recent', async (req, res) => {
  try {
    const { page } = req.query
    let list = []
    options.url = page.toString() === '1' ? `${BASEURL}` : `${BASEURL}/page/${page}}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('.venz ul li').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[4]
      list.push({
        slug,
        title: $(el).find('h2.jdlflm').text()
        // episode: $(el).find('p').text().replace(`Episode`, '').trim(),
        // cover: $(el).find('img').attr('src')?.split('?')[0]
      })
    })

    res.send({
      list
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('/anime/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params

    let list = []
    options.url = `${BASEURL}/${animeId}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    const defaultPlayer = $('#pembed iframe').attr('src')

    res.send({
      defaultPlayer: defaultPlayer ? defaultPlayer : 'kosong bro'
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

module.exports = router
