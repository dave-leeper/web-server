const Registry = require(`./registry`)
const {fileDBQuery: fileDBQuery} = require(`../database/file-db`)

module.exports.jwtCreate = async (name) => {
    const db = Registry.get(`FileDBConnection`)
    const jwt = Registry.get(`JWT`)

    if (!db) {
        const err = `503 Service Unavailable`

        console.error(err + `: Database not available.`)
        return { status: 503, err }
    }
    if (!jwt) {
        const err = `503 Service Unavailable`

        console.error(err + `: Javascript Web Token service not available.`)
        return { status: 503, err }
    }
    if (!process.env.JWT_SECRET_KEY) {
        const err = `503 Service Unavailable`

        console.error(err + `: Javascript Web Token key not available.`)
        return { status: 503, err }
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

    const jwtSecretKey = process.env.JWT_SECRET_KEY
    const claims = { iss: `vdy`, roles: queryResult[0].result[0].roles }
    const token = jwt.sign(claims, jwtSecretKey)
    const roles = queryResult[0].result[0].roles
    const image = queryResult[0].result[0].image? queryResult[0].result[0].image : `generic-avatar`
    const registryEntry = { expires: new Date().addHours(1), name, roles, image }
    const clientResponse = { token, roles, image, name: queryResult[0].result[0].name, title: queryResult[0].result[0].title }

    Registry.register(token, registryEntry)
    return { status: 200, clientResponse }
}
