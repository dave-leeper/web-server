// node server.js
// flyctl apps restart vdytesting
// flyctl launch
// flyctl deploy
//
// flyctl ips list -a vdytesting
// * Add A and AAAA records for site at DNS provider
// flyctl certs create -a vdytesting vincedrivesyou.com
// flyctl certs show -a vdytesting
// * Connect to https://vincedrivesyou.com
const express = require("express")
const HandlerManager = require('./src/js/server/load-handlers')
const FileDB = require(`./src/js/server/database/file-db`)
const {populateDatabase} = require('./src/js/server/database/populate-db')
const Registry = require(`./src/js/server/utility/registry`)
const bodyParser = require('body-parser')
const dotenv = require(`dotenv`)
const jwt = require(`jsonwebtoken`)
const https = require("https")
var http = require('http')
const fs = require("fs")
const options = {
  key: fs.readFileSync("./ssl/generated-private-key.txt"),
  cert: fs.readFileSync("./ssl/839fc97adad4f2c2.crt"),
  ca: [fs.readFileSync("./ssl/gd_bundle-g2-g1.crt")]
}


const initializeServer = async () => {
    const app = express();
    const handlerManager = new HandlerManager()
    const data = handlerManager.readHandlers(`./config/handlers.json`)

    dotenv.config()
    app.use(express.static(__dirname + '/src'));
    app.use(bodyParser.json())
    app.use(function(request, response, next) {
        if (process.env.NODE_ENV != 'DEV' && !request.secure) {
            // request was via http, so redirect to https
            let url = (`/` === request.url)? `/index.html` : request.url

            console.log(`Redirecting http request ${url} to https.`)
            response.redirect('https://' + request.headers.host + request.url)
        }
        next()
    })
    app.enable('trust proxy')
    Date.prototype.addHours = function(numberOfHours){
        this.setHours(this.getHours() + numberOfHours);
        return this;
    }
    Date.prototype.subtractHours = function(numberOfHours){
        this.setHours(this.getHours() - numberOfHours);
        return this;
    }
    Registry.register(`JWT`, jwt)

    // Load config
    handlerManager.buildHandlers(data, app)

    const db = new FileDB()

    await db.connect(`./database`, `root`, `root`)
    Registry.register(`FileDBConnection`, db)
    await populateDatabase(db)

    // Start server
    const httpsPort = process.env.HTTPS_PORT || `443`
    const httpPort = process.env.HTTP_PORT || `80`
    const logLevel = process.env.LOG_LEVEL.toUpperCase()
    const emailService = process.env.EMAIL_SERVICE
    const emailUser = process.env.EMAIL_USER
    const nodeEnv = process.env.NODE_ENV
    
    console.log(`HTTPS Port: ${httpsPort}`)
    console.log(`HTTP Port: ${httpPort}`)
    console.log(`Log Level: ${logLevel}`)
    console.log(`Email Service: ${emailService}`)
    console.log(`Email User: ${emailUser}`)
    console.log(`Node Env: ${nodeEnv}`)

    http.createServer(app).listen(httpPort, () => console.log(`App listening on HTTP port ${httpPort}.`))
    https.createServer(options, app).listen(httpsPort, () => console.log(`App listening on HTTPS port ${httpsPort}.`))

}

initializeServer()


