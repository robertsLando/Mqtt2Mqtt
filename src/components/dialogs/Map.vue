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
              <v-flex xs6>
                <v-switch
                  v-model="editedValue.customTopic"
                  @change="customChanged"
                  persistent-hint
                  hint="Enable this to map topics using wildecards"
                  label="Custom Topic"
                ></v-switch>
              </v-flex>
              <v-flex v-if="editedValue.customTopic" xs6>
              <v-switch
                v-model="editedValue.useFunction"
                persistent-hint
                hint="Use a JS function to map topics and payloads"
                label="Use Function"
              ></v-switch>
            </v-flex>
              <v-flex xs12 v-bind="{[`sm${editedValue.customTopic && !editedValue.useFunction ? 6 : 12}`]: true}">
                <v-text-field
                  v-model.trim="editedValue.wFrom"
                  :rules="[validTopic]"
                  label="Wildecard From"
                  :append-outer-icon="editedValue.customTopic && !editedValue.useFunction ? 'arrow_right_alt' : ''"
                  hint="Catch incoming packets using this wildecard"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex v-if="editedValue.customTopic && !editedValue.useFunction" xs12 sm6>
                <v-text-field
                  v-model.trim="editedValue.wTo"
                  :rules="[validTopic]"
                  label="Wildecard To"
                  append-outer-icon="clear"
                  @click:append-outer="clearWildecard"
                  hint="Map packets topics using this wildecard. Ex: 'prefix/#' --> 'prefix2/#' : 'prefix/c/d/f/e' --> prefix2/c/d/f/e"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex v-if="editedValue.customTopic && !editedValue.useFunction" xs12 sm6>
                <v-text-field
                  v-model.trim="editedValue.suffixFrom"
                  :rules="[validSuffix]"
                  label="From suffix"
                  hint="Checks that incoming packets topic have this suffix. If not packet is ignored. Used because prefix/#/suffix wildecards are not allowed"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex v-if="editedValue.customTopic && !editedValue.useFunction" xs12 sm6>
                <v-text-field
                  v-model.trim="editedValue.suffixTo"
                  :rules="[validSuffix]"
                  label="To suffix"
                  hint="Adds the current suffix to outgoing packets. Used because prefix/#/suffix wildecards are not allowed"
                  required
                ></v-text-field>
              </v-flex>
              <v-flex xs12 sm6>
                <v-switch
                  v-model="editedValue.retain"
                  label="Retain"
                  hint="The retain flag"
                  persistent-hint
                  required
                ></v-switch>
              </v-flex>
              <v-flex xs12 sm6>
                <v-select
                  v-model="editedValue.qos"
                  label="QoS"
                  hint="Quality of service"
                  :rules="[required]"
                  persistent-hint
                  required
                  :items="[0,1,2]"
                ></v-select>
              </v-flex>
              <v-flex v-if="!editedValue.useFunction" xs12>
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
              <v-flex v-if="!editedValue.useFunction && (editedValue.payload == '1' || editedValue.payload == '2')" xs12>
                <v-text-field
                  v-model.trim="editedValue.payloadValue"
                  label="Value property"
                  hint="The payload property to use as value"
                  required
                ></v-text-field>
              </v-flex>
              <v-container v-if="!editedValue.useFunction && editedValue.payload == '3'" fluid grid-list-xs pa-1>
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
              <v-flex v-if="!editedValue.useFunction && (editedValue.payload == '1' || editedValue.payload == '3')" xs12 sm6>
                <v-switch
                  v-model="editedValue.addTime"
                  label="Add timestamp"
                  hint="Enable this flag to add a timestamp property"
                  persistent-hint
                ></v-switch>
              </v-flex>
              <v-flex v-if="!editedValue.useFunction && editedValue.addTime" xs12 sm6>
                <v-text-field
                  v-model.trim="editedValue.timeValue"
                  label="Time property"
                  hint="The payload property to use as time"
                  required
                ></v-text-field>
              </v-flex>
            </v-layout>
            <v-container v-if="editedValue.customTopic && editedValue.useFunction">
              <br>
              <p>Write the function here. Args are <code>topic</code> and <code>payload</code>. The function must return a json <code>{topic : "mappedTopic", payload: "mappedPayload"}</code>. <b>Attention:</b> both payload and topic must be type of <code>string</code></p>
              <prism-editor :lineNumbers="true" v-model="editedValue.code" language="js" style="height:250px"></prism-editor>
            </v-container>
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

import "prismjs"
import "prismjs/themes/prism-tomorrow.css"
//vue-prism-editor dependency
import "vue-prism-editor/dist/VuePrismEditor.css"

import PrismEditor from "vue-prism-editor";

export default {
  components: {
    PrismEditor
  },
  props: {
    value: Boolean,
    title: String,
    editedValue: Object,
    optionsPayload: Array
  },
  watch: {
    value(val) {
      if (!this.editedValue.payloadMap) this.editedValue.payloadMap = [];
      if(!this.editedValue.code) this.editedValue.code = 'return {topic: topic, payload: payload}'
      this.$refs.form.resetValidation();
    }
  },
  data() {
    return {
      valid: true,
      required: v => !!v || v == 0 || "This field is required",
      validSuffix: v => !v || v[0] != "/" || "Suffix cannot start with / char",
      validTopic: topic => {
        // https://github.com/mqttjs/MQTT.js/blob/master/lib/validations.js#L12
        var parts = topic ? topic.split("/") : [];
        var res = true;

        for (var i = 0; i < parts.length; i++) {
          if (parts[i] === "+") {
            continue;
          }

          if (parts[i] === "#") {
            // for Rule #2
            res = i === parts.length - 1 || "# char must be placed at the end";
            break;
          }

          if (parts[i].indexOf("+") !== -1 || parts[i].indexOf("#") !== -1) {
            res =
              "Chars + and # are wildecards and cannot be used as chars in topic level names";
            break;
          }
        }

        return res;
      }
    };
  },
  methods: {
    customChanged(){
      if(!this.editedValue.customTopic) this.editedValue.useFunction = false;
    },
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
