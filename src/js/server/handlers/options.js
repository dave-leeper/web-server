const {log} = require('../utility/log');
const {doCORS} = require('../utility/do-cors')

module.exports = (entry) => {
    return async (req, res, next) => {
        log(entry)
        doCORS(req, res, entry)

        res.status(200).send()
        next && next()
    }
}
