const path = require('path');
const os = require('os');
console.log('DB file path is:', path.resolve(__dirname, `../build/${os.type()}/${os.arch()}/node_sqlite3.node`))
module.exports = require('./bindings')(`${os.type()}/${os.arch()}/node_sqlite3.node`);
