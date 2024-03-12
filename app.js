const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
// Routes
const fserver = require('./routes/fserver')
const sserver = require('./routes/sserver')
const tserver = require('./routes/tserver')
const mserver = require('./routes/mserver')

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())

app.use('/fserver', fserver)
app.use('/sserver', sserver)
app.use('/tserver', tserver)
app.use('/mserver', mserver)
app.get('/', (req, res) => {
  res.send('Selamat Datang!')
})

// Start Server
app.listen(process.env.PORT || 3000, function () {
  console.log('Express server listening on port %d', this.address().port)
})
