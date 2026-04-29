import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SearchResultsView from '../views/SearchResultsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
<<<<<<< HEAD
=======
  },
  {
    path: '/results',
    name: 'results',
    component: SearchResultsView
>>>>>>> LukasBranch
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
