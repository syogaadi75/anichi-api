const express = require('express')
const axios = require('axios')
const router = express.Router()
const cheerio = require('cheerio')
var request = require('request')
const zlib = require('zlib')
const jsdom = require('jsdom')

const BASEURL = 'https://nontonanimeid.buzz'

const options = {
  method: 'POST',
  url: 'https://scrapeninja.p.rapidapi.com/scrape',
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': 'a476249425mshdde66e5d818c5fcp1d6f4ejsn9d3c8cf4948a',
    'X-RapidAPI-Host': 'scrapeninja.p.rapidapi.com'
  },
  data: {
    url: BASEURL
  }
}

router.get('/recent', async (req, res) => {
  try {
    const response = await axios.request(options)
    res.send(response.data)
  } catch (error) {
    console.error(error)
  }
})

module.exports = router
