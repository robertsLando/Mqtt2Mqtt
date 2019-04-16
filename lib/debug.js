var debug = require('debug')

debug.enable('mqtt2mqtt:*')
debug = debug('mqtt2mqtt')

debug.log = console.log.bind(console)

module.exports = function (namespace) { return debug.extend(namespace) }
