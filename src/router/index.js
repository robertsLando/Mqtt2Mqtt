import Vue from 'vue'
import Router from 'vue-router'
import MqttClients from '@/components/MqttClients'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/clients',
      name: 'MqttClients',
      component: MqttClients,
      props: true
    }
  ]
})
