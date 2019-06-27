<template>
  <v-dialog v-model="value" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Broker settings</span>
      </v-card-title>

      <v-card-text>
        <v-container grid-list-md>
          <v-form v-model="valid" ref="form" lazy-validation>
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field
                  v-model.number="editedValue.port"
                  label="Port"
                  :rules="[rules.required, validPort]"
                  hint="Broker listening port"
                  required
                  type="number"
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6>
                <v-switch
                  persistent-hint
                  label="Websocket"
                  hint="Enable this for MQTT over websockets"
                  v-model="editedValue.websocket"
                ></v-switch>
              </v-flex>
              <v-flex xs12 sm6>
                <v-text-field
                  v-if="editedValue.websocket"
                  v-model.number="editedValue.webPort"
                  label="Websocket Port"
                  :rules="[rules.required]"
                  hint="Websocket listening port"
                  required
                  type="number"
                ></v-text-field>
              </v-flex>
              <v-flex xs12>
                <v-switch
                  persistent-hint
                  label="Require auth"
                  v-model="editedValue.authenticate"
                  hint="Set a custom username and a password for clients auth"
                ></v-switch>
              </v-flex>
              <v-flex xs12 sm6>
                <v-text-field
                  v-if="editedValue.authenticate"
                  v-model.number="editedValue.username"
                  label="Username"
                  :rules="[requiredAuth]"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6>
                <v-text-field
                  v-if="editedValue.authenticate"
                  v-model.number="editedValue.password"
                  label="Password"
                  :append-icon="e1 ? 'visibility' : 'visibility_off'"
                  @click:append="() => (e1 = !e1)"
                  :type="e1 ? 'password' : 'text'"
                  :rules="[requiredAuth]"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6>
                <v-switch
                  persistent-hint
                  label="SSL"
                  v-model="editedValue.ssl"
                  hint="Enable this for encrypted cominications"
                ></v-switch>
              </v-flex>
              <v-flex xs12 sm6>
                <v-switch
                  persistent-hint
                  v-if="editedValue.ssl"
                  hint="Enable this to allow self-signed certs"
                  label="Self-signed certs"
                  v-model="editedValue.selfSigned"
                ></v-switch>
              </v-flex>
              <v-flex xs12>
                <v-switch
                  persistent-hint
                  v-if="editedValue.ssl"
                  label="Auto-generate certs"
                  hint="Enable this to auto-generate ssl certs using node-pem"
                  v-model="editedValue.autoGenerate"
                  @change="changeAutogen"
                ></v-switch>
              </v-flex>
              <v-flex xs12 sm6>
                <file-input
                  :rules="[requiredKey]"
                  v-if="editedValue.ssl && !editedValue.autoGenerate"
                  label="Key.pem"
                  keyProp="_key"
                  v-model="editedValue.key"
                  @onFileSelect="onFileSelect"
                ></file-input>
              </v-flex>
              <v-flex xs12 sm6>
                <file-input
                  :rules="[requiredCert]"
                  v-if="editedValue.ssl && !editedValue.autoGenerate"
                  label="Cert.pem"
                  keyProp="_cert"
                  v-model="editedValue.cert"
                  @onFileSelect="onFileSelect"
                ></file-input>
              </v-flex>
            </v-layout>
          </v-form>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" flat @click="$emit('close')">Cancel</v-btn>
        <v-btn color="blue darken-1" flat @click="$refs.form.validate() && $emit('save')">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from "vuex";
import fileInput from "@/components/custom/file-input.vue";

export default {
  props: {
    value: Boolean,
    title: String,
    editedValue: Object
  },
  components: { fileInput },
  watch: {
    value(val) {
      this.$refs.form.resetValidation();
    }
  },
  computed: {
    validPort() {
      return (
        (this.editedValue.websocket
          ? this.editedValue.port != this.editedValue.webPort
          : true) || "Port and websocket port must be differents"
      );
    },
    requiredAuth() {
      return (
        !this.editedValue.authenticate ||
        (!!this.editedValue.username && !!this.editedValue.password) ||
        "Insert valid username and password"
      );
    },
    requiredKey() {
      return (
        (this.editedValue.ssl &&
          !this.editedValue.autoGenerate &&
          !!this.editedValue.key) ||
        "You must select a File"
      );
    },
    requiredCert() {
      return (
        (this.editedValue.ssl &&
          !this.editedValue.autoGenerate &&
          !!this.editedValue.cert) ||
        "You must select a File"
      );
    }
  },
  methods: {
    changeAutogen() {
      var edited = this.editedValue;
      if (edited.autoGenerate) {
        edited._key = edited.key = "";
        edited._cert = edited.cert = "";
      }
    },
    readFile(file, callback) {
      const reader = new FileReader();

      reader.onload = e => callback(e.target.result);
      reader.readAsText(file);
    },
    onFileSelect(data) {
      var file = data.files[0];
      var self = this;
      if (file) {
        this.readFile(file, text => (self.editedValue[data.key] = text));
      } else {
        self.editedValue[data.key] = "";
      }
    }
  },
  data() {
    return {
      valid: true,
      e1: false,
      rules: {
        required: value => {
          var valid = false;

          if (value instanceof Array) valid = value.length > 0;
          else valid = !!value || value === 0;

          return valid || "This field is required.";
        },
        validName: value => {
          return (
            !/[!@#$%^&*)(+=:,;"'\\|?{}£°§<>[\]/.\s]/g.test(value) ||
            'Name is not valid, only "a-z" "A-Z" "0-9" chars and "_" are allowed'
          );
        }
      }
    };
  }
};
</script>
