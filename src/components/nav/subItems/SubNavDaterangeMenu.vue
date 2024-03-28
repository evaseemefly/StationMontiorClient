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
import { SET_END_DT, SET_START_DT } from '@/store/types'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Mutation } from 'vuex-class'
@Component({})
export default class SubNavDateRangeMenuView extends Vue {
	startDt: Date = new Date()
	endDt: Date = new Date()
	dtFormat = 'MM-dd'

	commitDtRange() {
		this.setStartDt(this.startDt)
		this.setEndDt(this.endDt)
	}

	@Mutation(SET_START_DT, { namespace: 'common' })
	setStartDt: { (val: Date) }

	@Mutation(SET_END_DT, { namespace: 'common' })
	setEndDt: { (val: Date) }
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
