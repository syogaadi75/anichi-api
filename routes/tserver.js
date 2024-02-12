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

router.get('/popular', async (req, res) => {
  try {
    let list = []
    options.url = `${BASEURL}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('#slidertwo').html()) {
      throw new Error('Page not found')
    }
    $('#slidertwo')
      .first()
      .find('.swiper-wrapper .swiper-slide.item ')
      .each((i, el) => {
        let backgroundImage = $('.backdrop').css('background-image')
        backgroundImage = backgroundImage.replace('url(', '').replace(')', '').replace(/\"/gi, '')
        list.push({
          slug: $(el).find('a').attr('href')?.split('/')[4],
          title: $(el).find('h2').text(),
          cover: backgroundImage,
          url: $(el)
            .find('a.watch')
            .attr('href')
            ?.replace(/\b(?:-episode-[a-zA-Z0-9_]*)\b/gi, '')
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

router.get('/recent', async (req, res) => {
  try {
    let list = []
    options.url = `${BASEURL}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('.listupd').html()) {
      throw new Error('Page not found')
    }
    $('.listupd')
      .first()
      .find('.excstf article')
      .each((i, el) => {
        list.push({
          slug: $(el)
            .find('a')
            .attr('href')
            ?.split('/')[3]
            .replace(/\b(?:-episode-[a-zA-Z0-9_]*)\b/gi, ''),
          title: $(el)
            .find('.tt')
            .contents()
            .filter(function () {
              return this.nodeType === 3
            })
            .text()
            .trim(),
          episode: ~~$(el).find('.bt .epx').text().replace(`Episode`, '').trim(),
          cover: $(el).find('.ts-post-image').attr('src')?.split('?')[0],
          url: $(el)
            .find('a')
            .attr('href')
            ?.replace(/\b(?:-episode-[a-zA-Z0-9_]*)\b/gi, '')
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

router.get('/ongoing', async (req, res) => {
  try {
    const { page } = req.query
    let list = []
    options.url =
      page.toString() === '1' ? `${BASEURL}/ongoing` : `${BASEURL}/ongoing/page/${page}}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('.listupd').html()) {
      throw new Error('Page not found')
    }
    $('.listupd')
      .first()
      .find('.excstf article')
      .each((i, el) => {
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

    let maxPage = $('.page')
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
    const url = `${BASEURL}/anime/${animeId}`
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('.postbody').html()) {
      throw new Error('Page not found')
    }

    const slug = $('meta[property="og:url"]').attr('content')?.split('/')[4]
    const bigCover = $('.postbody .bigcover .ime img').attr('src')
    const cover = $('.postbody .bigcontent .thumb img').attr('src')
    const title = $('.postbody .bigcontent .infox h1.entry-title').text()
    const synopsis = []
    const paragraph = $('.postbody .bixbox.synp .entry-content p').each((i, el) => {
      synopsis.push($(el).text().trim())
    })
    const info = {}
    $('.postbody .bigcontent .info-content .spe span').each(function () {
      let key = $(this).find('b').text().replace(':', '').toLowerCase().replace(' ', '_')
      let text = $(this).text()
      let split = text.split(':')
      let value = split[1].trim()
      info[key] = value
    })
    const genres = []
    $('.postbody .bigcontent .info-content .genxed a').each((i, el) => {
      let hrefValue = $(el).attr('href')
      let parts = hrefValue.split('/')
      let slug = parts[parts.length - 2]
      genres.push({
        slug: slug,
        text: $(el).text()
      })
    })

    const episode = {
      first: $('.epcheck .inepcx .epcur.epcurfirst').text().replace('Episode', '').trim(),
      last: $('.epcheck .inepcx .epcur.epcurlast').text().replace('Episode', '').trim()
    }
    const episodes = []
    $('.epcheck .eplister ul li').each((i, el) => {
      let number = $(el).find('.epl-num').text()
      let text = $(el).find('.epl-title').text()
      let date = $(el).find('.epl-date').text()
      episodes.push({
        number,
        text,
        date
      })
    })

    res.send({
      slug,
      bigCover,
      cover,
      title,
      synopsis,
      genres,
      info,
      episode,
      episodes
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
    const url = BASEURL + `/anime/watch/slf-episode-18-sub-indo`
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)

    const defaultSrc = $('section iframe').attr('src')
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
    res.send({
      defaultSrc,
      servers
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('/get-video-two', async (req, res) => {
  try {
    const url = 'https://otakudesu.media/episode/kny-ksh-episode-1-sub-indo'
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)

    const defaultSrc = $('#pembed iframe').attr('src')
    res.send({
      defaultSrc,
      ts: 'jalan'
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

module.exports = router
