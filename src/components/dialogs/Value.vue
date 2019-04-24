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
                <v-autocomplete
                  v-model="editedValue.client_id"
                  label="Client"
                  hint="The destination MQTT Client"
                  :rules="[required]"
                  persistent-hint
                  required
                  item-text="name"
                  item-value="_id"
                  :items="clients"
                ></v-autocomplete>
              </v-flex>

              <v-toolbar style="box-shadow:none" dark tabs color="transparent">
                <v-tabs v-model="tab" grow>
                  <v-tab>Get</v-tab>
                  <v-tab>Set</v-tab>
                </v-tabs>
              </v-toolbar>
              <v-flex xs12>
                <v-switch
                  v-model="topicEdited.customTopic"
                  persistent-hint
                  hint="Enable this to use a custom topic"
                  label="Custom topic"
                ></v-switch>
              </v-flex>
              <v-flex xs12 v-bind="{[`sm${topicEdited.customTopic ? 6 : 12}`]: true}">
                <v-text-field
                  v-model.trim="topicEdited.from"
                  label="Topic"
                  :append-outer-icon="topicEdited.customTopic ? 'arrow_right_alt' : ''"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex v-if="topicEdited.customTopic" xs12 sm6>
                <v-text-field
                  v-model.trim="topicEdited.to"
                  append-outer-icon="clear"
                  @click:append-outer="clearTopic"
                  label="Custom topic"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6>
                <v-select
                  v-model="topicEdited.retain"
                  label="Retain"
                  hint="The retain flag"
                  persistent-hint
                  required
                  :items="optionsRetain"
                ></v-select>
              </v-flex>
              <v-flex xs12 sm6>
                <v-select
                  v-model="topicEdited.qos"
                  label="QoS"
                  hint="Quality of service"
                  persistent-hint
                  required
                  :items="optionsQoS"
                ></v-select>
              </v-flex>
              <v-flex xs12 v-bind="{[`sm${topicEdited.payload == '3' ? 6 : 12}`]: true}">
                <v-select
                  v-model="topicEdited.payload"
                  label="Payload"
                  hint="Choose how to parse the payload"
                  persistent-hint
                  required
                  :items="optionsPayload"
                ></v-select>
              </v-flex>
              <v-flex v-if="topicEdited.payload == '3'" xs12 sm6>
                <v-autocomplete
                  v-model="topicEdited.map_id"
                  label="Payload map"
                  hint="Select the map function"
                  persistent-hint
                  required
                  item-text="name"
                  item-value="_id"
                  :items="maps"
                ></v-autocomplete>
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
      
      if (!this.editedValue.getOptions) {
        this.editedValue.getOptions = Object.assign({}, this.defaultOptions);
      }

      if (!this.editedValue.setOptions) {
        this.editedValue.setOptions = Object.assign({}, this.defaultOptions);
      }

      this.topicEdited = this.editedValue.getOptions;
    },
     tab(val){
      // topicEdited could be a computed property but for some reason isn't reacted on tab changes well
      this.topicEdited = val == 0 ? this.editedValue.getOptions : this.editedValue.setOptions;
    }
  },
  computed: {
    ...mapGetters(["clients", "maps"])
  },
  methods: {
    clearTopic(){
      this.$set(this.topicEdited, 'to', "");
    }
  },
  data() {
    return {
      valid: true,
      topicEdited: {},
      defaultOptions: { qos: -1, retain: 0, payload: 0, from: "", to: ""},
      tab: 0,
      tabs: ["Get", "Set"],
      optionsRetain: [
        { text: "Keep original", value: 0 },
        { text: "False", value: 1 },
        { text: "True", value: 2 }
      ],
      optionsQoS: [
        { text: "Keep original", value: -1 },
        { text: "0", value: 0 },
        { text: "1 (At least once)", value: 1 },
        { text: "2 (Exactly once)", value: 2 }
      ],
      optionsPayload: [
        { text: "Keep original", value: 0 },
        { text: "Value --> JSON", value: 1 },
        { text: "JSON --> Value", value: 2 },
        { text: "JSON --> JSON", value: 3 }
      ],
      customGet: false,
      customSet: false,
      required: v => !!v || "This field is required"
    };
  }
};
</script>
