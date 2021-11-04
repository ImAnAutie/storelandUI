const express = require('express')
const app = express()

const path = require('path')

const publicPath = path.join(__dirname, 'public')
app.use(express.static(publicPath));

// keep me last, used to mimic the redirect all to /index.html of firebase hosting
app.get('/*', function (request, response, next) {
  console.log("App index router");
  response.sendFile(path.resolve(publicPath,'index.html'))
})

const port = process.env.PORT || 3000
const initApp = async () => {
  app.listen(port, () => {
    console.log(`storeland UI listening at http://0.0.0.0:${port}`)
  })
}

initApp()
