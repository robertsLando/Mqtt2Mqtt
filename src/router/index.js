import Vue from 'vue'
import Router from 'vue-router'
import MqttClients from '@/components/MqttClients'
import Maps from '@/components/Maps'
import Values from '@/components/Values'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/values',
      name: 'Values',
      component: Values,
      props: true
    },
    {
      path: '/',
      name: 'MqttClients',
      component: MqttClients,
      props: true
    },
    {
      path: '/maps',
      name: 'Maps',
      component: Maps,
      props: true
    }
  ]
})
