/* eslint-disable */

<template>
  <v-container fluid>
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="maps"
          :rows-per-page-items="[10, 20, {'text':'All','value':-1}]"
          class="elevation-0"
        >
          <template slot="items" slot-scope="props">
            <td>{{ props.item.name }}</td>
            <td>{{ props.item.wFrom + (props.item.customTopic ? ' ---> ' + props.item.wTo : '') }}</td>
            <td style="white-space:pre-wrap; word-wrap:break-word">{{ getMap(props.item) }}</td>
            <td>{{ props.item.qos }}</td>
            <td>{{ props.item.retain ? "Yes" : "No" }}</td>
            <td class="justify-center">
              <v-btn icon class="mx-0" @click="editItem(props.item)">
                <v-icon color="teal">edit</v-icon>
              </v-btn>
              <v-btn icon class="mx-0" @click="deleteItem(props.item)">
                <v-icon color="pink">delete</v-icon>
              </v-btn>
              <v-btn icon class="mx-0" @click="cloneItem(props.item)">
                <v-icon>content_copy</v-icon>
              </v-btn>
            </td>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

     <!--FAB-->
    <v-btn fab bottom right dark fixed color="blue" @click.stop="dialogValue = true">
        <v-icon>add</v-icon>
    </v-btn>

    <DialogMap
      @save="saveValue"
      @close="closeDialog"
      v-model="dialogValue"
      :title="dialogTitle"
      :editedValue="editedValue"
      :optionsPayload="optionsPayload"
      :optionsTime="optionsTime"
    />
    
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

import DialogMap from "@/components/dialogs/Payload_map";
import uniqid from "uniqid";

const defaultValue = { payloadMap: [] }

export default {
  name: "Settings",
  components: {
    DialogMap
  },
  computed: {
    dialogTitle() {
      return this.editedIndex === -1 ? "New Item" : "Edit Item";
    },
    ...mapGetters(["maps"])
  },
  watch: {
    dialogValue(val) {
      val || this.closeDialog();
    }
  },
  data() {
    return {
      dialogValue: false,
      editedValue: Object.assign({}, defaultValue),
      optionsPayload: [
        { text: "Keep original", value: 0 },
        { text: "Value --> JSON", value: 1 },
        { text: "JSON --> Value", value: 2 },
        { text: "JSON --> JSON", value: 3 }
      ],
      optionsTime: [
        { text: "Don't set", value: 0 },
        { text: "Use property", value: 1 },
        { text: "Add property", value: 2 }
      ],
      editedIndex: -1,
      headers: [
        { text: "Name", value: "name" },
        { text: "Wildecard", value: "wildecard" },
        { text: "Payload Map", value: "payloadMap" },
        { text: "QoS", value: "qos" },
        { text: "Retain", value: "retain" },
        { text: "Actions", sortable: false }
      ],
      fab: false
    };
  },
  methods: {
    showSnackbar(text) {
      this.$emit("showSnackbar", text);
    },
    getMap(item) {
      var tmp = this.optionsPayload.find(e => e.value == item.payload);
      var result = tmp ? tmp.text : '';

      switch (item.payload) {
        case 0:
          break;
        case 1:
          result += " (" + item.payloadValue + ")";
          break;
        case 2:
          result += " (" + item.payloadValue + ")";
          break;
        case 3:
          result += " \n";
          item.payloadMap.forEach(m => {
            result += m.from + ": " + m.to + "\n";
          });
          break;
        default:
          result = "Not defined";
          break;
      }

      return result;
    },
    editItem(item) {
      this.editedIndex = this.maps.indexOf(item);
      this.editedValue = Object.assign({}, item);
      this.dialogValue = true;
    },
    deleteItem(item) {
      const index = this.maps.indexOf(item);
      confirm("Are you sure you want to delete this item?") &&
        this.maps.splice(index, 1);
    },
    cloneItem(item) {
      var copy = JSON.parse(JSON.stringify(item)); // need to deep copy
      copy._id = uniqid();
      this.maps.push(copy);
    },
    closeDialog() {
      this.dialogValue = false;
      setTimeout(() => {
        this.editedValue = Object.assign({}, defaultValue);
        this.editedIndex = -1;
      }, 300);
    },
    saveValue() {
      if (this.editedIndex > -1) {
        Object.assign(this.maps[this.editedIndex], this.editedValue);
      } else {
        this.editedValue._id = uniqid(); //assign an unique id to the client
        this.maps.push(this.editedValue);
      }
      this.closeDialog();
    }
  }
};
</script>
