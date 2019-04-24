/* eslint-disable */

<template>
  <v-container fluid>
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="clients"
          :rows-per-page-items="[10, 20, {'text':'All','value':-1}]"
          class="elevation-0"
        >
          <template slot="items" slot-scope="props">
            <td>{{ props.item.name }}</td>
            <td>{{ props.item.host }}</td>
            <td>{{ props.item.port }}</td>
            <td>{{ props.item.reconnectPeriod }}</td>
            <td>{{ props.item.auth ? 'Required' : 'Not Required' }}</td>
            <td>{{ props.item.clean ? 'Yes' : 'No' }}</td>
            <td>{{ getMaps(props.item.mapsGet) }}</td>
            <td>{{ getMaps(props.item.mapsSet) }}</td>
            <td class="justify-center layout px-0">
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

    <DialogClient
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

import uniqid from 'uniqid'

import DialogClient from '@/components/dialogs/Mqtt_Client'

export default {
  name: "Settings",
  components:{
    DialogClient
  },
  computed: {
    dialogTitle () {
      return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
    },
    ...mapGetters(["clients", "maps"])
  },
  watch: {
    dialogValue (val) {
      val || this.closeDialog()
    }
  },
  data() {
    return {
      dialogValue: false,
      editedValue: {},
      editedIndex: -1,
      defaultValue: {},
      headers: [
        { text: "Name", value: "name" },
        { text: "Host", value: "host" },
        { text: "Port", value: "port" },
        { text: "Reconnect (ms)", value: "reconnectPeriod" },
        { text: "Auth", value: "auth" },
        { text: "Clean", value: "clean" },
        { text: "Maps GET", value: "mapsGet" },
        { text: "Maps SET", value: "mapsSet" },
        { text: "Actions", sortable: false }
      ],
      fab: false,
    };
  },
  methods: {
    showSnackbar(text) {
      this.$emit("showSnackbar", text);
    },
    getMaps(itemMaps){
      var result = ""
      if(!itemMaps){
        result = "Not defined"
      }
      else{
        var maps = this.maps
        itemMaps.forEach((id, i) => {
          var t = maps.find(e => e._id == id);
          result += (t ? t.name : id) + (i == itemMaps.length - 1 ? '' : ', ');
        });
      }
      return result;
    },
    editItem (item) {
      this.editedIndex = this.clients.indexOf(item)
      this.editedValue = Object.assign({}, item)
      this.dialogValue = true
    },
    deleteItem (item) {
      const index = this.clients.indexOf(item)
      confirm('Are you sure you want to delete this item?') && this.clients.splice(index, 1)
    },
    cloneItem (item) {
      var copy = Object.assign({}, item);
      copy._id = uniqid();
      this.clients.push(copy)
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
        Object.assign(this.clients[this.editedIndex], this.editedValue)
      } else {
        this.editedValue._id = uniqid(); //assign an unique id to the client
        this.clients.push(this.editedValue)
      }
      this.closeDialog()
    }
  }
};
</script>
