var reqlib = require('app-root-path').require
var config = reqlib('config/app.js')
var aedes = require('aedes')()
var jsonStore = reqlib('/lib/jsonStore.js')
var store = reqlib('config/store.js')
var server = require('net').createServer(aedes.handle)
var debug = reqlib('/lib/debug')('Broker')
var MqttClient = reqlib('/lib/MqttClient')
var mqttWildcard = require('mqtt-wildcard')

var settings = {};

var maps = {};
var maps_keys = [];
var clients = [];
var topicsGet = {};

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


function init() {
  settings = JSON.parse(JSON.stringify(jsonStore.get(store.settings)));

  maps = {};
  maps_keys = [];
  clients = [];
  topicsGet = {};

  // init mqtt clients
  settings.clients.forEach(c => {
    initClient(c)
  });
}

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
    m.client = client;
    client.subscribe(m.wFrom);
  });

  // subscribe to client values
  var values = settings.values ? settings.values.filter(v => v.client_id === c._id && v.mode === "SET") : [];
  var topicsSet = [];

  values.forEach(v => {
    v.map = settings.maps.find(m => m._id == v.map_id);
    v.client = client;
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

function mapPacketValue(topic, payload, val) {
  // set the custom topic
  if (val.customTopic) topic = val.to;

  // map the payload
  try {
    payload = mapPayload(val.map, payload);
  } catch (e) {
    debug("Error while mapping payload", e.message)
    return;
  }

  var options = {
    qos: val.qos,
    retain: val.retain
  }

  // forward the message
  val.client.publish(topic, payload, options);
}

function mapPacket(topic, payload, map) {

  // map topic if customTopic is true
  if (map.customTopic) {

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

    if(map.suffixTo) parts.push(map.suffixTo);

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

  map.client.publish(topic, payload, options);
}

function mapPayload(map, payload) {
  switch (map.payload) {
    case 0:
      // keep original
      break;
    case 1:
      // value --> JSON
      payload[map.payloadValue] = parseInt(payload);
      if(map.addTime) payload[map.timeValue] = Date.now();
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
      if(map.addTime) tmp[map.timeValue] = Date.now();
      return JSON.stringify(tmp);
    default:
      debug("Unknown map function of map %s: %s", map.name, map.payload)
      break;
  }

  return payload;
}

function close() {
  clients.forEach(c => {
    c.close();
  });
}

function restart() {
  close();
  setTimeout(init, 1000);
}


module.exports = exports = {
  init: init,
  close: close,
  restart: restart
}