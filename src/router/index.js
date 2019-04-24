import Vue from 'vue'
import Router from 'vue-router'
import MqttClients from '@/components/MqttClients'
import PayloadMaps from '@/components/PayloadMaps'
import Values from '@/components/Values'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Values',
      component: Values,
      props: true
    },
    {
      path: '/clients',
      name: 'MqttClients',
      component: MqttClients,
      props: true
    },
    {
      path: '/payload_maps',
      name: 'PayloadMaps',
      component: PayloadMaps,
      props: true
    }
  ]
})
