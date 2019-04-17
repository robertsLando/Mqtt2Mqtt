/* eslint-disable */

<template>
  <v-container fluid grid-list-md>
    <v-card>
      <v-card-text>
        
        <v-btn color="blue darken-1" flat @click="dialogValue = true">New Value</v-btn>

        <v-data-table
          :headers="headers"
          :items="gateway.values"
          :rows-per-page-items="[10, 20, {'text':'All','value':-1}]"
          class="elevation-1"
        >
          <template slot="items" slot-scope="props">
            <td>{{ deviceName(props.item.device) }}</td>
            <td>{{ props.item.value.label + ' (' + props.item.value.value_id + ')' }}</td>
            <td class="text-xs">{{ props.item.topic }}</td>
            <td class="text-xs">{{ props.item.postOperation || 'No operation' }}</td>
            <td
              class="text-xs"
            >{{ props.item.enablePoll ? ("Intensity " + props.item.pollIntensity) : 'No' }}</td>
            <td class="text-xs">{{ props.item.verifyChanges ? "Verified" : 'Not Verified' }}</td>
            <td class="justify-center layout px-0">
              <v-icon small class="mr-2" color="green" @click="editItem(props.item)">edit</v-icon>
              <v-icon small color="red" @click="deleteItem(props.item)">delete</v-icon>
            </td>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="purple darken-1" flat @click="importSettings">
          Import
          <v-icon right dark>file_upload</v-icon>
        </v-btn>
        <v-btn color="green darken-1" flat @click="exportSettings">
          Export
          <v-icon right dark>file_download</v-icon>
        </v-btn>
        <v-btn color="blue darken-1" flat type="submit" form="form_settings">
          Save
          <v-icon right dark>save</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import ConfigApis from "@/apis/ConfigApis";

export default {
  name: "Settings",
  computed: {},
  data() {
    return {
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
  },
  methods: {
    showSnackbar(text) {
      this.$emit("showSnackbar", text);
    },
    importSettings() {
      var self = this;
      this.$emit("import", "json", function(err, settings) {
        if (settings.zwave && settings.mqtt && settings.gateway) {
          self.$store.dispatch("import", settings);
          self.showSnackbar("Configuration imported successfully");
        } else {
          self.showSnackbar("Imported settings not valid");
        }
      });
    },
    exportSettings() {
      var settings = this.getSettingsJSON();
      this.$emit("export", settings, "settings");
    },
    getSettingsJSON() {
      return this.settings;
    },
    update() {
      if (this.$refs.form_settings.validate()) {
        var self = this;
        ConfigApis.updateConfig(self.getSettingsJSON())
          .then(data => {
            self.showSnackbar(data.message);
          })
          .catch(error => {
            console.log(error);
          });
      } else {
        this.showSnackbar("Your configuration contains errors, fix it");
      }
    }
  },
  mounted() {
    // var self = this;
    // this.$store.dispatch("init", data);
    // ConfigApis.getConfig()
    //   .then(data => {
    //     if (!data.success) {
    //       self.showSnackbar(
    //         "Error while retriving configuration, check console"
    //       );
    //       console.log(response);
    //     } else {
    //       self.$store.dispatch("init", data);
    //     }
    //   })
    //   .catch(e => {
    //     self.showSnackbar("Error while retriving configuration, check console");
    //     console.log(e);
    //   });
  }
};
</script>
