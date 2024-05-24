declare module '*.vue' {
	import Vue from 'vue'
	export default Vue
}

// 声明animate.css的类型，否则引入animate.css会报错，提示找不到animate.css模块
declare module 'animate.css'
