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
                <v-switch
                  hint="Set the retain flag"
                  persistent-hint
                  label="Retain"
                  v-model="editedValue.retain"
                ></v-switch>
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
    editedValue: Object,
  },
  watch: {
    value(val) {
      this.$refs.form.resetValidation();
    }
  },
  computed: {
    ...mapGetters(["clients"])
  },
  data() {
    return {
      valid: true,
      required: v => !!v || "This field is required"
    };
  }
};
</script>
