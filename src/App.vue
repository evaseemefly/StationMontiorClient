<template>
	<div id="app">
		<router-view></router-view>
	</div>
</template>
<script lang="ts">
import { SET_END_DT, SET_START_DT } from '@/store/types'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Mutation } from 'vuex-class'

@Component({})
export default class App extends Vue {
	created() {
		this.initDt()
	}

	/** 初始化当前起止时间为当前时间 */
	initDt() {
		// TODO:[*] 24-07-01 注意若使用 new Date('2024-02-20') 创建的时间为 2024-02-20 08:00 需要手动声明hh:mm
		// TODO:[*] 24-07-01 此处需要修改为当前时间,结束时间为+3days
		const nowDt = new Date()
		const nowTs = new Date().setHours(0, 0, 0, 0)
		const startDt = moment(nowTs).subtract(3, 'days').toDate()
		// TODO:[*] 24-08-20 对于截止时间要 day+1
		const endDt = moment(nowTs).add(1, 'days').toDate()
		this.commitDtRange(startDt, endDt)
	}

	/** 提交选定时间
	 * TODO:[*] 24-06-26 起止四件不允许超过10天
	 */
	commitDtRange(startDt: Date, endDt: Date) {
		this.setStartDt(startDt)
		this.setEndDt(endDt)
	}

	@Mutation(SET_START_DT, { namespace: 'common' })
	setStartDt: { (val: Date) }

	@Mutation(SET_END_DT, { namespace: 'common' })
	setEndDt: { (val: Date) }
}
</script>

<style lang="less" scoped>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	background: #87a2bd;
	display: flex;
	height: 100vh !important;
	min-height: 100vh !important;
	flex-direction: column;
	// TODO:[-] 22-10-17 win 系统中的浏览器会出现垂直和水平的滚动条
	width: 100%;
}
</style>
