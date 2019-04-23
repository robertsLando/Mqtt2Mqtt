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
                  required
                ></v-text-field>
              </v-flex>
              <v-container fluid grid-list-xs pa-1>
                <v-layout v-for="(prop, index) in editedValue.getMap" :key="index" wrap>
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
                <v-layout v-if="editedValue.getMap.length == 0" justify-center>
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
    editedValue: Object
  },
  watch: {
    value(val) {
      this.$refs.form.resetValidation();
    }
  },
  data() {
    return {
      valid: true,
      required: v => !!v || "This field is required"
    };
  },
  methods: {
    addProperty() {
      this.editedValue.payloadMap.push({});
    },
    removeProperty(index) {
      this.editedValue.payloadMap.splice(index, 1);
    }
  }
};
</script>
