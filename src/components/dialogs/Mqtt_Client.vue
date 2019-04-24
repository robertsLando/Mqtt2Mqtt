<template>
  <v-dialog v-model="value" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">{{ title }}</span>
      </v-card-title>

      <v-card-text>
        <v-container grid-list-md>
          <v-form v-model="valid" ref="form" lazy-validation>
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field
                  v-model="editedValue.name"
                  label="Name"
                  :rules="[rules.required, rules.validName]"
                  hint="A friendly name to describe this client"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6 md4>
                <v-text-field
                  v-model="editedValue.host"
                  label="Host url"
                  :rules="[rules.required]"
                  hint="The host url"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6 md4>
                <v-text-field
                  v-model.number="editedValue.port"
                  label="Port"
                  :rules="[rules.required]"
                  hint="Host Port"
                  required
                  type="number"
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6 md4>
                <v-text-field
                  v-model.number="editedValue.reconnectPeriod"
                  label="Reconnect period (ms)"
                  hint="Reconnection period"
                  :rules="[rules.required]"
                  required
                  type="number"
                ></v-text-field>
              </v-flex>
              <v-flex xs6>
                <v-switch
                  hint="Enable this to use in memory store instead of persistent store for QoS > 0 packets"
                  persistent-hint
                  label="In memory store"
                  v-model="editedValue.memoryStore"
                ></v-switch>
              </v-flex>
              <v-flex xs6>
                <v-switch
                  hint="If true the client does not have a persistent session and all information are lost when the client disconnects for any reason"
                  persistent-hint
                  label="Clean"
                  v-model="editedValue.clean"
                ></v-switch>
              </v-flex>
              <v-flex xs12>
                <v-switch
                  hint="Does this client require auth?"
                  persistent-hint
                  label="Auth"
                  v-model="editedValue.auth"
                ></v-switch>
              </v-flex>
              <v-flex v-if="editedValue.auth" xs12 sm6>
                <v-text-field
                  v-model="editedValue.username"
                  label="Username"
                  :rules="[requiredUser]"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex v-if="editedValue.auth" xs12 sm6>
                <v-text-field
                  v-model="editedValue.password"
                  label="Password"
                  :rules="[requiredPassword]"
                  required
                  :append-icon="e1 ? 'visibility' : 'visibility_off'"
                  @click:append="() => (e1 = !e1)"
                  :type="e1 ? 'password' : 'text'"
                ></v-text-field>
              </v-flex>
              <v-flex xs12>
                <v-combobox
                  v-model="editedValue.maps"
                  :items="maps"
                  label="Maps"
                  multiple
                  item-text="name"
                  item-value="_id"
                  chips
                  hint="Select the maps to use for incoming packets, if multiple maps of same client match the first one matched is used"
                  persistent-hint
                  :return-object="false"
                >
                  <template v-slot:selection="data">
                    <v-chip
                      :key="JSON.stringify(data.item)"
                      :selected="data.selected"
                      :disabled="data.disabled"
                      class="v-chip--select-multi"
                      close
                      @input="data.parent.selectItem(data.item)"
                    >
                      {{ getItem(data) }}
                    </v-chip>
                  </template>
                </v-combobox>
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

export default {
  props: {
    value: Boolean,
    title: String,
    editedValue: Object
  },
  watch: {
    value(val) {
      this.$refs.form.resetValidation();
    }
  },
  computed: {
    ...mapGetters(["maps"]),
    requiredUser() {
      return (
        (this.editedValue.auth && !!this.editedValue.username) ||
        "This field is required."
      );
    },
    requiredPassword() {
      return (
        (this.editedValue.auth && !!this.editedValue.password) ||
        "This field is required."
      );
    }
  },
  methods: {
    getItem(data) {
      var item = this.maps.find(m => m._id == data.item);
      return item ? item.name : data.item;
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
