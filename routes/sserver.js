const express = require('express')
const axios = require('axios')
const router = express.Router()
const cheerio = require('cheerio')
var request = require('request')
const zlib = require('zlib')
const jsdom = require('jsdom')
const https = require('https');
const chromium = require('@sparticuz/chromium-min')
const puppeteer = require('puppeteer-core'); 
const path = require('path')


const BASEURL = 'https://api.scraperapi.com/?api_key=6bfa7c860fb506b663c33ec60132cae1&url='


async function getBrowser() { 
  return puppeteer.launch({
    args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
    defaultViewport: chromium.defaultViewport,
    executablePath:
      process.env.NODE_ENV === 'production'
        ? await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v127.0.0/chromium-v127.0.0-pack.tar`)
        : path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe'),
    headless: chromium.headless,
    ignoreHTTPSErrors: true
  })
}

// axios.defaults.validateStatus = () => true
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
];
let userAgentIndex = 0;

var options = {
  url: null,
  withCredentials: true,
  headers: {
    'User-Agent': userAgents[userAgentIndex]
  }
};

router.get('/home', async (req, res) => {
  try {
    let animes = [];
    options.url = `https://samehadaku.today`;

    // Menggunakan User-Agent saat ini
    options.headers['User-Agent'] = userAgents[userAgentIndex];

    const base = await axios.request(options);
    const $ = cheerio.load(base.data);
    
    $('.listupd.normal .excstf article').each((i, el) => {
      let slug = $(el).find('a').attr('href');
      let cover = '';
      $('img').each((j, val) => {
        if(!$(val).attr('src').includes('data:image')) {
          cover = $(val).attr('src');
        }
      })
      animes.push({
        slug,
        title: $(el).find('.tt').text().trim(),
        episode: $(el).find('.bt .epx').text().trim(),
        cover
      });
    });

    res.send(animes);
  } catch (error) {
    // Ganti User-Agent jika terjadi error
    userAgentIndex = (userAgentIndex + 1) % userAgents.length;
    options.headers['User-Agent'] = userAgents[userAgentIndex];

    res.status(500).send({
      index: userAgentIndex,
      agent: userAgents[userAgentIndex],
      message: error.message // Mengirim pesan error untuk debugging
    });
  }
}); 

router.get('/video', async (req, res) => {
  try { 
    options.url = `https://samehadaku.today/blue-lock-season-2-episode-1-sub-indonesia`;

    // Menggunakan User-Agent saat ini
    options.headers['User-Agent'] = userAgents[userAgentIndex];

    const base = await axios.request(options);
    const $ = cheerio.load(base.data);
    
    let mainServer = $("#embed_holder #pembed iframe").attr('data-lazy-src');
    let listServer = [];
    $(".item.video-nav .mobius select option").each((i, el) => {
      if($(el).attr('value') != '') { 
        let base64Value = $(el).attr('value'); 
        let decodedValue = atob(base64Value); 
        const regex = /src="([^"]+)"/;
        const match = decodedValue.match(regex);
        let iframeSrc = match ? match[1] : null;

        listServer.push({
          server: $(el).text().trim(),
          src: iframeSrc
        });
      }
    });

    const data = {
      mainServer,
      listServer
    }
    res.send(data);
  } catch (error) {
    // Ganti User-Agent jika terjadi error
    userAgentIndex = (userAgentIndex + 1) % userAgents.length;
    options.headers['User-Agent'] = userAgents[userAgentIndex];

    res.status(500).send({
      index: userAgentIndex,
      agent: userAgents[userAgentIndex],
      message: error.message // Mengirim pesan error untuk debugging
    });
  }
}); 

router.get('/v2/home', async (req, res) => {
  try { 
    options.url = `https://s1.nontonanimeid.boats?__cf_chl_rt_tk=_e0TSt3bOpije8xhykE4sfPorqqktt9UOXpzSm4AemU-1728280855-0.0.1.1-7124`;

    const browser = await getBrowser()
    const page = await browser.newPage() 
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.goto(options.url) 
    page.on('console', async e => {
      const args = await Promise.all(e.args().map(a => a.jsonValue()));
      console.log(...args);
    });

    // const animes = await page.evaluate(() => {
    //   const data = []
    //   document.querySelectorAll('#postbaru .misha_posts_wrap article').forEach((el) => {
    //     let slug = el.querySelector('a').getAttribute('href');
    //     data.push({
    //       slug,
    //       title: el.querySelector('h3.title').textContent.trim(),
    //       episode: el.querySelector('.types.episodes').textContent.trim(),
    //       cover: el.querySelector('img').getAttribute('src')
    //     });
    //   });
    //   return data
    // });
    const body = await page.evaluate(() => document.body.innerHTML);
    res.send(body);
    // res.send(page);
  } catch (error) { 
    res.status(500).send({ 
      message: error.message // Mengirim pesan error untuk debugging
    });
  }
});


router.post('/search', async (req, res) => {
  try {
    const { title } = req.body
    const searchUrl = title.replace(' ', '+')
    let list = []
    options.url = `${BASEURL}/anime/search?q=${searchUrl}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('div.row[itemscope] div.col-md-3.col-6.text-start.mb-4').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[3].split('-sub-indo')[0]
      list.push({
        slug,
        title: $(el).find('.marquee__line').text(),
        cover: $(el).find('img').attr('src')?.split('?')[0]
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

router.get('/genres', async (req, res) => {
  try {
    let list = []
    options.url = `${BASEURL}/anime/genres`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    if (!$('.container').html()) {
      throw new Error('Page not found')
    }
    $('.container table tbody tr').each((i, el) => {
      let hrefValue = $(el).find('a').attr('href')
      let parts = hrefValue.split('/')
      let slug = parts[parts.length - 2]
      let name = $(el).find('a').text()
      list.push({
        slug,
        name
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
    options.url = `${BASEURL}/anime/genre/${id}/${page}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('div.row[itemscope] div.col-md-3.col-6.text-start.mb-4').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[3].split('-sub-indo')[0]
      list.push({
        slug,
        title: $(el).find('.marquee__line').text(),
        episode: $(el).find('p').text().replace(`Episode`, '').trim(),
        cover: $(el).find('img').attr('src')?.split('?')[0]
      })
    })

    let maxPage = $('ul.pagination')
      .first()
      .find('.page-item a')
      .filter(function () {
        let title = $(this).attr('title')
        return title && title.toLowerCase().indexOf('berikutnya') === -1
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

router.get('/ongoing', async (req, res) => {
  try {
    const { page } = req.query
    let list = []
    options.url = page.toString() === '1' ? `${BASEURL}` : `${BASEURL}/anime/ongoing/${page}}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('div.row[itemscope] div.col-md-3.col-6.text-start.mb-4').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[3].split('-sub-indo')[0]
      list.push({
        slug,
        title: $(el).find('.marquee__line').text(),
        episode: $(el).find('p').text().replace(`Episode`, '').trim(),
        cover: $(el).find('img').attr('src')?.split('?')[0]
      })
    })
    let maxPage = $('ul.pagination')
      .first()
      .find('.page-item a')
      .filter(function () {
        let title = $(this).attr('title')
        return title && title.toLowerCase().indexOf('berikutnya') === -1
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
      page.toString() === '1' ? `${BASEURL}/anime/completed` : `${BASEURL}/anime/completed/${page}}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('div.row[itemscope] div.col-md-3.col-6.text-start.mb-4').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[3].split('-sub-indo')[0]
      list.push({
        slug,
        title: $(el).find('.marquee__line').text(),
        episode: $(el).find('p').text().replace(`Episode`, '').trim(),
        cover: $(el).find('img').attr('src')?.split('?')[0]
      })
    })

    let maxPage = $('ul.pagination')
      .first()
      .find('.page-item a')
      .filter(function () {
        let title = $(this).attr('title')
        return title && title.toLowerCase().indexOf('berikutnya') === -1
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
    const checkedAnimeId =
      animeId.includes('subt-indo') || animeId.includes('subtitle-indonesia')
        ? animeId
        : animeId + '-sub-indo'
    const url = `${BASEURL}/anime/view/${checkedAnimeId}`
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)

    const slug = animeId
    const cover = $('.container img[itemprop="thumbnail"]').attr('src')
    const banner = $('.page-header')
      .attr('style')
      .replace('background-image: url(', '')
      .replace('); height: 45vh; min-height: 300px; max-height: 560px;', '')
    const synopsis = $('p.card-body.mt-n4.overflow-auto.text-dark').text()
    const info = {}
    $('table.table.table-bordered.table-hover.text-dark tbody tr').each(function () {
      let key = $(this).find('th').text().toLowerCase().replace(' ', '_')
      let text = $(this).find('td').text()
      info[key] = text
    })
    const episodes = []
    $('.container .card-body.list-group.mt-n4.overflow-auto.mb-4[itemprop=url] a').each((i, el) => {
      let href = $(el).attr('href')
      let parts = href.split('/')
      if (parts[2] !== 'batch') {
        let episode = $(el)
          .attr('href')
          .match(/episode-(\d+)/i)[1]
        let string = parts[3]
        let episodeIndex = string.indexOf('-episode')
        let result = string.substring(0, episodeIndex)
        let stringSe = string.split('-')
        let subepisode = '-'
        if (episode != stringSe[stringSe.length - 3]) {
          subepisode = stringSe[stringSe.length - 3]
        }
        episodes.push({
          slug: result,
          episode,
          subepisode
        })
      }
    })

    const episode = {
      first: episodes[episodes.length - 1],
      last: episodes[0]
    }

    res.send({
      slug,
      cover,
      banner,
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
    const { slug, episode, subepisode } = req.query
    let newEpisode = episode
    if (subepisode) {
      newEpisode = newEpisode + '-' + subepisode
    }
    const url = BASEURL + `/anime/watch/${slug}-episode-${newEpisode}-sub-indo`
    options.url = url
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)

    const title = $('.card-title[itemprop=name]').text().replace('Subtitle Indonesia', '').trim()
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
              source: $(val).find('a').text(),
              src: $(val).find('a').attr('href')
            })
          })
        downloads.push({ type, sources })
      }
    )
    const episodes = []
    $('.container .card-body.overflow-auto.list-group.mt-n4.mb-4 a').each((i, el) => {
      let episode = $(el)
        .attr('href')
        .match(/-episode-(\d+)/i)[1]
      let href = $(el).attr('href')
      let split = href.split('-')
      let subEpisode = '-'
      if (split[split.length - 3] != episode) {
        subEpisode = split[split.length - 3]
      }
      // Mendapatkan nilai "loop7" dari atribut href
      var nilaiHref = $(el).attr('href')

      // Memperoleh bagian yang Anda inginkan (loop7) dari nilai href
      var nilaiLoop = nilaiHref.split('-')[0]

      episodes.push({
        slug: nilaiLoop,
        episode,
        subEpisode
      })
    })
    res.send({
      title,
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
