# Mqtt To Mqtt

![MQTT](images/MQTT-Logo.png)

Fully configurable Mqtt to Mqtt gateway.

- **Backend**: NodeJS, Express, Mqttjs, Aedes Mqtt Broker, Webpack
- **Frontend**: Vue, [Vuetify](https://github.com/vuetifyjs/vuetify)

## Why

There is almost an MQTT gateway for every protocol out there.

The problem is every gateway maps reads and writes in different ways depending on the protocol used. There isn't a standard way to map a protocol in MQTT topics and also there isn't a standard payload, some sends a JSON payload with different properties (like `val` or `value` or `data` for the value and `tms` `time` `timestamp` for the timestamp/date), others use a payload with just a numeric value.

This gateway inits an MQTT broker that sits between your MQTT gateways (or devices) and your broker to parse incoming/outgoing MQTT messages from/to your broker in the format you need.

Here is an example schema of how it works:

![Diagram](images/sketch_diagram.png)

Note here there are some bold text **GET/SET** **from/to**. More about them in docs

## :electric_plug: Installation

``` bash
# Clone repo
git clone https://github.com/robertsLando/

cd Mqtt2Mqtt

# install dependencies
npm install

# build for production with minification
npm run build

# Start the server
npm start
```

## How it works

Once the app is running open the web browser to http://localhost:8100. Here you need to declare the Mqtt clients, the maps and (optionally) the values.

### MQTT Clients

- **Name**: A unique name that identify the Client.
- **Host**: The url to the broker
- **Port**: Broker port
- **Reconnect period**: Milliseconds between two reconnection tries
- **QoS**: Quality Of Service (check MQTT specs) of outgoing packets
- **Retain**: The retain flag of outgoing packets
- **Clean**: Sets the clean flag when connecting to the broker
- **Store**: Enable/Disable persistent storage of packets (QoS > 0). If disabled in memory storage will be used but all packets stored in memory are lost in case of shutdowns or unexpected errors.
- **Auth**: Enable this if broker requires auth. If so you need to enter also a valid **username** and **password**.


## :pencil: TODOs

- [ ] Dockerize application
- [ ] Package application with PKG
- [ ] Publish/Subscribe topics on UI for testing
- [ ] Unit tests
- [ ] JSON validator for settings

## :bowtie: Author

[Daniel Lando](https://github.com/robertsLando)

Support me on [Patreon](https://www.patreon.com/join/2409916) :heart:
