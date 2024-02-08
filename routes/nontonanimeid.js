const express = require('express')
const axios = require('axios')
const router = express.Router()
const cheerio = require('cheerio')
var request = require('request')
const zlib = require('zlib')
const jsdom = require('jsdom')

const BASEURL = 'https://nontonanimeid.org'

// axios.defaults.validateStatus = () => true

const userAgentList = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
]

var options = {
  url: null,
  withCredentials: true,
  headers: {
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'max-age=0',
    Priority: 'u=0, i',
    Cookie:
      '_gid=GA1.2.1132243309.1706598669; _ga_S0L4FL6T3J=GS1.1.1707390625.65.0.1707390625.0.0.0; _ga=GA1.2.755552039.1705300137; _gat_gtag_UA_79646797_8=1',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?1',
    'Sec-Ch-Ua-Platform': '"Android"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
  }
}

router.get('/recent', async (req, res) => {
  try {
    let list = []
    options.url = `${BASEURL}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('#postbaru').html()) {
      throw new Error('Page not found')
    }
    $('#postbaru')
      .first()
      .find('.misha_posts_wrap article')
      .each((i, el) => {
        list.push({
          slug: $(el)
            .find('a')
            .attr('href')
            ?.split('/')[3]
            .replace(/\b(?:-episode-[a-zA-Z0-9_]*)\b/gi, ''),
          title: $(el).find('.entry-title').text(),
          episode: ~~$(el).find('.episodes').text().replace(`"`, '').trim(),
          cover: $(el).find('.limit img').attr('src')?.split('?')[0],
          url: $(el)
            .find('a')
            .attr('href')
            ?.replace(/\b(?:-episode-[a-zA-Z0-9_]*)\b/gi, '')
        })
      })

    res.send({
      list: list
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('/list', async (req, res) => {
  try {
    let list = []
    const { page } = req.query
    const url = page.toString() === '1' ? `${BASEURL}/anime` : `${BASEURL}/anime/page/${page}`
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('.result').html()) {
      throw new Error('Page not found')
    }
    let maxPage = $('.result')
      .first()
      .find('.pagination a:not(.first,.previouspostslink,.nextpostslink,.last)')
      .last()
      .text()
      .replace(',', '')
    $('#a-z ul')
      .first()
      .find('li')
      .each((i, el) => {
        list.push({
          slug: $(el).find('a').attr('href')?.split('/')[4],
          title: $(el).find('h2').text(),
          cover: $(el).find('.top img').attr('src')?.split('?')[0],
          url: $(el).find('a').attr('href')
        })
      })
    let lastPageText = $('.pagination .pages').text().trim().split(' ')
    let lastPage = lastPageText[lastPageText.length - 1]
    if (list.length == 0) {
      throw new Error('Anime not found')
    }
    res.send({
      page: ~~page,
      maxPage: maxPage,
      list: list,
      lastPage: Number(lastPage)
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('', async (req, res) => {
  try {
  } catch (error) {
    res.send({
      message: error
    })
  }
})

module.exports = router
