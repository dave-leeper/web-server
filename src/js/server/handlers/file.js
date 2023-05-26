var path = require('path');
const {log} = require('../utility/log');
const {doCORS} = require('../utility/do-cors')

module.exports = (entry) => {
    return async (req, res, next) => {
        log(entry)
        doCORS(req, res, entry)

        const options = { root: path.join(`.`, '/src') }

        res.sendFile(`${entry.args.file}`, options, (err) => { if (err) { next && next(err) } else { next && next() } })
    }
}
