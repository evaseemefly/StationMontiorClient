<template>
	<div class="alert-level-row">
		<div class="row-icon" :class="getAlertColorStr"></div>
		<div class="row-title">{{ title | filterAlertTitle }}</div>
		<div class="row-text">{{ content }}</div>
	</div>
</template>
<script lang="ts">
import { AlertTideEnum } from '@/enum/surge'
import { filterAlertColorStr, filterAlertTitle } from '@/util/filter'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

/** 横向显示的警戒潮位行视图 */
@Component({ filters: { filterAlertTitle, filterAlertColorStr } })
export default class AlertLevelRowView extends Vue {
	/** 显示的标题-警戒潮位等级 */
	@Prop({ type: Number, default: '站点', required: true })
	title: AlertTideEnum

	@Prop({ type: Number, default: '站点', required: true })
	content: number

	get getAlertColorStr(): string {
		return filterAlertColorStr(this.title)
	}
}
</script>
<style scoped lang="less">
.alert-level-row {
	display: flex;
	margin: 10px;
	margin-top: 15px;
	margin-bottom: 15px;
	flex-wrap: nowrap;
	/* align-content: center; */
	align-items: center;
	justify-content: space-between;
	.row-icon {
		width: 10px;
		height: 10px;
		// margin: 5px;
		border-radius: 5px;
		box-shadow: 3px 4px 10px 0px black;
		// margin-left: 5px;
		// margin-right: 5px;
	}
	.row-title {
		font-size: 15px;
		// padding: 5px;
		// font-weight: 600;
	}
	.row-text {
		font-size: 15px;
		font-weight: 600;
		// padding: 5px;
	}
}
.red {
	background: red;
}
.green {
	background: green;
}
.yellow {
	background: yellow;
}
.orange {
	background: orange;
}
</style>
