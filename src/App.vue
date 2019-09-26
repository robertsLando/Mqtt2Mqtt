<template>
  <v-app dark>
    <v-navigation-drawer clipped-left :mini-variant="mini" v-model="drawer" app>
      <v-toolbar flat class="transparent">
        <v-list class="pa-0">
          <v-list-tile avatar>
            <v-list-tile-avatar>
              <img style="border-radius: 0;" src="/static/logo.png" />
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>MQTT To MQTT</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-toolbar>
      <v-divider></v-divider>
      <v-list>
        <v-list-tile
          v-for="item in pages"
          :key="item.title"
          :to="item.path == '#' ? '' : item.path"
        >
          <v-list-tile-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ item.title }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
      <v-footer absolute v-if="!mini" class="pa-3">
        <div>Innovation System &copy; {{ new Date().getFullYear() }}</div>
      </v-footer>
    </v-navigation-drawer>

    <v-toolbar fixed app>
      <v-toolbar-side-icon @click="openDrawer"></v-toolbar-side-icon>
      <v-toolbar-title>{{title}}</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-menu v-for="item in items" :key="item.text" bottom left>
        <v-btn slot="activator" icon @click.native="item.func">
          <v-tooltip bottom>
            <v-icon dark color="primary" slot="activator">{{item.icon}}</v-icon>
            <span>{{item.tooltip}}</span>
          </v-tooltip>
        </v-btn>

        <v-list v-if="item.menu">
          <v-list-tile v-for="(menu, i) in item.menu" :key="i" @click="menu.func">
            <v-list-tile-title>{{ menu.title }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-toolbar>
    <main>
      <v-content>
        <router-view
          @import="importFile"
          @export="exportConfiguration"
          @showSnackbar="showSnackbar"
        />
      </v-content>
    </main>

    <v-snackbar
      :timeout="3000"
      :bottom="true"
      :multi-line="false"
      :vertical="false"
      v-model="snackbar"
    >
      {{ snackbarText }}
      <v-btn flat @click.native="snackbar = false">Close</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import ConfigApis from "@/apis/ConfigApis";
import { mapGetters, mapMutations } from "vuex";

export default {
  name: "app",
  computed: mapGetters(["configuration"]),
  methods: {
    openDrawer() {
      if (this.$vuetify.breakpoint.xsOnly) {
        this.mini = false;
        this.drawer = !this.drawer;
      } else {
        this.mini = !this.mini;
        this.drawer = true;
      }
    },
    showSnackbar: function(text) {
      this.snackbarText = text;
      this.snackbar = true;
    },
    saveConfiguration: function() {
      var self = this;
      ConfigApis.updateSettings(this.configuration)
        .then(response => {
          if (response.success)
            self.showSnackbar("New configuration successfully saved");
          else {
            self.showSnackbar(response.error.message);
            console.log(response.error);
          }
        })
        .catch(e => {
          console.log(e);
        });
    },
    importConfiguration: function() {
      var self = this;

      this.importFile((err, jsonObject) => {
        if (!err) {
          self.$store.dispatch("init", jsonObject);
          self.showSnackbar("Configuration loaded successfully");
        }
      });
    },
    importFile: function(callback) {
      var self = this;
      // Check for the various File API support.
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        var input = document.createElement("input");
        input.type = "file";
        input.addEventListener("change", function(event) {
          var files = event.target.files;

          if (files && files.length > 0) {
            var file = files[0];
            var reader = new FileReader();

            reader.addEventListener("load", function(fileReaderEvent) {
              var jsonObject = {};
              var err;
              var data = fileReaderEvent.target.result;

              try {
                jsonObject = JSON.parse(data);
              } catch (e) {
                self.showSnackbar(
                  "Error while parsing input file, check console for more info"
                );
                console.log(e);
                err = e;
              }

              callback(err, jsonObject);
            });

            reader.readAsText(file);
          }
        });

        input.click();
      } else {
        alert("Unable to load a file in this browser.");
      }
    },
    exportConfiguration: function() {
      var contentType = "application/octet-stream";
      var a = document.createElement("a");

      var data = this.configuration;

      var blob = new Blob([JSON.stringify(data)], { type: contentType });

      document.body.appendChild(a);
      a.href = window.URL.createObjectURL(blob);
      a.download = "settings.json";
      a.target = "_self";
      a.click();
    }
  },
  data() {
    return {
      pages: [
        { icon: "work", title: "Broker", path: "/" },
        { icon: "wifi", title: "MQTT Clients", path: "/clients" },
        { icon: "local_offer", title: "Values", path: "/values" },
        { icon: "settings_ethernet", title: "Maps", path: "/maps" }
      ],
      drawer: false,
      topbar: [],
      title: "",
      mini: true,
      snackbar: false,
      snackbarText: "",
      items: [
        {
          icon: "file_download",
          func: this.importConfiguration,
          tooltip: "Import Configuration"
        },
        {
          icon: "file_upload",
          func: this.exportConfiguration,
          tooltip: "Export Configuration"
        },
        {
          icon: "save",
          func: this.saveConfiguration,
          tooltip: "Save Configuration"
        }
      ]
    };
  },
  beforeMount() {
    this.title = this.$route.name || "";
  },
  mounted() {
    var self = this;

    if (this.$vuetify.breakpoint.xsOnly) {
      this.mini = false;
      this.drawer = false;
    } else {
      this.drawer = true;
      this.mini = true;
    }

    ConfigApis.getSettings()
      .then(data => {
        if (!data.success) {
          self.showSnackbar("Error while retriving settings, check console");
          console.log(response);
        } else {
          self.$store.dispatch("init", data.settings);
        }
      })
      .catch(e => {
        self.showSnackbar("Error while retriving settings, check console");
        console.log(e);
      });
  },
  watch: {
    $route: function(value) {
      this.title = value.name || "";
    }
  }
};
</script>
