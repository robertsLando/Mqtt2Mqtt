/* eslint-disable */

<template>
  <v-container fluid fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>MQTT Broker</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-list dense>
              <v-list-tile>
                <v-list-tile-content>Broker</v-list-tile-content>
                <v-list-tile-content
                  :style="{color: (status.broker ? 'white' : 'red')}"
                  class="align-end"
                >{{ status.broker ? "Listening - Port " + status.broker.port : status.brokerError }}</v-list-tile-content>
              </v-list-tile>
              <v-list-tile>
                <v-list-tile-content>Websocket</v-list-tile-content>
                <v-list-tile-content
                  :style="{color: (status.websocket ? 'white' : 'red')}"
                  class="align-end"
                >{{ status.websocket ? "Listening - Port " + status.websocket.port : status.wsError }}</v-list-tile-content>
              </v-list-tile>
              <v-list-tile>
                <v-list-tile-content>SSL</v-list-tile-content>
                <v-list-tile-content
                  :style="{color: (status.ssl ? 'green' : 'red')}"
                  class="align-end"
                >{{ status.ssl ? "Enabled" : "Disabled" }}</v-list-tile-content>
              </v-list-tile>
              <v-list-tile v-if="status.ssl && status.key">
                <v-list-tile-content>Key</v-list-tile-content>
                <v-list-tile-content class="align-end">
                  <v-icon @click.stop="download(status.key, 'key.pem')">get_app</v-icon>
                </v-list-tile-content>
              </v-list-tile>
              <v-list-tile v-if="status.ssl && status.cert">
                <v-list-tile-content>Cert</v-list-tile-content>
                <v-list-tile-content class="align-end">
                  <v-icon @click.stop="download(status.cert, 'cert.pem')">get_app</v-icon>
                </v-list-tile-content>
              </v-list-tile>
            </v-list>
            <v-expansion-panel class="elevation-0">
              <v-expansion-panel-content>
                <div slot="header">Settings</div>
                <v-form id="form_broker" v-model="valid" ref="form_broker">
                  <v-text-field
                    v-model.number="edited.port"
                    :disabled="disabled"
                    prepend-icon="settings_ethernet"
                    label="Port"
                    :rules="[rules.required, validPort]"
                    hint="Broker listening port"
                    required
                    type="number"
                  ></v-text-field>
                  <v-switch :disabled="disabled" persistent-hint label="MQTT over Websockets" v-model="edited.websocket"></v-switch>
                  <v-text-field
                    v-if="edited.websocket"
                    :disabled="disabled"
                    prepend-icon="settings_ethernet"
                    v-model.number="edited.webPort"
                    label="Websocket port"
                    :rules="[rules.required]"
                    hint="Websocket listening port"
                    required
                    type="number"
                  ></v-text-field>
                  <v-switch :disabled="disabled" persistent-hint label="Require auth" v-model="edited.authenticate"></v-switch>
                  <v-text-field
                    v-if="edited.authenticate"
                    :disabled="disabled"
                    prepend-icon="person"
                    v-model.number="edited.username"
                    label="Username"
                    :rules="[requiredAuth]"
                    required
                  ></v-text-field>
                  <v-text-field
                    v-if="edited.authenticate"
                    :disabled="disabled"
                    prepend-icon="lock"
                    v-model.number="edited.password"
                    label="Password"
                    :rules="[requiredAuth]"
                    required
                    type="password"
                  ></v-text-field>
                  <v-switch :disabled="disabled" persistent-hint label="SSL" v-model="edited.ssl"></v-switch>
                  <v-switch
                    persistent-hint
                    v-if="edited.ssl"
                    :disabled="disabled"
                    label="Auto-generate ssl certs"
                    v-model="edited.autoGenerate"
                    @change="changeAutogen"
                  ></v-switch>
                  <v-switch
                    persistent-hint
                    :disabled="disabled"
                    v-if="edited.ssl"
                    label="Allow Self-signed certs"
                    v-model="edited.selfSigned"
                  ></v-switch>
                  <file-input
                    :rules="[requiredKey]"
                    :disabled="disabled"
                    v-if="edited.ssl && !edited.autoGenerate"
                    label="Key.pem"
                    v-model="edited.key"
                    @onFileSelect="onFileKeySelect"
                  ></file-input>
                  <file-input
                    :disabled="disabled"
                    :rules="[requiredCert]"
                    v-if="edited.ssl && !edited.autoGenerate"
                    label="Cert.pem"
                    v-model="edited.cert"
                    @onFileSelect="onFileCertSelect"
                  ></file-input>
                  <v-btn color="blue darken-1" flat @click="disabled ? disabled = false : validateSettings()">{{disabled ? 'Edit' : 'Update'}}</v-btn>
                  <v-btn v-if="!disabled" color="blue darken-1" flat @click="undoEdits()">Cancel</v-btn>
                </v-form>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import fileInput from "@/components/custom/file-input.vue";
