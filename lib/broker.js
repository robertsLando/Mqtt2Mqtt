var reqlib = require('app-root-path').require
var config = reqlib('config/app.js')
var aedes = require('aedes')()
var Promise = require('bluebird')
var jsonStore = reqlib('/lib/jsonStore.js')
var store = reqlib('config/store.js')
var server = require('net').createServer(aedes.handle)
var debug = reqlib('/lib/debug')('Broker')

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

// client subscribed to topic
aedes.on('unsubscribe', (subscriptions, client) => {    
    debug("Client %s UNSUBSCRIBED to %s:", client.id, subscriptions[0].topic)
});

// client subscribed to topic
aedes.on('publish', (packet, client) => { 
    if(!client) client = {id: "$BROKER"}
    
    var topic = packet.topic;

    if(topic.startsWith('$SYS')) return; // System message

    var payload = packet.payload.toString();

    if(!isNaN(payload)){
         payload = Number(payload);
    }else{
        try {
            payload = JSON.parse(payload);
        } catch (e) {}
    }
    
    debug("Client %s PUBLISH on %s: %s", client.id, packet.topic, packet.payload);


});


module.exports = exports = aedes;