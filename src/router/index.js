import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Loading from '@/components/Loading'
import Game from '@/components/Game'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/loading',
      name: 'Loading',
      component: Loading
    },
    {
      path: '/',
      name: 'Game',
      component: Game
    },
  ]
})
