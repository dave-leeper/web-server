const DBBase = require(`./db-base`)
const fs = require('fs')

class FileDB extends DBBase {
	constructor(options) { super(options) }
	buildFullTableName(tablename) { return `${this.user}.database.${this.pathToDB}.${tablename}` }
	buildFullTablePath(tablename) { return `${this.pathToDB}/${tablename}` }
	async lock(lockfile) {
		const timeout = this.opions?.timeout ?? 1000

		if (fs.existsSync(lockfile)) { await this.sleep(timeout) }
		if (fs.existsSync(lockfile)) { throw new Error(`Database write operation timed out.`) }
		fs.writeFileSync(lockfile, `.`)
	}
	async unlock(lockfile) {
		if (!fs.existsSync(lockfile)) { throw new Error(`Lock file not found.`) }
		fs.unlinkSync(lockfile)
	}
	async writeTableToFile(fullTablePath, table) {
		const lockfile = `${fullTablePath}.lock`

		try {
			await this.lock(lockfile)
			fs.writeFileSync(fullTablePath, JSON.stringify(table))
			await this.unlock(lockfile)
		} catch(err) {
			console.error(`Error writing to database table ${fullTablePath} Error: ${err}`)
			if (fs.existsSync(lockfile)) { await this.unlock(lockfile) }
			throw new Error(err)
		}
	}
	async readTableFromFile(fullTablePath) {
		const lockfile = `${fullTablePath}.lock`

		try {
			await this.lock(lockfile)
			const text = fs.readFileSync(fullTablePath, 'utf8')
			await this.unlock(lockfile)

			return text
		} catch(err) {
			console.error(`Error reading from database table ${fullTablePath} Error: ${err}`)
			if (fs.existsSync(lockfile)) { await this.unlock(lockfile) }
			throw new Error(err)
		}
	}
	// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
	sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
	async connect(pathToDB, user, pass) {
		try {
			this.pathToDB = pathToDB
			this.user = user
			const files = await fs.promises.readdir(pathToDB)

			files.forEach(async (filename) => {
				if (filename.startsWith(`.`)) { return }
				const fullTableName = this.buildFullTableName(filename)
				const fullTablePath = this.buildFullTablePath(filename)
				const text = await this.readTableFromFile(fullTablePath)

				this.register(fullTableName, JSON.parse(text))
			})
		} catch (e) {
			console.error(`Error connecting to database. ${JSON.stringify(e)}`)
		}
	}
	async disconnect() {
		try {
			const files = await fs.promises.readdir(this.pathToDB)

			this.pathToDB = undefined
			files.forEach((filename) => {
				this.unregister(this.buildFullTableName(filename))
			})
		} catch (e) {
			console.error(`Error disconnecting from database. ${JSON.stringify(e)}`)
		}
	}
	async readAll(table) {
		const fullTableName = this.buildFullTableName(table)
		const data = this.getEntry(fullTableName)

		if (!data) { return [] }
		return data
	}
	async selectById(thing) {
		if (-1 === thing.indexOf(`:`)) { return this.readAll(thing) }

		const filename = thing.split(`:`)[0]
		const fullTableName = this.buildFullTableName(filename)
		const table = this.getEntry(fullTableName)

		for (let loop = 0; loop < table.length; loop++) {
			const row = table[loop]

			if (row.id !== thing) { continue }
			return row
		}
		return null
	}
	async create(thing, data) {
		const filename = thing.split(`:`)[0]
		const fullTableName = this.buildFullTableName(filename)
		const fullTablePath = this.buildFullTablePath(filename)
		let table = this.getEntry(fullTableName)
		const dataWithId = { ...data, id: thing }

		if (!table) { table = [] }
		for (let loop = 0; loop < table.length; loop++) {
			const row = table[loop]

			if (row.id !== thing) { continue }
			return false
		}
		table.push(dataWithId)
		this.register(fullTableName, table)
		this.writeTableToFile(fullTablePath, table)
		return dataWithId
	}
	updateById(thing, data) {
		const filename = thing.split(`:`)[0]
		const fullTableName = this.buildFullTableName(filename)
		const fullTablePath = this.buildFullTablePath(filename)
		const table = this.getEntry(fullTableName)
		const dataWithId = { ...data, id: thing }

		if (!table) { return false }
		for (let loop = 0; loop < table.length; loop++) {
			const row = table[loop]

			if (row.id !== thing) { continue }
			table[loop] = { ...row, ...dataWithId }
			this.register(fullTableName, table)
			this.writeTableToFile(fullTablePath, table)
			return true
		}
		return false
	}
	removeById(thing) { 
		if (-1 === thing.indexOf(`:`)) {
			const table = []
			const fullTableName = this.buildFullTableName(thing)
			const fullTablePath = this.buildFullTablePath(thing)
	
			this.register(fullTableName, table)
			this.writeTableToFile(fullTablePath, table)
			return table
		}

		const filename = thing.split(`:`)[0]
		const fullTableName = this.buildFullTableName(filename)
		const fullTablePath = this.buildFullTablePath(filename)
		const table = this.getEntry(fullTableName)

		if (!table) { return false }
		for (let loop = 0; loop < table.length; loop++) {
			const row = table[loop]

			if (row.id !== thing) { continue }
			table.splice(loop, 1)
			this.register(fullTableName, table)
			this.writeTableToFile(fullTablePath, table)
			return true
		}
		return false
	}
}

module.exports = FileDB
