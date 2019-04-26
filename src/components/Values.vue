/* eslint-disable */

<template>
  <v-container fluid>
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="values"
          :rows-per-page-items="[10, 20, {'text':'All','value':-1}]"
          class="elevation-0"
        >
          <template slot="items" slot-scope="props">
            <td>{{ getTopic(props.item.topicGet) }}</td>
            <td>{{ getTopic(props.item.topicSet) }}</td>
            <td>{{ getClient(props.item.client_id) }}</td>
            <td>{{ props.item.payload }}</td>
            <td>{{ props.item.qos }}</td>
            <td>{{ props.item.retain ? 'Yes' : 'No' }}</td>
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
    <v-btn fab bottom right dark fixed color="blue" @click.stop="dialogValue = true">
        <v-icon>add</v-icon>
    </v-btn>

    <DialogValues
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

import DialogValues from '@/components/dialogs/Value'

export default {
  name: "Settings",
  components:{
    DialogValues
  },
  computed: {
    dialogTitle () {
      return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
    },
    ...mapGetters(["values", "clients"])
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
        { text: "Topic GET", value: "topicGet" },
        { text: "Topic SET", value: "topicSet" },
        { text: "Client", value: "client_id" },
        { text: "Payload", value: "payload" },
        { text: "QoS", value: "qos" },
        { text: "Retain", value: "retain" },
        { text: "Actions", sortable: false }
      ],
      fab: false,
    };
  },
  methods: {
    showSnackbar(text) {
      this.$emit("showSnackbar", text);
    },
    getTopic(topic){
      return topic.from + " --> " + topic.to
    },
    getClient(id){
      var client = this.clients.find(c => c._id == id);
      return client ? client.name : "----"
    },
    editItem (item) {
      this.editedIndex = this.values.indexOf(item)
      this.editedValue = Object.assign({}, item)
      this.dialogValue = true
    },
    deleteItem (item) {
      const index = this.values.indexOf(item)
      confirm('Are you sure you want to delete this item?') && this.values.splice(index, 1)
    },
    cloneItem (item) {
      this.values.push(Object.assign({}, item))
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
        Object.assign(this.values[this.editedIndex], this.editedValue)
      } else {
        this.values.push(this.editedValue)
      }
      this.closeDialog()
    }
  }
};
</script>
