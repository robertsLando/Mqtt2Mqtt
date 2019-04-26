# Mqtt To Mqtt

![MQTT](images/MQTT-Logo.png)

Fully configurable Mqtt to Mqtt gateway.

- **Backend**: NodeJS, Express, Mqttjs, Aedes Mqtt Broker, Webpack
- **Frontend**: Vue, [Vuetify](https://github.com/vuetifyjs/vuetify)

## Why

There is almost an MQTT gateway for every protocol out there. The problem in some cases is every gateway maps reads and writes in different ways depending on the protocol used. There isn't a standard way to map a protocol in MQTT topics and also there is not standard payload, some works with a JSON payload with different properties, others use a payload with just a numeric value and so on. This gateway inits his custom broker and sits between your MQTT gateways (or MQTT devices) and your broker. Here is an example schema:

![Diagram](images/sketch_diagram.png)

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

## :pencil: TODOs

- [ ] Dockerize application
- [ ] Package application with PKG
- [ ] Publish/Subscribe topics on UI for testing
- [ ] Unit tests
- [ ] JSON validator for settings

## :bowtie: Author

[Daniel Lando](https://github.com/robertsLando)

Support me on [Patreon](https://www.patreon.com/join/2409916) :heart:
