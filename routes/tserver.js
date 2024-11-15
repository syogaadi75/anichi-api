const express = require('express')
const axios = require('axios')
const router = express.Router()
const BASEURL = 'https://otakudesu.cloud' 
const cheerio = require('cheerio') 
const chromium = require('@sparticuz/chromium-min')
const puppeteer = require('puppeteer-core'); 
const path = require('path')

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
} 

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

router.get('/recent', async (req, res) => {
  try {
    let ongoing = []
    let completed = []
    options.url = `${BASEURL}`
    const base = await axios.request(options)
    userAgentIndex = (userAgentIndex + 1) % userAgents.length;
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
    userAgentIndex = (userAgentIndex + 1) % userAgents.length;
    res.send({
      index: userAgentIndex,
      agent: userAgents[userAgentIndex],
      message: error
    })
  }
})
router.post('/search', async (req, res) => {
  try {
    let { anime } = req.body
    let list = []
    options.url = `${BASEURL}?s=${anime}&post_type=anime`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
    $('.venutama .page ul li').each((i, el) => {
      let slug = $(el).find('a').attr('href')?.split('/')[4]
      let genres = []
      let status = ''
      let rating = ''

      $(el)
        .find('.set')
        .each((j, val) => {
          if (j === 0) {
            $(val)
              .find('a')
              .each((k, aEl) => {
                let slug = $(aEl).attr('href').split('/')[4]
                let text = $(aEl).text().trim()
                genres.push({
                  slug,
                  text
                })
              })
          } else if (j === 1) {
            status = $(val).text().replace('Status :', '').trim()
          } else if (j === 2) {
            rating = $(val).text().replace('Rating :', '').trim()
              ? $(val).text().replace('Rating :', '').trim()
              : '-'
          }
        })

      list.push({
        slug,
        title: $(el).find('h2').text().trim(),
        cover: $(el).find('img').attr('src'),
        genres,
        status,
        rating
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
        synopsis.push($(el).text().trim())
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
    options.url = `http://api.scraperapi.com?api_key=1250566f96fa702f7ee1024bfddfe318&url=https://otakudesu.cloud/episode/${animeId}`
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

    let prev = { status: false, slug: '' }
    let next = { status: false, slug: '' }
    $('.venutama .prevnext .flir a').each((i, el) => {
      let text = $(el).attr('title')
      if (text == 'Episode Sebelumnya') {
        let href = $(el).attr('href').split('/')
        let slug = href[4]
        prev = {
          status: true,
          slug
        }
      }
      if (text == 'Episode Selanjutnya') {
        let href = $(el).attr('href').split('/')
        let slug = href[4]
        next = {
          status: true,
          slug
        }
      }
    })
    const navigation = {
      prev,
      next
    }

    res.send({
      title,
      defaultPlayer: defaultPlayer ? defaultPlayer : '-',
      servers,
      episodes,
      navigation,
      downloads
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
}) 
router.get('/v2/get-video/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params;
    const url = `${BASEURL}/episode/${animeId}`;

    const browser = await getBrowser()
    const page = await browser.newPage() 
    await page.setUserAgent(userAgents[userAgentIndex]);
    await page.setCookie(
      {
        name: '_ga',
        value: 'GA1.2.838410536.1728188563',
        domain: 'otakudesu.cloud'
      },
      {
        name: '_gid',
        value: 'GA1.2.722950121.1728188563',
        domain: 'otakudesu.cloud'
      },
      {
        name: 'cf_clearance',
        value: '7RKTHJCSHDPx8abVDgKNepfkGgZoX6A761gemroMW_g-1728193170-1.2.1.1-H4ZvvqarA4rAvM0XbyKB_ZolGnG99NX9wyVxY_7jPwJYlYfUiMRelRgwDaaUogP62eIkPArzJ4AX0Fj_FmEJXx43TSuVUe84VlhOdYUgyQjAgCm3_FTTrc9sTMDN6jD5aHNlSXPRcU_DdF65uu4p4zFwFmbRpVWC4GT_aF3EfKFPQeMaiocKnTiq.gudbyq1VlJOTNAar6OTqz8wyXjDchUpYBECYU3qCn_adFWj.yDUiErlvAijQuopy6i09tGxG1WyPkaI.XqweKRy_CHO7ISq7Lony.7xey1wbk_64CbpLtPCKjV2L8sIXEqYmtYLGDVnI3q6CU46X2wkpRkfH9JgETgAgwZ2JqAh2YeF9TjsYlpYtfHATOMGUeoaVal0elykxJUhmsq8I1ZV.cfd2anD8wvFkMTz8GU31dR4M1rG_HwZcfHyvAgXf3Sd9AVh',
        domain: 'otakudesu.cloud'
      },
      {
        name: '_gat',
        value: '1',
        domain: 'otakudesu.cloud'
      },
      {
        name: '_ga_025LZFQCB2',
        value: 'GS1.2.1728193177.2.0.1728193177.0.0.0',
        domain: 'otakudesu.cloud'
      }
    );

    await page.goto(url, { waitUntil: 'networkidle2' }) 
    page.on('console', async e => {
      const args = await Promise.all(e.args().map(a => a.jsonValue()));
      console.log(...args);
    });

    const body = await page.evaluate(() => document.body.innerHTML);
    res.send(body);
    const data = await page.evaluate(() => {
      const title = document.querySelector('.venutama h1.posttl')?.textContent.trim(); 

      let iframe = document.querySelector('#pembed iframe');
      const defaultPlayer = iframe ? iframe.src : '-';

      // Mendapatkan server streaming
      
      const serverElements = document.querySelectorAll('#embed_holder .mirrorstream ul');
      const servers =  Array.from(serverElements).map((el) => {
        let resolution = el.className;
        let resolutionServer = [];
        el.querySelectorAll('li').forEach((li) => {
          let data = li.querySelector('a').getAttribute('data-content');
          let text = li.querySelector('a')?.textContent.trim();
          resolutionServer.push({ text, data });
        });
        return { resolution, server: resolutionServer };
      }); 

      // Mendapatkan link download
      
      const downloadElements = document.querySelectorAll('.venutama .download ul li');
      const downloads = Array.from(downloadElements).map((li) => {
        let resolution = li.querySelector('strong')?.textContent.trim();
        let server = [];
        li.querySelectorAll('a').forEach((a) => {
          let text = a?.textContent.trim();
          let src = a.href;
          server.push({ text, src });
        });
        return { resolution, server };
      }); 

      // Mendapatkan episode yang direkomendasikan
      
      const episodeElements = document.querySelectorAll('.judul-recommend-anime-series .keyingpost li a');
      const episodes = Array.from(episodeElements).map((a) => {
        let href = a.href.split('/');
        let slug = href[4];
        let text = a?.textContent.trim();
        return { slug, text };
      }); 

      // Mendapatkan navigasi prev/next
      
      let prev = { status: false, slug: '' };
      let next = { status: false, slug: '' };

      document.querySelectorAll('.venutama .prevnext .flir a').forEach((el) => {
        let text = el.getAttribute('title');
        let href = el.href.split('/');
        let slug = href[4];

        if (text === 'Episode Sebelumnya') {
          prev = { status: true, slug };
        }
        if (text === 'Episode Selanjutnya') {
          next = { status: true, slug };
        }
      });

      const navigation = { prev, next }; 

      return {
        title,
        defaultPlayer: defaultPlayer ? defaultPlayer : '-',
        servers,
        episodes,
        navigation,
        downloads
      }
    }) 

    await browser.close()
    res.send(data);
    
  } catch (error) {
    console.error(error)
    res.status(500).send('Something went wrong')
  }
});
router.get('/changeServer/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params
    let url = BASEURL + `wp-admin/admin-ajax.php`
    const headers = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    }
    const getNonce = await axios.post(url, { action: 'aa1208d27f29ca340c92c66d1926f13f' }, headers)
    const nonce = getNonce.data.data
    const bdy = JSON.parse(atob(serverId))
    const by = {
      ...bdy,
      nonce,
      action: '2a3505c93b0035d3f455df82bf976b84'
    }
    const resp = await axios.post(url, by, headers)
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
router.get('/slug-last-eps/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params
    options.url = `${BASEURL}/anime/${animeId}`
    const base = await axios.request(options)
    const $ = cheerio.load(base.data)
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
      episodes,
      episode
    })
  } catch (error) {
    res.send({
      message: error
    })
  }
})

router.get('/test', (req, res) => { 
  fetch('http://localhost:3000/cf-clearance-scraper', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        url: 'https://otakudesu.cloud/episode/wpoiec-episode-1121-sub-indo/',
        mode: "source" 
    })
})
    .then(res => res.json())
    .then(json => {
      // const $ = cheerio.load(json.source) 

      // const title = $('.venutama h1.posttl').text().trim()
      // console.log(title, 'title')
      res.send(json)
    })
    .catch(console.log);
})

module.exports = router
