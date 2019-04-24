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
                  v-model.trim="editedValue.name"
                  label="Name"
                  :rules="[required]"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12>
                <v-switch
                  v-model="editedValue.customW"
                  persistent-hint
                  hint="Enable this to use a custom wildecard"
                  label="Custom Wildecard"
                ></v-switch>
              </v-flex>
              <v-flex xs12 v-bind="{[`sm${editedValue.customW ? 6 : 12}`]: true}">
                <v-text-field
                  v-model.trim="editedValue.wFrom"
                  label="Wildecard From"
                  :append-outer-icon="editedValue.customW ? 'arrow_right_alt' : ''"
                  hint="If incoming packets match this wildecard this map is used. Ex: if '#/set', 'a/b/set' and 'c/d/f/e/set' are valid"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex v-if="editedValue.customW" xs12 sm6>
                <v-text-field
                  v-model.trim="editedValue.wTo"
                  label="Wildecard To"
                  append-outer-icon="clear"
                  @click:append-outer="clearWildecard"
                  hint="Map topics using this wildecard. Ex: '#/set' --> 'my/#/set' : 'c/d/f/e/set' --> my/c/d/f/e/set"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6>
                <v-select
                  v-model="editedValue.retain"
                  label="Retain"
                  hint="The retain flag"
                  :rules="[required]"
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
                  :rules="[required]"
                  persistent-hint
                  required
                  :items="optionsQoS"
                ></v-select>
              </v-flex>
              <v-flex xs12>
                <v-select
                  v-model="editedValue.payload"
                  label="Payload"
                  hint="Choose how to parse the payload"
                  persistent-hint
                  :rules="[required]"
                  required
                  :items="optionsPayload"
                ></v-select>
              </v-flex>
              <v-flex v-if="editedValue.payload == '1' || editedValue.payload == '2'" xs12>
                <v-text-field
                  v-model.trim="editedValue.payloadValue"
                  label="Value property"
                  hint="The payload property to use as value"
                  required
                ></v-text-field>
              </v-flex>
              <v-container v-if="editedValue.payload == '3'" fluid grid-list-xs pa-1>
                <v-subheader>Payload JSON</v-subheader>

                <v-layout v-for="(prop, index) in editedValue.payloadMap" :key="index" wrap>
                  <v-flex xs6>
                    <v-text-field
                      v-model.trim="prop.from"
                      label="From"
                      required
                      append-outer-icon="arrow_right_alt"
                    ></v-text-field>
                  </v-flex>
                  <v-flex xs6>
                    <v-text-field
                      v-model.trim="prop.to"
                      label="To"
                      required
                      append-outer-icon="clear"
                      @click:append-outer="removeProperty(index)"
                    ></v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout v-if="editedValue.payloadMap.length == 0" justify-center>
                  <p>Press '+' to add a property map</p>
                </v-layout>
                <v-layout justify-center>
                  <v-btn round @click.native.stop="addProperty()">
                    <v-icon>add</v-icon>
                  </v-btn>
                </v-layout>
              </v-container>
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
export default {
  props: {
    value: Boolean,
    title: String,
    editedValue: Object,
    optionsPayload: Array,
    optionsRetain: Array,
    optionsQoS: Array
  },
  watch: {
    value(val) {
      if (!this.editedValue.payloadMap) this.editedValue.payloadMap = [];
      this.$refs.form.resetValidation();
    }
  },
  data() {
    return {
      valid: true,
      required: v => !!v || v == 0 || "This field is required"
    };
  },
  methods: {
    addProperty() {
      this.editedValue.payloadMap.push({});
    },
    removeProperty(index) {
      this.editedValue.payloadMap.splice(index, 1);
    },
    clearWildecard() {
      this.$set(this.editedValue, "wTo", "");
    }
  }
};
</script>
