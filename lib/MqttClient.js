'use strict'

// eslint-disable-next-line one-var
var reqlib = require('app-root-path').require,
  mqtt = require('mqtt'),
  utils = reqlib('/lib/utils.js'),
  NeDBStore = require('mqtt-nedb-store'),
  EventEmitter = require('events'),
  storeDir = reqlib('config/app.js').storeDir,
  debug = reqlib('/lib/debug'),
  inherits = require('util').inherits,
  url = require('url')

const NAME_PREFIX = 'M2M-'

/**
 * The constructor
 */
function MqttClient (config) {
  if (!(this instanceof MqttClient)) {
    return new MqttClient(config)
  }
  EventEmitter.call(this)
  init.call(this, config)
}

inherits(MqttClient, EventEmitter)

function init (config) {
  this.config = config
  this.toSubscribe = []

  this.clientID = this.cleanName(NAME_PREFIX + config.name);

  this.debug = debug(this.clientID);

  var parsed = url.parse(config.host || '')
  var protocol = 'mqtt'

  if (parsed.protocol) protocol = parsed.protocol.replace(/:$/, '')

  var options = {
    clientId: this.clientID,
    reconnectPeriod: config.reconnectPeriod,
    clean: config.clean,
    rejectUnauthorized: !config.allowSelfsigned,
    protocol: protocol,
    host: parsed.hostname || config.host,
    port: config.port,
    // will: {
    //   topic: this.getClientTopic(),
    //   payload: JSON.stringify({value: false}),
    //   qos: 1,
    //   retain: true
    // }
  }

  if (['mqtts', 'wss', 'wxs', 'alis', 'tls'].indexOf(protocol) >= 0) {
    if (!config.allowSelfsigned) options.ca = config._ca
    options.key = config._key
    options.cert = config._cert
  }

  if (config.store) {
    const COMPACT = { autocompactionInterval: 30000 }
    var manager = NeDBStore(utils.joinPath(utils.getPath(true), storeDir, this.clientID), {incoming: COMPACT, outgoing: COMPACT})
    options.incomingStore = manager.incoming
    options.outgoingStore = manager.outgoing
  }

  if (config.auth) {
    options.username = config.username
    options.password = config.password
  }

  try {
    var client = mqtt.connect(options)

    this.client = client

    client.on('connect', onConnect.bind(this))
    client.on('message', onMessageReceived.bind(this))
    client.on('reconnect', onReconnect.bind(this))
    client.on('close', onClose.bind(this))
    client.on('error', onError.bind(this))
    client.on('offline', onOffline.bind(this))
  } catch (e) {
    this.debug('Error while connecting MQTT', e.message)
    this.error = e.message
  }
}

/**
 * Function called when MQTT client connects
 */
function onConnect () {
  this.debug('CONNECTED')
  this.emit('connect')

  if (this.toSubscribe) {
    for (var i = 0; i < this.toSubscribe.length; i++) {
      this.subscribe(this.toSubscribe[i])
    }
  }

  // Update client status
  // this.updateClientStatus(true)

  this.toSubscribe = []
}

/**
 * Function called when MQTT client reconnects
 */
function onReconnect () {
  this.debug('RECONNECTING')
}

/**
 * Function called when MQTT client reconnects
 */
function onError (error) {
  this.debug(error.message)
  this.error = error.message
}

/**
 * Function called when MQTT client go offline
 */
function onOffline () {
  this.debug('OFFLINE')
}

/**
 * Function called when MQTT client is closed
 */
function onClose () {
  this.debug('CLOSED')
}

/**
 * Function called when an MQTT message is received
 */
function onMessageReceived (topic, payload) {
  this.debug('Message received on', topic);

  payload = payload ? payload.toString() : payload;

  this.emit('writeRequest', topic, payload)
  
}// end onMessageReceived

MqttClient.prototype.cleanName = function (name) {
  if (!isNaN(name)) return name

  name = name.replace(/\s/g, '_')
  return name.replace(/[+*#\\.''``!?^=(),""%[\]:;{}]+/g, '')
}

/**
 * Method used to close clients connection, use this before destroy
 */
MqttClient.prototype.close = function (cb) {
  if (this.closed) {
    cb()
  }

  this.closed = true

  var self = this

  function done () {
    self.removeAllListeners()

    if (self.client) {
      self.client.removeAllListeners()
    }

    cb()
  }

  if (this.client) {
    this.client.end(!this.client.connected, {}, done)
  } else done()
}

/**
 * Method used to get status
 */
MqttClient.prototype.getStatus = function () {
  var status = {}

  status.status = this.client && this.client.connected
  status.error = this.error || 'Offline'
  status.config = this.config

  return status
}

/**
 * Method used to update client connection status
 */
// MqttClient.prototype.updateClientStatus = function (connected, ...devices) {
//   var topic = "test/test"
//   this.client.publish(topic, JSON.stringify({value: connected, time: Date.now()}), {retain: true, qos: 1})
// }

/**
 * Method used to update client
 */
MqttClient.prototype.update = function (config) {
  this.close()

  this.debug(`RESTARTING`)

  init.call(this, config)
}

/**
 * Method used to subscribe for write requests
 */
MqttClient.prototype.subscribe = function (topic) {
  if (this.client && this.client.connected) {
    this.client.subscribe(topic, (err) => err && this.debug("Error while subscribing: %s", err.message))
  } else { this.toSubscribe.push(topic) }
}

/**
 * Method used to publish an update
 */
MqttClient.prototype.publish = function (topic, data, options) {
  if (this.client) {
    this.client.publish(topic, data, options, function (err) {
      if (err) { this.debug('Error while publishing a value', err.message) }
    })
  } // end if client
}

/**
 * Used to get client connection status
 */
Object.defineProperty(MqttClient.prototype, 'connected', {
  get: function () {
    return this.client && this.client.connected
  },
  enumerable: true
})

/**
 * Used to get client ID
 */
Object.defineProperty(MqttClient.prototype, 'client_id', {
  get: function () {
    return this.clientID
  },
  enumerable: true
})


module.exports = MqttClient
