module.exports.doCORS = (req, res, entry) => {
    if (!entry?.path) { 
        console.log(`NO ENTRY PATH`)
        /*
        res?.setHeader('Access-Control-Allow-Origin', `*`)
        res?.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        res?.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')  
        */  
        return 
    }
    const origin = req.get('origin')
    let host = origin || req.get('host')
    
    console.log(`${JSON.stringify(entry)}`)
    host = host || `*`

    try {
        res.setHeader('Access-Control-Allow-Origin', host)
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    } catch (e) {
        console.log(`Error setting CORS header.`)
    }
}