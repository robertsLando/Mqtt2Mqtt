<template>
  <v-app dark>

    <v-navigation-drawer
    clipped-left
    permanent
    stateless
    disable-resize-watcher
    :mini-variant.sync="mini"
    v-model="drawer"
    app
    >
    <v-toolbar flat class="transparent">
        <v-list class="pa-0">
          <v-list-tile avatar>
            <v-list-tile-avatar>
              <img style="border-radius: 0;" src="/static/logo.png" >
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>Mqtt2Mqtt</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>

    </v-toolbar>
    <v-divider></v-divider>
    <v-list>
      <v-list-tile
      v-for="item in pages"
      :key="item.title"
      @click.stop="mini ? mini = true : mini = false"
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
  <v-toolbar-side-icon @click.native.stop="mini = !mini"></v-toolbar-side-icon>
  <v-toolbar-title>{{title}}</v-toolbar-title>

  <v-spacer></v-spacer>

</v-toolbar>
<main>
  <v-content>
      <router-view @import="importFile" @export="exportConfiguration" @showSnackbar="showSnackbar"/>
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

export default {
  name: 'app',
  methods: {
    showSnackbar: function(text){
      this.snackbarText = text;
      this.snackbar = true;
    },
    updateStatus: function(status, color){
      this.status = status;
      this.statusColor = color;
    },
    importFile : function(ext, callback)
    {
      var self = this;
      // Check for the various File API support.
      if(window.File && window.FileReader && window.FileList && window.Blob)
      {
        var input = document.createElement('input');
        input.type = "file";
        input.addEventListener("change", function(event)
        {
          var files = event.target.files;

          if(files && files.length > 0)
          {
            var file = files[0];
            var reader = new FileReader();

            reader.addEventListener("load", function(fileReaderEvent)
            {
              var err;
              var data = fileReaderEvent.target.result;

              if(ext == 'json'){
                try {
                  data = JSON.parse(data);
                } catch (e) {
                  self.showSnackbar("Error while parsing input file, check console for more info")
                  console.log(e);
                  err = e;
                }
              }

              callback(err, data);
            });

            reader.readAsText(file);
          }

        });

        input.click();
      }
      else
      {
        alert('Unable to load a file in this browser.');
      }
    },
    exportConfiguration: function(data, fileName, ext){
      var contentType = ext == 'xml' ? 'text/xml' : 'application/octet-stream';
      var a = document.createElement('a');

      var blob = new Blob([ext == 'xml' ? data : JSON.stringify(data)], {'type': contentType});

      document.body.appendChild(a);
      a.href = window.URL.createObjectURL(blob);
      a.download = fileName + "." + (ext ? ext : "json");
      a.target="_self";
      a.click();
    }
  },
  data () {
    return {
      pages: [
        { icon: 'widgets', title: 'Configuration', path: '/' },
        { icon: 'settings', title: 'MQTT Clients', path: '/clients' }
      ],
      drawer: false,
      topbar: [],
      title: 'MQTT Clients',
      mini: true,
      snackbar: false,
      snackbarText: ""
    }
  },
  mounted() {
    var self = this;

    ConfigApis.getSettings()
      .then(data => {
        if (!data.success) {
          self.showSnackbar(
            "Error while retriving settings, check console"
          );
          console.log(response);
        } else {
          self.$store.dispatch("init", data);
        }
      })
      .catch(e => {
        self.showSnackbar("Error while retriving settings, check console");
        console.log(e);
      });
  },
	watch: {
  	'$route': function(value) {
      switch (value.name) {
        case 'MqttClients':
        this.title = 'MQTT Clients';
        break;
        case 'Configuration':
        this.title = 'Configuration';
        break;
        default:
        this.title = '';
      }
    }
  }
}
</script>
