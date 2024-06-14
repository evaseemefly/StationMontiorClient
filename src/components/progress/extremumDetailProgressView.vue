<template>
	<div class="detail-progress-form">
		<div class="progress-header">{{ title }}</div>
		<div class="progress-line-part">
			<div class="process-line" :style="{ width: lineWidth + 'px' }" :class="[alertLevelStr]">
				{{ value | formatSurgeFixed2Str }}
			</div>
		</div>
		<div class="progress-footer">{{ footerText | fortmatData2MDHM }}</div>
	</div>
</template>
<script lang="ts">
import { AlertTideEnum } from '@/enum/surge'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { filterStationAlertTideVal, formatSurgeFixed2Str, fortmatData2MDHM } from '@/util/filter'

/** 极值详情进度栏 */
@Component({ filters: { filterStationAlertTideVal, fortmatData2MDHM, formatSurgeFixed2Str } })
export default class ExtremumDetailProgressView extends Vue {
	/** 显示的标题-增水极值等 */
	@Prop({ type: String, default: '站点', required: true })
	title: string

	/** 底部显示的-时间 */
	@Prop({ type: Date, default: '站点', required: true })
	footerText: Date

	/** progress的值 */
	@Prop({ type: Number, default: 0, required: true })
	value: number

	/** 警戒潮位集合 */
	@Prop({ type: Array, default: [] })
	alertTides: { code: string; alert: AlertTideEnum; tide: number }[]

	/** line宽度 */
	@Prop({ type: Number, default: 30 })
	lineWidth: number

	/** TODO:[*] 24-04-02 此部分在其他progress中也有
	 *  获取value 与 alertTides 超越且未超越下一级的 level  */
	get alertLevelStr(): string {
		let levelStr = 'green'
		/** 实况潮位 */
		let tide = this.value
		// TODO:[-] 22-12-06 注意此处可能存在警戒潮位为null的情况
		if (
			this.alertTides.filter((temp) => {
				return temp.tide === null
			}).length > 2
		) {
			levelStr = 'null-color'
		} else {
			for (let index = 0; index < this.alertTides.length; index++) {
				if (tide > this.alertTides[index].tide) {
					if (index < this.alertTides.length - 1) {
						if (tide < this.alertTides[index + 1].tide) {
							levelStr = AlertTideEnum[this.alertTides[index].alert].toLowerCase()
							break
						}
					} else {
						levelStr = AlertTideEnum[this.alertTides[index].alert].toLowerCase()
						break
					}
				}
			}
		}

		return levelStr
	}
}
</script>
<style scoped lang="less">
.detail-progress-form {
	display: flex;
	background: rgba(49, 59, 89, 0.733);
	border-radius: 5px;
	flex-direction: column;
	align-content: center;
	align-items: center;
	justify-content: center;
	margin-top: 5px;
	margin-bottom: 5px;
	.progress-header {
		font-size: 14px;
		margin: 5px;
	}
	.progress-line-part {
		margin: 5px;
	}
	.process-line {
		width: 100%;
		border-radius: 5px;
		font-size: 18px;
		font-weight: 600;
	}
	.progress-footer {
		font-size: 14px;
		margin: 5px;
	}
}
.null-color {
	background: rgba(49, 59, 89, 0.98);
}
</style>