import { readFile } from "fs";
import ConfigApis from "@/apis/ConfigApis";
import { setInterval, clearInterval } from "timers";

export default {
  name: "Broker",
  components: { fileInput },
  computed: {
    ...mapGetters(["broker"]),
    validPort() {
      return (
        (this.edited.websocket
          ? this.edited.port != this.edited.webPort
          : true) || "Port and websocket port must be differents"
      );
    },
    requiredAuth() {
      return (
        !this.edited.authenticate ||
        (!!this.edited.username && !!this.edited.password) ||
        "Insert valid username and password"
      );
    },
    requiredKey() {
      return (
        (this.edited.ssl && !this.edited.autoGenerate && !!this.edited.key) ||
        "You must select a File"
      );
    },
    requiredCert() {
      return (
        (this.edited.ssl && !this.edited.autoGenerate && !!this.edited.cert) ||
        "You must select a File"
      );
    }
  },
  watch: {
    broker: function(newValue) {
      this.edited = Object.assign({}, newValue);
    }
  },
  data() {
    return {
      valid: true,
      status: {},
      edited: {},
      disabled: true,
      statusInterval: null,
      rules: {
        required: value => {
          var valid = false;

          if (value instanceof Array) valid = value.length > 0;
          else valid = !!value || value === 0;

          return valid || "This field is required.";
        }
      }
    };
  },
  methods: {
    showSnackbar(text) {
      this.$emit("showSnackbar", text);
    },
    undoEdits(){
      this.edited = Object.assign({}, this.broker) 
      this.disabled = true
    },
    validateSettings() {
      if (this.$refs.form_broker.validate()) {
        this.$store.dispatch('updateBroker', this.edited);
        this.disabled = true;
        this.showSnackbar("Press save to update settings on server");
      } else {
        this.showSnackbar("Broker settings not valid");
      }
    },
    changeAutogen() {
      var edited = this.edited;
      if (edited.autoGenerate) {
        edited._key = edited.key = "";
        edited._cert = edited.cert = "";
      }
    },
    download(text, filename) {
      debugger;
      var element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
      );
      element.setAttribute("download", filename);

      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },
    readFile(file, callback) {
      const reader = new FileReader();

      reader.onload = e => callback(e.target.result);
      reader.readAsText(file);
    },
    onFileKeySelect(files) {
      var file = files[0];
      var self = this;
      if (file) {
        this.readFile(file, text => (self.edited._key = text));
      }
    },
    onFileCertSelect(files) {
      var file = files[0];
      var self = this;
      if (file) {
        this.readFile(file, text => (self.edited._cert = text));
      }
    },
    async updateStatus() {
      try {
        var result = await ConfigApis.getStatus();
        this.status = result.status;
      } catch (e) {
        this.showSnackbar("Error while reading broker status, check console");
        console.log(e);
      }
    }
  },
  async mounted() {
    await this.updateStatus();
    this.edited = Object.assign({}, this.broker);
    this.statusInterval = setInterval(this.updateStatus.bind(this), 2000);
  },
  beforeDestroy() {
    if (this.statusInterval) clearInterval(this.statusInterval);
  }
};
</script>
