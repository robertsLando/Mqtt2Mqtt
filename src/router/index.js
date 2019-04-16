import Vue from 'vue'
import Router from 'vue-router'
import Settings from '@/components/Settings'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
      props: true
    }
  ]
})
