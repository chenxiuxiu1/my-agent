import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import History from '@/views/History.vue'
import Settings from '@/views/Settings.vue'
import NewsDetail from '@/views/NewsDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页', icon: 'home-o' }
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    meta: { title: '历史', icon: 'clock-o' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '设置', icon: 'setting-o' }
  },
  {
    path: '/news/:id',
    name: 'NewsDetail',
    component: NewsDetail,
    meta: { title: '新闻详情' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
