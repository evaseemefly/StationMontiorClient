<template>
	<div class="date-range-menu">
		<div class="dt-range dt-range-start">
			<div class="title">起始</div>
			<div class="menu-item">
				<el-date-picker
					v-model="startDt"
					type="date"
					placeholder="选择日期"
					:format="dtFormat"
				>
				</el-date-picker>
			</div>
		</div>
		<div class="dt-range dt-range-end">
			<div class="title">结束</div>
			<div class="menu-item">
				<el-date-picker
					v-model="endDt"
					type="date"
					placeholder="选择日期"
					:format="dtFormat"
				>
				</el-date-picker>
			</div>
		</div>
		<div class="submit" @click="commitDtRange">查询</div>
	</div>
</template>
<script lang="ts">
import { MS_UNIT } from '@/const/unit'
import { GET_END_DT, GET_START_DT, SET_END_DT, SET_START_DT } from '@/store/types'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Mutation, Getter } from 'vuex-class'
@Component({})
export default class SubNavDateRangeMenuView extends Vue {
	startDt: Date = new Date()
	endDt: Date = new Date()
	dtFormat = 'MM-dd'

	/** 起止时间的限制(单位:毫秒) */
	limitDuration: number = 60 * 60 * 24 * 10 * MS_UNIT

	created() {
		// this.initDt()
	}

	mounted() {
		this.startDt = this.getStartDt
		this.endDt = this.getEndDt
	}

	/** 初始化当前起止时间为当前时间 */
	initDt() {
		// this.startDt = new Date('2024-02-20')
		// this.endDt = new Date('2024-02-22')
		// this.commitDtRange()
	}

	/** 提交选定时间
	 * TODO:[*] 24-06-26 起止四件不允许超过10天
	 */
	commitDtRange() {
		if (moment(this.endDt).valueOf() - moment(this.startDt).valueOf() > this.limitDuration) {
			this.$alert('传入的起止时间间隔不允许超过10天', '提示')
			return
		}
		this.setStartDt(this.startDt)
		this.setEndDt(this.endDt)
	}

	@Mutation(SET_START_DT, { namespace: 'common' })
	setStartDt: { (val: Date) }

	@Mutation(SET_END_DT, { namespace: 'common' })
	setEndDt: { (val: Date) }

	@Getter(GET_END_DT, { namespace: 'common' })
	getEndDt: Date

	@Getter(GET_START_DT, { namespace: 'common' })
	getStartDt: Date
}
</script>
<style scoped lang="less">
.date-range-menu {
	display: flex;
	align-content: center;
	align-items: center;
	.dt-range {
		height: 40px;
		margin: 5px;

		box-shadow: 3px 6px 10px 0px black;
		border-radius: 10px;
		display: flex;
		align-content: center;
		align-items: center;
		.title {
			padding: 10px;
			// background: #1abc9c;
			border-top-left-radius: 15px;
			border-bottom-left-radius: 15px;
		}
		.menu-item {
			background: orangered;
			width: 100px;
			height: 100%;
			overflow: hidden; // 防止 menu item 内部的日期组件溢出
		}
	}
	.submit {
		background: #3498db;
		height: 40px;
		margin: 5px;
		padding-left: 10px;
		padding-right: 10px;
		box-shadow: 3px 6px 10px 0px black;
		border-radius: 10px;
		display: flex;
		align-content: center;
		align-items: center;
		// padding: 10px;
	}
}

.dt-range-start {
	background: #1abc9c;
	.menu-item {
		border-top-left-radius: 15px;
		border-bottom-left-radius: 15px;
		box-shadow: -1px 1px 10px 0px black;
		.el-date-editor {
			width: 100px;
		}
	}
}
.dt-range-end {
	flex-direction: row-reverse;
	background: #eb9f11;
	.menu-item {
		border-top-right-radius: 15px;
		border-bottom-right-radius: 15px;
		box-shadow: -1px 1px 10px 0px black;
		.el-date-editor {
			width: 100px;
		}
	}
}
</style>
