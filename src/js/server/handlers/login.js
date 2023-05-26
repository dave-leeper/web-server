const Registry = require(`../utility/registry`)
const {fileDBQuery} = require(`../database/file-db`)
const {jwtCreate} = require(`../utility/jwt-create`)
const {log} = require('../utility/log');
const {doCORS} = require('../utility/do-cors')

module.exports = (entry) => {
    return async (req, res, next) => {
        log(entry)
        doCORS(req, res, entry)

        const db = Registry.get(`FileDBConnection`)
        const name = req.body.name
        const password = req.body.password

        if (!db) {
            const err = `503 Service Unavailable`

            console.error(err + `: Database not available.`)
            res.status(503).send(err)
            next && next(err)
            return
        }
        if (!name || !password) {
            const err = `401 Unauthorized`

            console.error(err + `: User name or password not supplied by login request.`)
            res.status(401).send(err)
            next && next(err)
            return
        }

        const queryOptions = { tb: `user`}
        const queryResult = await fileDBQuery(null, null, queryOptions)
        const recordsFound = queryResult[0]?.result?.length

        if (!recordsFound) {
            const err = `401 Unauthorized`

            console.error(err + `: User name "${name}" not found in database.`)
            res.status(401).send(err)
            next && next(err)
            return
        }

        let userFound = false

        for (let user of queryResult[0]?.result) {
            if (user.userName === name) {
                userFound = true
                break
            }
        }
        if (!userFound) {
            const err = `401 Unauthorized`

            console.error(err + `: User name "${name}" not found in database.`)
            res.status(401).send(err)
            next && next(err)
            return
        }

        if (queryResult[0].result[0].password !== password) {
            const err = `401 Unauthorized`

            console.error(err + `: User "${name}" provided the wrong password.`)
            res.status(401).send(err)
            next && next(err)
            return
        }

        const jwtCreateResult = await jwtCreate(name)

        if (200 !== jwtCreateResult.status) {
            res.status(jwtCreateResult.status).send(jwtCreateResult.err)
            next && next(jwtCreateResult.err)
            return
        }

        res.status(200).send(JSON.stringify(jwtCreateResult.clientResponse))
        next && next()
    }
}
