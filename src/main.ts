import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'
// 注意引入 vue2-leaflet 需要在入口文件手动引入 leaflet.css!
import 'leaflet/dist/leaflet.css'
// elementui
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import VueInteract from 'vue-interact'
import 'vue-interact/dist/vue-interact.css'

// 配置 Animate.css
// import 'animate.css'
// TODO[*] 24-05-23  找不到模块“animate.css”或其相应的类型声明。
// 在 /src/shims-vue.d.ts 中加入 declare module 'animate.css'
// import animate from 'animate.css'
// import 'animate.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faHatWizard } from '@fortawesome/free-solid-svg-icons'

Vue.use(ElementUI)
Vue.use(VueInteract)
// Vue.use(animate)

new Vue({
	router,
	store,
	render: (h) => h(App),
}).$mount('#app')
