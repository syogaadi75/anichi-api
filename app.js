const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
// Routes 
const tserver = require('./routes/tserver') 

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
 
app.use('/tserver', tserver) 
app.get('/', (req, res) => {
  res.send('Selamat Datang!')
})

// Start Server
app.listen(process.env.PORT || 3000, function () {
  console.log('Express server listening on port %d', this.address().port)
})
