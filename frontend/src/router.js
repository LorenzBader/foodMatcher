import { createMemoryHistory, createRouter } from 'vue-router'

import Overview from './contentComponents/Overview.vue'
import Vote from './contentComponents/foodMatchin.vue'
import Collection from './contentComponents/foodCollection.vue'

const routes = [
  { path: '/', component: Overview },
  { path: '/vote', component: Vote },
  { path: '/collection', component: Collection }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router
