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

router.get('/get-url', async (req, res) => {
  try { 
    const url = `https://samehadaku.today`; 

    res.send(url);
  } catch (error) { 

    res.status(500).send({ 
      message: error.message  
    });
  }
}); 

router.get('/home', async (req, res) => {
  try {
    let animes = [];
    options.url = req.query.url;

    // Menggunakan User-Agent saat ini
    options.headers['User-Agent'] = userAgents[userAgentIndex];

    const base = await axios.request(options);
    const $ = cheerio.load(base.data);
    
    $('.listupd.normal .excstf article').each((i, el) => {
      let slug = $(el).find('a').attr('href');
      animes.push({
        slug,
        title: $(el).find('.tt h2').text().trim(),
        episode: $(el).find('.bt .epx').text().trim(),
        cover: $(el).find('img').attr('data-lazy-src').replace('?resize=247,350', '')
      });
    }); 

    const popular = {
      weekly: [],
      monthly: [],
      alltime: []
    }
    $("#wpop-items .serieslist").each((i, el) => {
      let key = '';
      if(i === 0) {
        key = 'weekly';
      } else if(i === 1) {
        key = 'monthly';
      } else if(i === 2) {
        key = 'alltime';
      }

      $(el).find('ul li').each((j, val) => {
        popular[key].push({
          title: $(val).find(".leftseries h4 a").text().trim(),
          slug: $(val).find(".leftseries h4 a").attr('href'),
          cover: $(val).find(".imgseries img").attr('data-lazy-src').replace('?resize=65,85', ''),
          rating: $(val).find(".numscore").text().trim(),
          genres: $(val).find('.leftseries span a').map((i, el) => ({
                    text: $(el).text().trim(),
                    slug: $(el).attr('href')
                  })).get()
        }) 
      })
    });

    const navigation = {
      prev: {
        status: false,
        slug: ''
      },
      next: {
        status: false,
        slug: ''
      }
    }

    $(".listupd.normal .hpage a").each((i, el) => {
      if ($(el).text().includes('Previous')) {
        navigation.prev = {
          status: true,
          slug: $(el).attr('href')
        };
      } else if ($(el).text().includes('Next')) {
        navigation.next = {
          status: true,
          slug: $(el).attr('href')
        };
      }
    })

    const data = {
      animes,
      popular,
      navigation
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

router.get('/search', async (req, res) => {
  try {
    let animes = [];
    const url = req.query.url
    options.url = atob(url)

    // Menggunakan User-Agent saat ini
    options.headers['User-Agent'] = userAgents[userAgentIndex];

    const base = await axios.request(options);
    const $ = cheerio.load(base.data);
    
    $('.listupd article').each((i, el) => {
      let slug = $(el).find('a').attr('href'); 
      animes.push({
        slug,
        title: $(el).find('.tt h2').text().trim(),
        episode: $(el).find('.bt .epx').text().trim(),
        cover: $(el).find('.limit img').attr('src')?.replace('?resize=247,350', '')
      });
    });

    const pagination = {
      next: {
        status: false,
        slug: ''
      },
      prev: {
        status: false,
        slug: ''
      },
      list: []
    };
    $(".pagination .page-numbers").each((i, el) => {
      if($(el).text().includes('Sebelumnya')) {
        pagination.prev = {
          status: true,
          slug: $(el).attr('href')
        };
      } else if($(el).text().includes('Berikutnya')) {
        pagination.next = {
          status: true,
          slug: $(el).attr('href')
        };
      } else {
        if($(el).text() == '…') {} else {
          if($(el).attr('aria-current') == 'page') {
            pagination.list.push({
              slug: $(el).attr('href') || '',
              title: $(el).text(),
              current: true
            });
          } else {
            pagination.list.push({
              slug: $(el).attr('href') || '',
              title: $(el).text(),
              current: false
            });
          }
        }
      }
    })

    const popular = {
      weekly: [],
      monthly: [],
      alltime: []
    }
    $("#wpop-items .serieslist").each((i, el) => {
      let key = '';
      if(i === 0) {
        key = 'weekly';
      } else if(i === 1) {
        key = 'monthly';
      } else if(i === 2) {
        key = 'alltime';
      }

      $(el).find('ul li').each((j, val) => {
        popular[key].push({
          title: $(val).find(".leftseries h4 a").text().trim(),
          slug: $(val).find(".leftseries h4 a").attr('href'),
          cover: $(val).find(".imgseries img").attr('src')?.replace('?resize=65,85', ''),
          rating: $(val).find(".numscore").text().trim(),
          genres: $(val).find('.leftseries span a').map((i, el) => ({
                    text: $(el).text().trim(),
                    slug: $(el).attr('href')
                  })).get()
        }) 
      })
    });

    const data = {
      animes,
      pagination,
      popular
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

router.get('/detail', async (req, res) => {
  try { 
    options.url = req.query.url

    // Menggunakan User-Agent saat ini
    options.headers['User-Agent'] = userAgents[userAgentIndex];

    const base = await axios.request(options);
    const $ = cheerio.load(base.data); 

    const detail_anime = {}; 
    detail_anime.cover = $(".bigcontent .thumb img").attr('data-lazy-src').replace('?resize=247,350', '');
    detail_anime.title = $(".bigcontent .infox .entry-title").text().trim();
    detail_anime.information = $(".bigcontent .infox .ninfo .alter").text().trim();
    detail_anime.rating = $(".bigcontent .rating").text().trim();

    $(".bigcontent .infox .info-content span").each(function() {
      const key = $(this).find('b').text().replace(':', '').replace(' ','_').trim().toLowerCase();
      $(this).find('b').remove(); 
      let value = $(this).text().trim(); 

      if ($(this).find('a').length) {
        value = $(this).find('a').map((i, el) => $(el).text().trim()).get().join(', ');
      }
      
      if(key) {
        detail_anime[key] = value;
      }
    })

    const genre = []
    $(".bigcontent .genxed a").each(function() {
      genre.push({
        title: $(this).text().trim(),
        slug: $(this).attr('href')
      })
    })
    detail_anime.genre = genre;
    detail_anime.sinopsis = $(".bixbox.synp .entry-content").text().trim();

    const episodes = [] 

    $(".eplister ul li").each((i, el) => {
      episodes.push({
        slug: $(el).find('a').attr('href'),
        title: $(el).find('.epl-title').text().trim(),
        released_at: $(el).find('.epl-date').text().trim(),
      })
    })

    const popular = {
      weekly: [],
      monthly: [],
      alltime: []
    }
    $("#wpop-items .serieslist").each((i, el) => {
      let key = '';
      if(i === 0) {
        key = 'weekly';
      } else if(i === 1) {
        key = 'monthly';
      } else if(i === 2) {
        key = 'alltime';
      }

      $(el).find('ul li').each((j, val) => {
        popular[key].push({
          title: $(val).find(".leftseries h4 a").text().trim(),
          slug: $(val).find(".leftseries h4 a").attr('href'),
          cover: $(val).find(".imgseries img").attr('data-lazy-src').replace('?resize=65,85', ''),
          rating: $(val).find(".numscore").text().trim(),
          genres: $(val).find('.leftseries span a').map((i, el) => ({
                    text: $(el).text().trim(),
                    slug: $(el).attr('href')
                  })).get()
        }) 
      })
    });

    const data = { 
      detail_anime,
      episodes,
      popular
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

router.get('/video', async (req, res) => {
  try { 
    options.url = req.query.url

    // Menggunakan User-Agent saat ini
    options.headers['User-Agent'] = userAgents[userAgentIndex];

    const base = await axios.request(options);
    const $ = cheerio.load(base.data);

    const title = $(".item.meta .lm h1.entry-title").text().trim();
    const released_at = $(".item.meta .lm .year .updated").text().trim();
    
    let main_server = $("#embed_holder #pembed iframe").attr('data-lazy-src');
    let list_server = [];
    $(".item.video-nav .mobius select option").each((i, el) => {
      if($(el).attr('value') != '') { 
        let base64Value = $(el).attr('value'); 
        let decodedValue = atob(base64Value); 
        const regex = /src="([^"]+)"/;
        const match = decodedValue.match(regex);
        let iframeSrc = match ? match[1] : null;

        list_server.push({
          server: $(el).text().trim(),
          src: iframeSrc
        });
      }
    });

    let next = {
      status: false,
      slug: ''
    };
    let prev = {
      status: false,
      slug: ''
    };
    let detail_anime_slug = null;
    $(".mvelement .naveps.bignav .nvs").each((i, el) => {
      if(i === 0) { 
        if($(el).find('span.nolink').length > 0) {
          prev.status = false;
          prev.slug = '';
        } else {
          prev.status = true;
          prev.slug = $(el).find('a').attr('href');
        }
      } else if(i === 1) {
        detail_anime_slug = $(el).find('a').attr('href');
      } else if (i === 2) {
        if($(el).find('span.nolink').length > 0) {
          next.status = false;
          next.slug = '';
        } else {
          next.status = true;
          next.slug = $(el).find('a').attr('href');
        }
      }
    })

    const episodes = {
      head: {},
      list: [],
    };

    const text = $(".headlist .det span").text();
    const ongoingText = $(".headlist .det span i").text(); 
    const formattedText = text.replace(ongoingText + ' - ', ' - ').trim();


    episodes.head.cover = $(".headlist .thumb img").attr('data-lazy-src').replace('?resize=84,98', '');
    episodes.head.title = $(".headlist .det h2 a").text().trim();
    episodes.head.information = `${ongoingText} ${formattedText}`.replace(' - ?', ' 1');

    $(".episodelist ul li").each((i, el) => {
      episodes.list.push({
        slug: $(el).find('a').attr('href'),
        title: $(el).find('.playinfo h3').text().trim(),
        released_at: $(el).find('.playinfo span').text().trim(),
        cover: $(el).find('.thumbnel img').attr('data-lazy-src').replace('?resize=130,130', '')
      })
    });

    const downloads = [];
    $(".bixbox.mctn .soraddlx.soradlg").each((i, el) => {
      $(el).each((j, val) => {
        let download = {
          title: '',
          servers: []
        }
        if(j === 0) {
          download.title = $(val).find('h3').text().trim();
        }
        let links = [];
        $(val).find('a').each((k, value) => {
          links.push({
            name: $(value).text().trim(),
            src: $(value).attr('href')
          });
        });

        download.servers.push({
          resolution: $(val).find('strong').text().trim(),
          links
        })

        downloads.push(download);
      });
    }); 

    const detail_anime = {};
    detail_anime.slug = detail_anime_slug;
    detail_anime.cover = $(".single-info.bixbox .thumb img").attr('data-lazy-src').replace('?resize=247,350', '');
    detail_anime.title = $(".single-info.bixbox .infox .infolimit h2").text().trim();
    detail_anime.information = $(".single-info.bixbox .infox .infolimit span").text().trim();
    detail_anime.rating = $(".single-info.bixbox .infox .rating strong").text().trim();

    $(".single-info.bixbox .infox .info-content span").each(function() {
      const key = $(this).find('b').text().replace(':', '').trim().toLowerCase();
      $(this).find('b').remove(); 
      let value = $(this).text().trim(); 

      if ($(this).find('a').length) {
        value = $(this).find('a').map((i, el) => $(el).text().trim()).get().join(', ');
      }
      
      if(key) {
        detail_anime[key] = value;
      }
    })

    const genre = []
    $(".single-info.bixbox .genxed a").each(function() {
      genre.push({
        title: $(this).text().trim(),
        slug: $(this).attr('href')
      })
    })
    detail_anime.genre = genre;
    detail_anime.sinopsis = $(".single-info.bixbox .desc.mindes").text().trim();

    const popular = {
      weekly: [],
      monthly: [],
      alltime: []
    }
    $("#wpop-items .serieslist").each((i, el) => {
      let key = '';
      if(i === 0) {
        key = 'weekly';
      } else if(i === 1) {
        key = 'monthly';
      } else if(i === 2) {
        key = 'alltime';
      }

      $(el).find('ul li').each((j, val) => {
        popular[key].push({
          title: $(val).find(".leftseries h4 a").text().trim(),
          slug: $(val).find(".leftseries h4 a").attr('href'),
          cover: $(val).find(".imgseries img").attr('data-lazy-src').replace('?resize=65,85', ''),
          rating: $(val).find(".numscore").text().trim(),
          genres: $(val).find('.leftseries span a').map((i, el) => ({
                    text: $(el).text().trim(),
                    slug: $(el).attr('href')
                  })).get()
        }) 
      })
    });


    const data = {
      title,
      released_at,
      main_server,
      list_server,
      next,
      prev,
      episodes,
      downloads,
      detail_anime,
      popular
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
