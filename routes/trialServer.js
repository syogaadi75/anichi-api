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
    options.url = `${BASEURL}/episode/${animeId}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    const defaultPlayer = $('#pembed iframe').attr('src')
    const miror = []
    $('#embed_holder .mirrorstream ul').each((i, el) => {
      let resolution = $(el).attr('class')
      let resolutionServer = []
      $(el)
        .find('li')
        .each((j, val) => {
          let data = $(val).find('a').attr('data-content')
          let text = $(val).find('a').text().trim()
          console.log(data, 'data')
          resolutionServer.push({
            text,
            data
          })
        })
      miror.push({
        resolution,
        server: resolutionServer
      })
    })

    res.send({
      defaultPlayer: defaultPlayer ? defaultPlayer : 'kosong bro',
      decode: JSON.parse(decode),
      miror
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})
router.get('/changeServer/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params
    // aa1208d27f29ca340c92c66d1926f13f
    let url = `https://otakudesu.cloud/wp-admin/admin-ajax.php`
    const bdy = JSON.parse(atob(serverId))
    const by = {
      ...bdy,
      nonce: 'ca81c19476',
      action: '2a3505c93b0035d3f455df82bf976b84'
    }
    const resp = await axios.post(url, by, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    })
    const HTMLServer = atob(resp.data.data)
    const $ = cheerio.load(HTMLServer)

    const srcValue = $('iframe').attr('src')
    res.send({
      src: srcValue
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.post('/changeServer', async (req, res) => {
  try {
    const { encryptServer } = req.body
    const decryptServer = JSON.parse(atob(encryptServer))
    const body = {
      id: String(decryptServer.id),
      i: String(decryptServer.i),
      q: String(decryptServer.q),
      nonce: 'faafb321d6',
      action: '2a3505c93b0035d3f455df82bf976b84'
    }

    const newoptions = {
      method: 'post',
      url: `https://otakudesu.cloud/wp-admin/admin-ajax.php`,
      data: body,
      withCredentials: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    }
    const data = await axios.request(newoptions)
    res.send({ data })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

module.exports = router
