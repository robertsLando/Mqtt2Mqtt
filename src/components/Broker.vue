/* eslint-disable */

<template>
  <v-container fluid fill-height grid-list-md>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Status</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-list dense>
              <v-subheader>General</v-subheader>
              <v-divider></v-divider>
              <v-list-tile>
                <v-list-tile-content>Broker</v-list-tile-content>
                <v-list-tile-content
                  :style="{color: (status.broker ? 'white' : 'red')}"
                  class="align-end"
                >{{ status.broker ? "Listening on " + status.broker.port : status.brokerError }}</v-list-tile-content>
              </v-list-tile>
              <v-list-tile>
                <v-list-tile-content>Websocket</v-list-tile-content>
                <v-list-tile-content
                  :style="{color: (status.websocket ? 'white' : 'red')}"
                  class="align-end"
                >{{ status.websocket ? "Listening on " + status.websocket.port : status.wsError }}</v-list-tile-content>
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
                  <v-tooltip bottom>
                    <v-icon
                      slot="activator"
                      color="primary"
                      @click.stop="download(status.key, 'key.pem')"
                    >get_app</v-icon>
                    <span>Download</span>
                  </v-tooltip>
                </v-list-tile-content>
              </v-list-tile>
              <v-list-tile v-if="status.ssl && status.cert">
                <v-list-tile-content>Cert</v-list-tile-content>
                <v-list-tile-content class="align-end">
                  <v-tooltip bottom>
                    <v-icon
                      slot="activator"
                      color="primary"
                      @click.stop="download(status.cert, 'cert.pem')"
                    >get_app</v-icon>
                    <span>Download</span>
                  </v-tooltip>
                </v-list-tile-content>
              </v-list-tile>
              <div v-if="status.clients && status.clients.length > 0">
                <v-subheader>Clients</v-subheader>
                <v-divider></v-divider>
                <v-list-tile v-for="(client, index) in status.clients" :key="index">
                  <v-list-tile-content>{{client.config.name}}</v-list-tile-content>
                  <v-list-tile-content
                    :style="{color: (client.status ? 'green' : 'red')}"
                    class="align-end"
                  >{{client.status ? 'Connected' : client.error}}</v-list-tile-content>
                </v-list-tile>
              </div>
            </v-list>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

    <!--FAB-->
    <v-btn fab bottom right dark fixed color="blue" @click.stop="openDialog">
        <v-icon>settings</v-icon>
    </v-btn>

    <DialogSettings
      @save="saveValue"
      @close="closeDialog"
      v-model="dialogValue"
      :editedValue="editedValue"
    />
  </v-container>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import ConfigApis from "@/apis/ConfigApis";
import DialogSettings from "@/components/dialogs/Settings";


export default {
  name: "Broker",
  components: { DialogSettings },
  computed: {
    ...mapGetters(["broker"])
  },
  data() {
    return {
      status: {},
      dialogValue: false,
      editedValue: {},
      defaultValue: {},
      statusInterval: null
    };
  },
  methods: {
    openDialog () {
      this.editedValue = Object.assign({}, this.broker);
      this.dialogValue = true
    },
    closeDialog () {
      this.dialogValue = false
    },
    saveValue () {
      this.$store.dispatch("updateBroker", this.editedValue);
      this.closeDialog()
    },
    showSnackbar(text) {
      this.$emit("showSnackbar", text);
    },
    download(text, filename) {
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
    this.statusInterval = setInterval(this.updateStatus.bind(this), 2000);
  },
  beforeDestroy() {
    if (this.statusInterval) clearInterval(this.statusInterval);
  }
};
</script>
