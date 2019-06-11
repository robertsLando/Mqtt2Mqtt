/* eslint-disable */

<template>
  <v-container fluid fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Broker settings</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-form id="form_broker" @submit.prevent="update" v-model="valid" ref="form_broker">
              <v-text-field
                v-model.number="broker.port"
                prepend-icon="settings_ethernet"
                label="Port"
                :rules="[rules.required, validPort]"
                hint="Broker listening port"
                required
                type="number"
              ></v-text-field>
              <v-switch persistent-hint label="MQTT over Websockets" v-model="broker.websocket"></v-switch>
              <v-text-field
                v-if="broker.websocket"
                prepend-icon="settings_ethernet"
                v-model.number="broker.webPort"
                label="Websocket port"
                :rules="[rules.required]"
                hint="Websocket listening port"
                required
                type="number"
              ></v-text-field>
              <v-switch
                persistent-hint
                label="Require auth"
                v-model="broker.authenticate"
              ></v-switch>
              <v-text-field
                v-if="broker.authenticate"
                prepend-icon="person"
                v-model.number="broker.username"
                label="Username"
                :rules="[requiredAuth]"
                required
              ></v-text-field>
              <v-text-field
                v-if="broker.authenticate"
                prepend-icon="lock"
                v-model.number="broker.password"
                label="Password"
                :rules="[requiredAuth]"
                required
                type="password"
              ></v-text-field>
              <v-switch persistent-hint label="SSL" v-model="broker.ssl"></v-switch>
              <v-switch
                persistent-hint
                v-if="broker.ssl"
                label="Auto-generate ssl certs"
                v-model="broker.autoGenerate"
              ></v-switch>
              <file-input
                :rules="[requiredKey]"
                v-if="broker.ssl && !broker.autoGenerate"
                label="Key.pem"
                v-model="broker.key"
                @onFileSelect="onFileKeySelect"
              ></file-input>
              <file-input
                :rules="[requiredCert]"
                v-if="broker.ssl && !broker.autoGenerate"
                label="Cert.pem"
                v-model="broker.cert"
                @onFileSelect="onFileCertSelect"
              ></file-input>
            </v-form>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import fileInput from "@/components/custom/file-input.vue";
import { readFile } from 'fs';

export default {
  name: "Broker",
  components: { fileInput },
  computed: {
    ...mapGetters(["broker"]),
    validPort() {
      return (
        (this.broker.websocket
          ? this.broker.port != this.broker.webPort
          : true) || "Port and websocket port must be differents"
      );
    },
    requiredAuth(){      
      return (!this.broker.authenticate || (!!this.broker.username && !!this.broker.password)) || 'Insert valid username and password'
    },
    requiredKey(){      
      return (this.broker.ssl && !this.broker.autoGenerate && !!this.broker.key) || 'You must select a File'
    },
    requiredCert(){
      return (this.broker.ssl && !this.broker.autoGenerate && !!this.broker.cert) || 'You must select a File'
    },
  },
  data() {
    return {
      valid: true,
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
    readFile(file, callback){
      const reader = new FileReader();

      reader.onload = e => callback(e.target.result);
      reader.readAsText(file);
    },
    onFileKeySelect(files){
      var file = files[0];
      var self = this;
      if(file){
        this.readFile(file, (text) => self.broker._key = text);
      }
    },
    onFileCertSelect(files){
      var file = files[0];
      var self = this;
      if(file){
        this.readFile(file, (text) => self.broker._cert = text);
      }
    }
  },
  mounted() {}
};
</script>
