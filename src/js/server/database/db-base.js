class DBBase {
    registry = []

    constructor(options) { this.options = options }

    register(name, object) {
        this.registry.unshift({object: object, name: name})
    }

    unregister(name) {
        for (let loop = 0; loop < this.registry.length; loop++) {
            if (this.registry[loop].name === name) {
                let object = this.registry[loop].object
                this.registry.splice(loop, 1)
                return object
            }
        }
        return null
    }

    unregisterAll() { this.registry = [] }

    isRegistered(name) {
        for (let loop = 0; loop < this.registry.length; loop++) {
            if (this.registry[loop].name === name) return true
        }
        return false
    }

    getEntry(name) {
        for (let loop = 0; loop < this.registry.length; loop++) {
            if (this.registry[loop].name === name) return this.registry[loop].object
        }
        return null
    }
}

module.exports = DBBase