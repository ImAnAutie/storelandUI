const express = require('express')
const app = express()

const path = require('path')

const publicPath = path.join(__dirname, 'public')
app.use(express.static(publicPath));

const port = process.env.PORT || 3000
const initApp = async () => {
  app.listen(port, () => {
    console.log(`storeland UI listening at http://0.0.0.0:${port}`)
  })
}

initApp()
