const {fileDBSelect} = require(`../database/file-db`)
const Registry = require(`../utility/registry`)
const {log} = require('../utility/log');
const {doCORS} = require('../utility/do-cors')

module.exports = (entry) => {
    return async (req, res, next) => {
        log(entry)
        doCORS(req, res, entry)

        const db = Registry.get(`FileDBConnection`)
        
        if (!db) {
            const err = `503 Service Unavailable`
            console.error(err + `: Surreal DB`)
            res.status(503).send(err)
            next && next(err)
            return
        }
        if (!entry?.args?.table) {
            const err = `503 Service Unavailable`
            console.error(err + `: Missing entry.args.table.`)
            res.status(503).send(err)
            next && next(err)
            return
        }

        const result = await fileDBSelect(db, entry.args.table)
        res.send(JSON.stringify(result))
        next && next()
    }
}