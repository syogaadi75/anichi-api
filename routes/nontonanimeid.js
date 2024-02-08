const express = require('express')
const axios = require('axios')
const router = express.Router()
const cheerio = require('cheerio')

const BASEURL = 'https://nontonanimeid.org'

// axios.defaults.validateStatus = () => true

var options = {
  url: null,
  headers: {
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

module.exports = router
