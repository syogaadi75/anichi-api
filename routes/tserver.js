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

router.get('/recent', async (req, res) => {
  try {
    let ongoing = []
    let completed = []
    options.url = `${BASEURL}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('.rapi .venz').each((i, el) => {
      $(el)
        .find('ul li')
        .each((j, val) => {
          let slug = $(val).find('a').attr('href')?.split('/')[4]
          if (i === 0) {
            ongoing.push({
              slug,
              title: $(val).find('.thumbz h2.jdlflm').text().trim(),
              episode: $(val).find('.detpost .epz').text().replace(`Episode`, '').trim(),
              date: $(val).find('.detpost .newnime').text().trim(),
              day: $(val).find('.detpost .epztipe').text().trim(),
              cover: $(val).find('.thumbz img').attr('src')
            })
          } else if (i === 1) {
            completed.push({
              slug,
              title: $(val).find('.thumbz h2.jdlflm').text().trim(),
              episode: $(val).find('.detpost .epz').text().replace(`Episode`, '').trim(),
              date: $(val).find('.detpost .newnime').text().trim(),
              day: $(val).find('.detpost .epztipe').text().trim(),
              cover: $(val).find('.thumbz img').attr('src')
            })
          }
        })
    })

    res.send({
      ongoing,
      completed
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
      page.toString() === '1'
        ? `${BASEURL}/ongoing-anime`
        : `${BASEURL}/ongoing-anime/page/${page}}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('.venz ul li').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[4]
      list.push({
        slug,
        title: $(el).find('.thumbz h2.jdlflm').text().trim(),
        episode: $(el).find('.detpost .epz').text().replace(`Episode`, '').trim(),
        date: $(el).find('.detpost .newnime').text().trim(),
        day: $(el).find('.detpost .epztipe').text().trim(),
        cover: $(el).find('.thumbz img').attr('src')
      })
    })
    let maxPage = $('.pagination .pagenavix')
      .first()
      .find('a')
      .filter(function () {
        let title = $(this).attr('class')
        return title && title.toLowerCase().indexOf('next page-numbers') === -1
      })
      .last()
      .text()
      .replace(',', '')
      .trim()

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
router.get('/completed', async (req, res) => {
  try {
    const { page } = req.query
    let list = []
    options.url =
      page.toString() === '1'
        ? `${BASEURL}/complete-anime`
        : `${BASEURL}/complete-anime/page/${page}}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('.venz ul li').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[4]
      list.push({
        slug,
        title: $(el).find('.thumbz h2.jdlflm').text().trim(),
        episode: $(el).find('.detpost .epz').text().replace(`Episode`, '').trim(),
        date: $(el).find('.detpost .newnime').text().trim(),
        day: $(el).find('.detpost .epztipe').text().trim(),
        cover: $(el).find('.thumbz img').attr('src')
      })
    })
    let maxPage = $('.pagination .pagenavix')
      .first()
      .find('a')
      .filter(function () {
        let title = $(this).attr('class')
        return title && title.toLowerCase().indexOf('next page-numbers') === -1
      })
      .last()
      .text()
      .replace(',', '')
      .trim()

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
router.get('/anime/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params
    options.url = `${BASEURL}/anime/${animeId}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)

    const slug = animeId
    const cover = $('#venkonten .fotoanime img').attr('src')
    const seasons = []
    const synopsis = []
    $('#venkonten .sinopc p').each((i, el) => {
      if ($(el).text().includes('Tonton juga cerita sebelumnya')) {
        $(el)
          .find('a')
          .each((j, val) => {
            let url = $(val).attr('href')
            let title = $(val).text().trim()
            seasons.push({
              url,
              title
            })
          })
      } else {
        synopsis.push($(el).text()).trim()
      }
    })
    const info = {}
    $('.infozin .infozingle p').each(function () {
      let key = $(this).find('span b').text().toLowerCase().replace(' ', '_')
      let textSplit = $(this).find('span').text().split(':')
      let text = textSplit[1].trim()
      info[key] = text
    })
    const episodes = []
    const batch = []
    $('.episodelist').each((i, val) => {
      $(val)
        .find('ul li')
        .each((j, el) => {
          let href = $(el).find('a').attr('href')
          let parts = href.split('/')
          let slug = parts[4]
          let title = $(el).find('a').text().trim()
          let date = $(el).find('.zeebr').text().trim()
          if (i === 0) {
            batch.push({
              slug,
              title,
              date
            })
          } else if (i === 1) {
            episodes.push({
              slug,
              title,
              date
            })
          }
        })
    })

    const episode = {
      first: episodes[episodes.length - 1],
      last: episodes[0]
    }

    res.send({
      slug,
      cover,
      synopsis,
      seasons,
      info,
      batch,
      episodes,
      episode
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})
router.get('/get-video/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params
    options.url = `${BASEURL}/episode/${animeId}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)

    const title = $('.venutama h1.posttl').text().trim()
    const defaultPlayer = $('#pembed iframe').attr('src')
    const servers = []
    $('#embed_holder .mirrorstream ul').each((i, el) => {
      let resolution = $(el).attr('class')
      let resolutionServer = []
      $(el)
        .find('li')
        .each((j, val) => {
          let data = $(val).find('a').attr('data-content')
          let text = $(val).find('a').text().trim()
          resolutionServer.push({
            text,
            data
          })
        })
      servers.push({
        resolution,
        server: resolutionServer
      })
    })

    const downloads = []
    $('.venutama .download ul').each((i, el) => {
      $(el)
        .find('li')
        .each((j, val) => {
          let resolution = $(val).find('strong').text().trim()
          let server = []
          $(val)
            .find('a')
            .each((k, down) => {
              let text = $(down).text().trim()
              let src = $(down).attr('href')
              server.push({ text, src })
            })

          downloads.push({ resolution, server })
        })
    })

    const episodes = []
    $('.judul-recommend-anime-series .keyingpost li').each((i, el) => {
      let aEl = $(el).find('a')
      let split = aEl.attr('href').split('/')
      let slug = split[4]
      let text = aEl.text().trim()
      episodes.push({
        slug,
        text
      })
    })

    res.send({
      title,
      defaultPlayer: defaultPlayer ? defaultPlayer : '-',
      servers,
      episodes,
      downloads
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
