const express = require('express')
const axios = require('axios')
const router = express.Router()
const cheerio = require('cheerio')
var request = require('request')
const zlib = require('zlib')
const jsdom = require('jsdom')

const BASEURL = 'https://animex.biz.id'

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
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
  }
}

router.get('/search', async (req, res) => {
  try {
    const { s } = req.query
    const searchUrl = s.replace(' ', '+')
    let list = []
    options.url = `${BASEURL}/?s=${searchUrl}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('.listupd article').each((i, el) => {
      list.push({
        slug: $(el).find('a').attr('href')?.split('/')[4],
        title: $(el).find('.tt').text(),
        episode: ~~$(el).find('.bt .epx').text().replace(`Episode`, '').trim(),
        cover: $(el).find('.ts-post-image').attr('src')?.split('?')[0],
        url: $(el)
          .find('a')
          .attr('href')
          ?.replace(/\b(?:-episode-[a-zA-Z0-9_]*)\b/gi, '')
      })
    })

    let maxPage = $('.postbody')
      .first()
      .find('.pagination a:not(.prev,.next)')
      .last()
      .text()
      .replace(',', '')
    res.send({
      page: Number(page),
      maxPage: Number(maxPage),
      list
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('/genres', async (req, res) => {
  try {
    let list = []
    options.url = `${BASEURL}/genre`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('.postbody').html()) {
      throw new Error('Page not found')
    }
    $('.postbody ul.taxindex li').each((i, el) => {
      let hrefValue = $(el).find('a').attr('href')
      let parts = hrefValue.split('/')
      let slug = parts[parts.length - 2]
      let name = $(el).find('a span.name').text()
      let count = $(el).find('a span.count').text()
      list.push({
        slug,
        name,
        count
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

router.get('/genres/:id', async (req, res) => {
  try {
    const { page } = req.query
    const { id } = req.params
    let list = []
    options.url =
      page.toString() === '1' ? `${BASEURL}/genres/${id}` : `${BASEURL}/genres/${id}/page/${page}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('.listupd').html()) {
      throw new Error('Page not found')
    }
    $('.listupd')
      .first()
      .find('article')
      .each((i, el) => {
        list.push({
          slug: $(el).find('a').attr('href')?.split('/')[4],
          title: $(el).find('.tt').text(),
          cover: $(el).find('.ts-post-image').attr('src')?.split('?')[0],
          url: $(el)
            .find('a')
            .attr('href')
            ?.replace(/\b(?:-episode-[a-zA-Z0-9_]*)\b/gi, '')
        })
      })

    let maxPage = $('.postbody')
      .first()
      .find('.pagination a:not(.prev,.next)')
      .last()
      .text()
      .replace(',', '')
    if (list.length == 0) {
      throw new Error('Anime not found')
    }
    res.send({
      page: Number(page),
      maxPage: Number(maxPage),
      list
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('/ongoing', async (req, res) => {
  try {
    const { page } = req.query
    let list = []
    options.url = page.toString() === '1' ? `${BASEURL}` : `${BASEURL}/anime/ongoing/${page}}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('div.row[itemscope] div.col-md-3.col-6.text-start.mb-4').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[3].split('-sub-indo')[0]
      console.log(slug, 'slug')
      list.push({
        slug,
        title: $(el).find('.marquee__line').text(),
        episode: $(el).find('p').text().replace(`Episode`, '').trim(),
        cover: $(el).find('img').attr('src')?.split('?')[0]
      })
    })

    res.send({
      page: Number(page),
      maxPage: 4,
      list
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('/anime', async (req, res) => {
  try {
    let list = []
    const { page } = req.query
    const url = page.toString() === '1' ? `${BASEURL}/anime` : `${BASEURL}/anime/?page=${page}`
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('.listupd').html()) {
      throw new Error('Page not found')
    }
    $('.listupd')
      .first()
      .find('article')
      .each((i, el) => {
        list.push({
          slug: $(el).find('a').attr('href')?.split('/')[4],
          title: $(el).find('.tt h2').text(),
          cover: $(el).find('.bt img').attr('src')?.split('?')[0],
          url: $(el).find('a').attr('href')
        })
      })
    if (list.length == 0) {
      throw new Error('Anime not found')
    }
    res.send({
      page: Number(page),
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
    let list = []
    const { animeId } = req.params
    const url = `${BASEURL}/anime/view/${animeId}-sub-indo`
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)

    const slug = animeId
    const cover = $('.container img[itemprop="thumbnail"]').attr('src')
    const synopsis = $('p.card-body.mt-n4.overflow-auto.text-dark').text()
    const info = {}
    $('table.table.table-bordered.table-hover.text-dark tbody tr').each(function () {
      let key = $(this).find('th').text().toLowerCase().replace(' ', '_')
      let text = $(this).find('td').text()
      info[key] = text
    })
    const episodes = []
    $('.container .card-body.list-group.mt-n4.overflow-auto.mb-4 a').each((i, el) => {
      episodes.push({
        slug: $(el)
          .attr('href')
          .match(/\/([a-z-]+)-episode/i)[1],
        episode: $(el)
          .attr('href')
          .match(/episode-(\d+)/i)[1]
      })
    })

    const episode = {
      first: episodes[0],
      last: episodes[episodes.length - 1]
    }

    res.send({
      slug,
      cover,
      synopsis,
      info,
      episodes,
      episode
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('/get-video', async (req, res) => {
  try {
    const { slug, episode } = req.query
    const url = BASEURL + `/anime/watch/${slug}-episode-${episode}-sub-indo`
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)

    const defaultSrc = BASEURL + $('section iframe').attr('src')
    const servers = []
    $('.dropdown').each((i, el) => {
      let resolution = $(el).find('button').text()
      if (resolution == '360p') {
        let server360 = []
        $(el)
          .find('.dropdown-content a')
          .each((j, val) => {
            var onclickValue = $(val).attr('onclick')
            var src = onclickValue.match(/'(.*?)'/)[1]
            server360.push({ text: $(val).text(), src })
          })
        servers.push({
          resolution: '360',
          list: server360
        })
      } else if (resolution == '480p') {
        let server480 = []
        $(el)
          .find('.dropdown-content a')
          .each((j, val) => {
            var onclickValue = $(val).attr('onclick')
            var src = onclickValue.match(/'(.*?)'/)[1]
            server480.push({ text: $(val).text(), src })
          })
        servers.push({
          resolution: '480',
          list: server480
        })
      } else if (resolution == '720p') {
        let server720 = []
        $(el)
          .find('.dropdown-content a')
          .each((j, val) => {
            var onclickValue = $(val).attr('onclick')
            var src = onclickValue.match(/'(.*?)'/)[1]
            server720.push({ text: $(val).text(), src })
          })
        servers.push({
          resolution: '720',
          list: server720
        })
      }
    })

    const downloads = []
    $('.table-responsive.m-4 table.card-body.overflow-auto.table.table-hover.mt-n2 tbody tr').each(
      (i, el) => {
        let type = $(el).find('th').text()
        let sources = []
        $(el)
          .find('td')
          .each((j, val) => {
            sources.push({
              source: $(el).find('a').text(),
              src: $(el).find('a').attr('href')
            })
          })
        downloads.push({ type, sources })
      }
    )
    const episodes = []
    $('.container .card-body.overflow-auto.list-group.mt-n4.mb-4 a').each((i, el) => {
      episodes.push({
        slug: $(el)
          .attr('href')
          .match(/^[a-z]+(?=-episode)/i)[0],
        episode: $(el)
          .attr('href')
          .match(/-episode-(\d+)/i)[1]
      })
    })
    res.send({
      defaultSrc,
      servers,
      downloads,
      episodes
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

module.exports = router
