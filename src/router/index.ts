import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RealdataHomeView from '../views/RealdataHomeView.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
	},
	{
		path: '/realdata',
		name: 'realdata',
		component: RealdataHomeView,
	},
]

const router = new VueRouter({
	mode: 'history',
	// @ts-ignore
	base: process.env.BASE_URL,
	routes,
})

export default router
