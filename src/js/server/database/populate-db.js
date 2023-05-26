module.exports = {
  populateDatabase: async function() {
    const Registry = require(`../utility/registry`)

    let db = Registry.get(`FileDBConnection`)
    
    if (!db) {
      console.error(`No FileDB connection found in registry.`)
      return
    }
    await populateUser(db)
  }
}

const getRecordCount = async (db, table) => {
  const data = await await db.readAll( table )

  return data.length
}

const getTableData = async (db, table) => {
  const data = await await db.readAll( table )

  return data
}

const isTablePopulated = async (db, table) => {
  const count = await getRecordCount(db, table)

  return 0 < count
}

const printRecordCountAndData = async (db, table) => {
  const count = await getRecordCount(db, table)
  const data = await getTableData(db, table)
  const output = {
    table,
    count,
    data
  }

  console.log(JSON.stringify(output))
}

const populateUser = async (db) => {
  const table = `user`
  try {
    const populated = await isTablePopulated(db, table)

    if (populated) {
      await printRecordCountAndData(db, table)
      return 
    }
    await db.removeById(table)
    await db.create(`${table}:0`, {
      userName: `Admin`,
      name: {
        first: `Admin`,
        last: `Admin`
      },
      title: `Admin`,
      password: `Admin`,
      roles: [`Admin`],
    })
    await printRecordCountAndData(db, table)
  } catch (e) {
    console.error(`Error populating ${table} table.`, e);
  }
}

