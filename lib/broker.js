var reqlib = require('app-root-path').require
var config = reqlib('config/app.js')
var aedes = require('aedes')()
var jsonStore = reqlib('/lib/jsonStore.js')
var store = reqlib('config/store.js')
var debug = reqlib('/lib/debug')('Broker')
var MqttClient = reqlib('/lib/MqttClient')
var mqttWildcard = require('mqtt-wildcard')
const Promise = require('bluebird')

const VALID_DAYS = 9999;

const createCertificate = Promise.promisify(require("pem").createCertificate, {
  multiArgs: true
})

var settings = {};
var config = {};

var server, wsServer;

var brokerError = "Not connected"
var wsError = "Not connected";

var maps = {};
var maps_keys = [];
var clients = [];
var topicsGet = {};

aedes.authenticate = function (client, username, password, callback) {
  if (password) password = password.toString();

  var success = !config.authenticate || (username === config.username && password === config.password);
  callback(null, success);
}

// client connected
aedes.on('client', (client) => {
  debug("Client CONNECTED:", client.id)

  if(config.clientsStatus) {
    aedes.publish({
      topic: config.statusTopic.replace(/\$ID/g, client.id),
      qos: config.statusQos || 0,
      retain: config.statusRetain,
      payload: 'true'
    })
  }
});

// client disconnected
aedes.on('clientDisconnect', (client) => {
  debug("Client DISCONNECTED:", client.id)

  if(config.clientsStatus) {
    aedes.publish({
      topic: config.statusTopic.replace(/\$ID/g, client.id),
      qos: config.statusQos || 0,
      retain: config.statusRetain,
      payload: 'false'
    })
  }
});

// client subscribed to topic
aedes.on('subscribe', (subscriptions, client) => {
  debug("Client %s SUBSCRIED to %s:", client.id, subscriptions[0].topic)
});

// client unsubscribed to topic
aedes.on('unsubscribe', (subscriptions, client) => {  
  debug("Client %s UNSUBSCRIBED to %s:", client.id, ...subscriptions)
});

// a client has publish a packet
aedes.on('publish', (packet, client) => {

  var topic = packet.topic;

  if (topic.startsWith('$SYS')) return; // System message

  // When client is null the client is the broker itself
  if (!client) client = {
    id: "$BROKER"
  }

  var payload = packet.payload ? packet.payload.toString() : payload;

  debug("Client %s PUBLISH on %s: %s", client.id, packet.topic, packet.payload);

  if (topicsGet[topic]) {
    mapPacketValue(topic, payload, topicsGet[topic])
  } else {
    var toSend = [];

    // Check if there is a valid map for the incoming message topic
    for (let i = 0, len = maps_keys.length; i < len; i++) {
      if (mqttWildcard(topic, maps_keys[i])) {
        toSend.push(maps[maps_keys[i]]);
      }
    }

    // Foreach valid map forward the message to the destination client with custom map rules
    toSend.forEach(map => {
      mapPacket(topic, payload, map)
    });

  }

});


/**
 * Inits the Broker
 *
 */
async function init() {

  try {

    // get a deep copy of settings
    settings = JSON.parse(JSON.stringify(jsonStore.get(store.settings)));

    config = settings.broker || {};

    if (!config.port) config.port = 1884;

    if (config.ssl) {
      var now = new Date();

      if (config.autoGenerate) {
        var certs = jsonStore.get(store.certs);
        var expired = certs.expireDate ? (new Date(certs.expireDate)).getTime() < now.getTime() : true;

        if (expired || !certs.key || !certs.cert) {
          var keys = await createCertificate({
            days: VALID_DAYS,
            selfSigned: true
          });

          config._key = certs.key = keys[0].serviceKey
          config._cert = certs.cert = keys[0].certificate
          now.setDate(now.getDate() + VALID_DAYS);

          certs.expireDate = now;

          await jsonStore.put(store.certs, certs);
        } else {
          config._key = certs.key;
          config._cert = certs.cert;
        }
      }

      var options = {
        key: config._key,
        cert: config._cert,
        rejectUnauthorized: !config.selfSigned
      }

      server = require('tls').createServer(options, aedes.handle)

    } else {

      server = require('net').createServer(aedes.handle)
    }

    server.on('error', (err) => {
      debug(err.message);
      brokerError = err.code == "EADDRINUSE" ? "Port " + config.port + " is already used" : err.message
    })

    server.listen(config.port, function () {
      debug('Listening on port', config.port)
    });

    if (config.websocket) {
      var ws = require('websocket-stream');

      if (config.ssl) {
        wsServer = require('https').createServer({
          key: config._key,
          cert: config._cert,
          //requestCert: true, // client send their certificate
          rejectUnauthorized: !config.selfSigned
        });
      } else {
        wsServer = require('http').createServer();
      }

      ws.createServer({
        server: wsServer
      }, aedes.handle).on('error', (err) => {
        debug(err.message)
        wsError = err.code == "EADDRINUSE" ? "Port " + config.webPort + " is already used" : err.message
      })

      wsServer.listen(config.webPort, "0.0.0.0", function () {
        debug('MQTT websocket server listening on port', config.webPort)
      });

    }

    maps = {};
    maps_keys = [];
    clients = [];
    topicsGet = {};

    // init mqtt clients
    settings.clients.forEach(c => {
      initClient(c)
    });

    config.error = null;

  } catch (error) {
    config.error = error;
  }
}


