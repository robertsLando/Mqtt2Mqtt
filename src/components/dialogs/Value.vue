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

              <v-flex xs12>
                <v-switch
                  v-model="editedValue.customTopic"
                  persistent-hint
                  hint="Enable this to use a custom topic"
                  label="Custom topic"
                ></v-switch>
              </v-flex>
              <v-flex xs12 v-bind="{[`sm${editedValue.customTopic ? 6 : 12}`]: true}">
                <v-text-field
                  v-model.trim="editedValue.from"
                  label="Topic"
                  :append-outer-icon="editedValue.customTopic ? 'arrow_right_alt' : ''"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex v-if="editedValue.customTopic" xs12 sm6>
                <v-text-field
                  v-model.trim="editedValue.to"
                  append-outer-icon="clear"
                  @click:append-outer="clearTopic"
                  label="Custom topic"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6>
                <v-select
                  v-model="editedValue.retain"
                  label="Retain"
                  hint="The retain flag"
                  persistent-hint
                  required
                  :items="optionsRetain"
                ></v-select>
              </v-flex>
              <v-flex xs12 sm6>
                <v-select
                  v-model="editedValue.qos"
                  label="QoS"
                  hint="Quality of service"
                  persistent-hint
                  required
                  :items="optionsQoS"
                ></v-select>
              </v-flex>
              <v-flex xs12 sm6>
                <v-autocomplete
                  v-model="editedValue.map_id"
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
    }
  },
  computed: {
    ...mapGetters(["clients", "maps"])
  },
  methods: {
    clearTopic(){
      this.$set(this.editedValue, 'to', "");
    }
  },
  data() {
    return {
      valid: true,
      defaultOptions: { qos: -1, retain: 0, payload: 0, from: "", to: ""},
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
      required: v => !!v || "This field is required"
    };
  }
};
</script>
