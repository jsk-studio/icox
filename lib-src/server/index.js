const fs = require('fs')
const qs = require('qs')
const path = require('path')

const basePath = path.join(__dirname, '../configured-pages')

async function onPutAll(req, resp) {
    const filepath = path.join(basePath, 'home-list-min.js')
    let post = '';     
    req.on('data', function(chunk){    
        post += chunk;
    });
    req.on('end', function(){
        const json = JSON.parse(post)
        const text = 'export default ' + JSON.stringify(json, null, 4)
            .replace(/\"(\w+)\":/g, key => key.replace(/\"/g, ''))
            .replace(/"@fun\[(.+)\]@"/g, key => key.replace(/"@fun\[|\]@"/g, ''))
        fs.writeFileSync(filepath, text, { encoding: 'utf-8' })
        resp.end()
    });
}
module.exports = function(app) {
    app.post('/dev/editor', onPutAll)
}
onPutAll()