/**
 * Inits an Mqtt Client with given client configuration
 *
 * @param {Object} c Client configuration Object
 */
function initClient(c) {
  var client = new MqttClient(c);

  clients.push(client);

  var mapsGet = c.mapsGet.map(id => settings.maps.find(c => c._id == id));
  var mapsSet = c.mapsSet.map(id => settings.maps.find(c => c._id == id));

  // remove null values from array
  mapsSet = mapsSet.filter(e => !!e)
  mapsGet = mapsGet.filter(e => !!e)

  mapsGet.forEach(m => {
    m.client = client;
    maps[m.wFrom] = m
    maps_keys.push(m.wFrom);
  });

  // subscribe for write requests
  mapsSet.forEach(m => {
    client.subscribe(m.wFrom);
  });

  // subscribe to client values
  var values = settings.values ? settings.values.filter(v => v.client_id === c._id && v.mode === "SET") : [];
  var topicsSet = [];

  values.forEach(v => {
    v.map = settings.maps.find(m => m._id == v.map_id);
    if (v.map) { // if there is a valid map subscribe for updates
      client.subscribe(v.from);
      topicsSet[v.from] = v;
    }
  });

  // Popolate topicsGet object for broker incoming messages
  values = settings.values ? settings.values.filter(v => v.client_id === c._id && v.mode === "GET") : [];

  values.forEach(v => {
    v.map = settings.maps.find(m => m._id == v.map_id);
    v.client = client;
    if (v.map) { // if there is a valid map add topic to the topicsGet object
      topicsGet[v.from] = v;
    }
  });

  // used to suppress duplicated messages when using both values and client maps and a map
  // is a wildecard of a topic value (so 2 messages are received one for ecah subscription)
  var ignoreNext = false;

  // handle write requests
  client.on("writeRequest", function (topic, payload) {

    if (ignoreNext) {
      ignoreNext = false;
      return;
    }

    // there is a value for this topic
    if (topicsSet[topic]) {

      if (mapsSet.find(m => mqttWildcard(topic, m.wFrom)))
        ignoreNext = true;

      mapPacketValue(topic, payload, topicsSet[topic])

    } else { // check for maps
      // get the first map wildecard corresponding to the topic
      var map = mapsSet.find(m => mqttWildcard(topic, m.wFrom));

      if (map) {
        mapPacket(topic, payload, map)
      }
    }
  });
}


/**
 * Maps an MQTT packet using a Value Configuration
 *
 * @param {String} topic Topic of the received message
 * @param {String} payload Payload received
 * @param {Object} val Value Configuration Object
 */
function mapPacketValue(topic, payload, val) {
  // set the custom topic  
  if (val.customTopic) topic = val.to;
  else if (val.map.useFunction) {
    try {
      var res = mapFunction(topic, payload, val.map)

      for (let i = 0; i < res.length; i++)
        publishPacket(val, res[i].topic, res[i].payload);

      // stop here
      return;
    } catch (err) {
      debug("Function error while mapping", topic, payload, err.message)
      return;
    }
  }

  // map the payload
  try {
    payload = mapPayload(val.map, payload);
  } catch (e) {
    debug("Error while mapping payload", e.message)
    return;
  }

  publishPacket(val, topic, payload)
}

