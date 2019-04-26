var reqlib = require('app-root-path').require
var config = reqlib('config/app.js')
var aedes = require('aedes')()
var Promise = require('bluebird')
var jsonStore = reqlib('/lib/jsonStore.js')
var store = reqlib('config/store.js')
var server = require('net').createServer(aedes.handle)
var debug = reqlib('/lib/debug')('Broker')
var MqttClient = reqlib('/lib/MqttClient')
var EventEmitter = require('events')
var inherits = require('util').inherits

var mqttWildcard = require('mqtt-wildcard');

var maps = {};
var maps_keys = [];
var clients = []

server.listen(config.brokerPort, function () {
  debug('Broker listening on port', config.brokerPort)
});

// client connected
aedes.on('client', (client) => {
  debug("Client CONNECTED:", client.id)
});

// client disconnected
aedes.on('clientDisconnect', (client) => {
  debug("Client DISCONNECTED:", client.id)
});

// client subscribed to topic
aedes.on('subscribe', (subscriptions, client) => {
  debug("Client %s SUBSCRIED to %s:", client.id, subscriptions[0].topic)
});

// client unsubscribed to topic
aedes.on('unsubscribe', (subscriptions, client) => {
  debug("Client %s UNSUBSCRIBED to %s:", client.id, subscriptions[0].topic)
});

// client subscribed to topic
aedes.on('publish', (packet, client) => {
  if (!client) client = {
    id: "$BROKER"
  }

  var topic = packet.topic;
  var payload = packet.payload ? packet.payload.toString() : payload;

  if (topic.startsWith('$SYS')) return; // System message

  debug("Client %s PUBLISH on %s: %s", client.id, packet.topic, packet.payload);

  var toSend = [];

  for (let i = 0; i < maps_keys.length; i++) {
    if (mqttWildcard(topic, maps_keys[i])) {
      toSend.push(maps[maps_keys[i]]);
    }
  }

  toSend.forEach(t => {
    mapPacket(topic, payload, t.client, t.map)
  });


});


function init() {
  var config = jsonStore.get(store.settings);

  maps = {};
  maps_keys = [];
  clients = [];

  // init mqtt clients
  config.clients.forEach(c => {
    var client = new MqttClient(c);

    clients.push(client);

    var mapsGet = c.mapsGet.map(id => config.maps.find(c => c._id == id));
    var mapsSet = c.mapsSet.map(id => config.maps.find(c => c._id == id));

    // remove null values from array
    mapsSet = mapsSet.filter(e => !!e)
    mapsGet = mapsGet.filter(e => !!e)

    mapsGet.forEach(e => {
      maps[e.wFrom] = {
        client: client,
        map: e
      };
      maps_keys.push(e.wFrom);
    });

    maps[client.client_id] = {
      client: client,
      map: mapsGet
    }

    // subscribe for write requests
    mapsSet.forEach(m => {
      client.subscribe(m.wFrom);
    });

    // handle write requests
    client.on("writeRequest", function (topic, payload) {
      // get the first map wildecard corresponding to the topic
      var map = mapsSet.find(m => mqttWildcard(topic, m.wFrom));

      if (map) {
        mapPacket(topic, payload, client, map)
      }
    })
  });
}

function mapPacket(topic, payload, client, map) {

  // map topic if customTopic is true
  if (map.customTopic) {

    if (map.wSuffix) {
      if (!topic.endsWith(map.wSuffix)) return;
      else topic = topic.substr(0, topic.indexOf(map.wSuffix) - 1);
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

    // recreate destination topic
    topic = parts.join('/');
  }

  // map payload
  try {
    payload = mapPayload(map, payload);
  } catch (e) {
    debug("Error while mapping payload", e.message)
    return;
  }

  var options = {
    qos: map.qos,
    retain: map.retain
  }

  client.publish(topic, payload, options);
}

function mapPayload(map, payload) {
  switch (map.payload) {
    case 0:
      // keep original
      break;
    case 1:
      // value --> JSON
      payload = parseInt(payload)
      return JSON.stringify({
        [map.payloadValue]: payload
      })
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
      return JSON.stringify(tmp);
    default:
      debug("Unknown map function of map %s: %s", map.name, map.payload)
      break;
  }

  return payload;
}


//setTimeout(init, 5000);

/**
 * The constructor
 */
// function Broker() {
//   if (!(this instanceof Broker)) {
//     return new Broker(config)
//   }
//   EventEmitter.call(this)
//   init.call(this);
// }

// inherits(Broker, EventEmitter)

// function init() {

// }

// Broker.prototype.close = function () {
//   this.closed = true

//   aedes.close()
// }

function close(){
  clients.forEach(c => {
    c.close();
  });
}

function restart(){
  close();
  setTimeout(init, 1000);
}


module.exports = exports = {
  init: init,
  close: close,
  restart: restart
}
