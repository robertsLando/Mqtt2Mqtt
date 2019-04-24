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
            <td>{{ props.item.wildecard }}</td>
            <td style="white-space:pre-wrap; word-wrap:break-word">{{ getMap(props.item.payloadMap) }}</td>
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
    <v-speed-dial light fab fixed bottom right v-model="fab">
      <template v-slot:activator>
        <v-btn slot="activator" color="blue darken-2" dark fab hover v-model="fab">
          <v-icon>add</v-icon>
          <v-icon>close</v-icon>
        </v-btn>
      </template>

      <v-btn fab dark small color="green" @click.stop="dialogValue = true">
        <v-icon>add_box</v-icon>
      </v-btn>

      <!-- <v-btn
        v-if="selected && selected.length > 0"
        fab
        dark
        small
        color="red"
        @click.stop="deleteSelected()"
      >
        <v-icon>delete</v-icon>
      </v-btn>

      <v-btn
        v-if="selected && selected.length > 0"
        fab
        dark
        small
        color="yellow"
        @click.stop="cloneSelected()"
      >
        <v-icon>content_copy</v-icon>
      </v-btn>-->
    </v-speed-dial>

    <DialogMap
      @save="saveValue"
      @close="closeDialog"
      v-model="dialogValue"
      :title="dialogTitle"
      :editedValue="editedValue"
    />
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

import DialogMap from '@/components/dialogs/Payload_map'
import uniqid from 'uniqid'


export default {
  name: "Settings",
  components:{
    DialogMap
  },
  computed: {
    dialogTitle () {
      return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
    },
    ...mapGetters(["maps"])
  },
  watch: {
    dialogValue (val) {
      val || this.closeDialog()
    }
  },
  data() {
    return {
      dialogValue: false,
      editedValue: {payloadMap: []},
      editedIndex: -1,
      defaultValue: {payloadMap: []},
      headers: [
        { text: "Name", value: "name" },
        { text: "Wildecard", value: "wildecard" },
        { text: "Payload Map", value: "payloadMap" },
        { text: "Actions", sortable: false }
      ],
      fab: false,
    };
  },
  methods: {
    showSnackbar(text) {
      this.$emit("showSnackbar", text);
    },
    getMap(payloadMap){
      var result = ""

      payloadMap.forEach(m => {
        result += m.from + ": " + m.to + '\n';
      });

      return result;
    },
    editItem (item) {
      this.editedIndex = this.maps.indexOf(item)
      this.editedValue = Object.assign({}, item)
      this.dialogValue = true
    },
    deleteItem (item) {
      const index = this.maps.indexOf(item)
      confirm('Are you sure you want to delete this item?') && this.maps.splice(index, 1)
    },
    cloneItem (item) {
      var copy = JSON.parse(JSON.stringify(item)); // need to deep copy 
      copy._id = uniqid();
      this.maps.push(copy)
    },
    closeDialog () {
      this.dialogValue = false
      setTimeout(() => {
        this.editedValue = Object.assign({}, this.defaultValue)
        this.editedIndex = -1
      }, 300)
    },
    saveValue () {
      if (this.editedIndex > -1) {
        Object.assign(this.maps[this.editedIndex], this.editedValue)
      } else {
        this.editedValue._id = uniqid(); //assign an unique id to the client
        this.maps.push(this.editedValue)
      }
      this.closeDialog()
    }
  }
};
</script>