function mapFunction(topic, payload, map) {
  var func = new Function('topic', 'payload', map.code);
  var res = func(topic, payload);

  if (!Array.isArray(res)) res = [res]

  for (let i = 0; i < res.length; i++) {
    if (!res[i].topic || typeof res[i].topic != 'string')
      throw Error("returned topic must exist and must be a string. Got: " + res[i].topic)

    if (!res[i].payload || typeof res[i].payload != 'string')
      throw Error("returned payload must exist must be a string. Got: " + res[i].payload)
  }

  return res;
}


/**
 * Maps an MQTT Packet using a Map Configuration
 *
 * @param {String} topic The MQTT Topic String
 * @param {String} payload The MQTT payload String
 * @param {String} map The Map configuration Object
 * @returns
 */
function mapPacket(topic, payload, map) {

  // map topic if customTopic is true
  if (map.customTopic) {

    if (map.useFunction) {
      try {
        var res = mapFunction(topic, payload, map)

        for (let i = 0; i < res.length; i++)
          publishPacket(map, res[i].topic, res[i].payload);

        // stop here
        return;
      } catch (err) {
        debug("Function error while mapping", topic, payload, err.message)
        return;
      }
    } else {

      if (map.suffixFrom) {
        if (!topic.endsWith(map.suffixFrom)) return;
        else topic = topic.substr(0, topic.indexOf(map.suffixFrom) - 1);
      }

      var parts = map.wTo.split('/')

      // returns an array with the wildecards parts
      var wParts = mqttWildcard(topic, map.wFrom);

      // replace array wildecards in parts wildecards
      for (let i = 0, k = 0; i < parts.length && k < wParts.length; i++) {
        if (parts[i] == "#" || parts[i] == "+") {
          parts[i] = wParts[k++];
        }
      }

      if (map.suffixTo) parts.push(map.suffixTo);

      // recreate destination topic
      topic = parts.join('/');
    }
  }

  // map payload
  if (!map.useFunction) {
    try {
      payload = mapPayload(map, payload);
    } catch (e) {
      debug("Error while mapping payload", e.message)
      return;
    }
  }

  publishPacket(map, topic, payload)
}


/**
 * Publish a packet using map/value client or Aedes Broker
 *
 * @param {Object} mv Map or Value Configuration Object
 * @param {String} topic The MQTT Topic String
 * @param {String} payload The MQTT payload String
 */
function publishPacket(mv, topic, payload) {
  if (mv.client) {
    var options = {
      qos: mv.qos,
      retain: mv.retain
    }
    mv.client.publish(topic, payload, options);
  } else {
    aedes.publish({
      topic: topic,
      qos: mv.qos,
      retain: mv.retain,
      payload: payload
    })
  }
}

function mapPayload(map, payload) {

  switch (map.payload) {
    case 0:
      // keep original
      break;
    case 1:
      // value --> JSON
      payload[map.payloadValue] = parseInt(payload);
      if (map.addTime) payload[map.timeValue] = Date.now();
      return JSON.stringify(payload);
    case 2:
      // JSON --> value
      payload = JSON.parse(payload);
      return payload[map.payloadValue].toString()
    case 3:
      // JSON --> JSON
      let tmp = {};
      payload = JSON.parse(payload);
      map.payloadMap.forEach(m => {
        tmp[m.to] = payload[m.from];
      });
      if (map.addTime) tmp[map.timeValue] = Date.now();
      return JSON.stringify(tmp);
    default:
      debug("Unknown map function of map %s: %s", map.name, map.payload)
      break;
  }

  return payload;
}


/**
 * Close all MQTT Clients and Broker
 *
 */
function close(cb) {
  
  function done() {
    if(--count === 0) cb()
  }

  var toClose = [...clients, wsServer, server]
  var count = toClose.length

  if(count === 0) {
    cb() 
  } else {
    toClose.forEach(c => {
      if(c) c.close(done);
      else done()
    });
  }

}


/**
 * Restart all Clients and Broker
 *
 */
function restart() {
  close(init);
}


/**
 * Get Broker and Clients Status
 *
 * @returns An Object with all status parameters
 */
function status() {
  return {
    broker: server ? server.address() : null,
    websocket: wsServer ? wsServer.address() : null,
    clients: clients.map(c => c.getStatus()),
    wsError: wsError,
    brokerError: brokerError,
    ssl: config.ssl,
    key: config._key,
    cert: config._cert
  }
}


module.exports = exports = {
  init: init,
  close: close,
  restart: restart,
  status: status
}
