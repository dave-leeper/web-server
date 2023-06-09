const fs = require('fs')
const cors = require('cors')

module.exports = function () {
  this.readHandlers = function (handlerFile) { 
    try {
      const data = fs.readFileSync(handlerFile, 'utf8')
      return JSON.parse(data)
    } catch (err) {
      console.error(err);
      throw err
    }
  }
  this.buildHandlers = function (handlerData, app) { 
    const build = (handlerConfigArray, app) => {
      for (let entry of handlerConfigArray) {
        console.log(JSON.stringify(entry))
        const handlerBuilder = require(`./handlers/${entry.handler}`)
        const handler = handlerBuilder(entry)

        if (`GET` === entry.verb.toUpperCase()) { app.get(entry.path, handler) }
        else if (`POST` === entry.verb.toUpperCase()) { app.post(entry.path, handler) }
        else if (`PUT` === entry.verb.toUpperCase()) { app.put(entry.path, handler) }
        else if (`PATCH` === entry.verb.toUpperCase()) { app.patch(entry.path, handler) }
        else if (`DELETE` === entry.verb.toUpperCase()) { app.delete(entry.path, handler) }
        else if (`OPTIONS` === entry.verb.toUpperCase()) { app.options(entry.path, handler) }
        if (`OPTIONS` !== entry.verb.toUpperCase()) { 
          const optionBuilder = require(`./handlers/options.js`)
          const optionsEntry = {
            "name": "OPTION",
            "verb": "OPTION",
            "handler": "options.js",
            "log": "INFO"
          }
          const optionHandler = optionBuilder(optionsEntry)  
          app.options(entry.path, optionHandler) 
        }
      }
    }

    build(handlerData.textResponse, app)
    build(handlerData.fileLoaders, app)
    build(handlerData.database, app)
    build(handlerData.function, app)
  }
}