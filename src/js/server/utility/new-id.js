const {fileDBSelect} = require(`../database/file-db`)

module.exports.getNewId = async (db, table) => {
    const queryResults = await fileDBSelect(db, table)
    let largestId = 0

    for (let result of queryResults) {
        const id = parseInt(result.id.split(`:`)[1])

        if (id > largestId) { largestId = id }
    }
    return largestId + 1
}
