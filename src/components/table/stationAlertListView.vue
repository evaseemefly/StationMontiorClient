<template>
	<div id="station_alert_list" v-loading="!isLoading" element-loading-background="loadBackground">
		<div class="form-header">
			<h4>{{ title }}</h4>
			<!-- <div class="primary-title"></div> -->
			<span></span>

			<!-- <div class="desc"></div> -->
		</div>
		<section>
			<table>
				<thead>
					<tr>
						<th>站点名称</th>
						<th>总潮位极值</th>
						<th>时间</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(stationTemp, index) in stationExtremumMergeList"
						:key="stationTemp.id"
						@click="commitStationExtremum(stationTemp, index)"
						:class="index == selectedTrIndex ? 'activate' : ' '"
					>
						<td>{{ stationTemp.stationName }}</td>
						<td class="null-color">
							<TideValuePrgressLineView
								:realdata="stationTemp.surge"
								:lineWidth="84"
								:alertTides="stationTemp.alerts"
							></TideValuePrgressLineView>
						</td>
						<td>{{ stationTemp.dt | fortmatData2MDHM }}</td>
					</tr>
				</tbody>
			</table>
		</section>
		<div class="form-footer"></div>
	</div>
</template>
<script lang="ts">
import { List } from 'echarts'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
// 工具类
import { fortmatData2MDHM, filterSurgeAlarmColor, filterStationNameCh } from '@/util/filter'
// 其他组件
import TideValuePrgressLineView from '@/components/progress/tideValueProgressView.vue'
import { AlertTideEnum } from '@/enum/surge'
import {
	SET_COMPLEX_OPTS_CURRENT_STATION,
	SET_CURRENT_TY_FORECAST_DT,
	SET_SHADE_NAV_TIME,
	SET_STATION_CODE,
	PUSH_STATIONS_CODE,
	PUSH_SITE,
} from '@/store/types'
import { MS_UNIT } from '@/const/unit'
import { StationMaximumSurgeMideModel } from '@/middle_model/surge'
import { SiteBaseDigestMidModel } from '@/middle_model/site'
import { ObservationTypeEnum } from '@/enum/common'
import { DEFAULT_SITE_NAME } from '@/const/default'

/** 警戒潮位集合视图 */
@Component({
	filters: {
		fortmatData2MDHM,
		filterSurgeAlarmColor,
	},
	components: {
		TideValuePrgressLineView,
	},
})
export default class StationAlertListView extends Vue {
	/** 标题 */
	@Prop({ type: String, required: true, default: '极值列表' })
	title: string

	/** 需要获取的站点codes数组 */
	@Prop({ type: Array, required: false })
	stationCodes: string[]

	/** 总潮位极值集合 */
	@Prop({ default: [], type: Array })
	distStationsSurgeList: StationMaximumSurgeMideModel[]

	/** 警戒潮位集合 */
	@Prop({ type: Array, default: [], required: true })
	distStationsAlertlevelList: {
		station_code: string
		alert_tide_list: number[]
		alert_level_list: number[]
	}[]

	/** 海洋站名称中英文对照字典 */
	@Prop({ type: Array, required: true })
	stationNameDicts: { name: string; chname: string; sort: number }[]

	@Prop({ type: Boolean, default: false })
	isFinished: boolean

	/** v-for 此变量
	 * 站点极值集合(合并后)
	 */
	stationExtremumMergeList: {
		stationCode: string
		stationName: string
		surge: number
		dt: Date
		code: string
		name_en: string
		sort: number
		alerts: { code: string; alert: AlertTideEnum; tide: number }[]
	}[] = []

	/** 控制加载遮罩 */
	@Prop({ type: Boolean, default: false })
	isLoading: boolean

	/** 当前选中的行序号 */
	selectedTrIndex = -1

	/** 页面加载时的背景颜色 */
	loadBackground = '#20262cd9'

	/** 获取所有站点的极值最大值 */
	get maxVal(): number {
		return Math.max(
			...this.stationExtremumMergeList.map((temp) => {
				return temp.surge
			})
		)
	}

	/** 监听加载完毕
	 * 根据传入的总潮位集合(this.distStationsAlertlevelList)目前有监测的站点的集合，进行循环，拼接为 this.stationExtremumMergeList
	 */
	@Watch('isFinished')
	onIsFinished(val: boolean) {
		let stationExtremumMergeList = []
		if (val) {
			// step1: 根据传入的总潮位集合(目前有监测的站点的集合，进行循环，拼接为 stationExtremumMergeList)
			this.distStationsSurgeList.forEach((temp) => {
				/** 当前的站点code */
				const tempCode = temp.stationCode
				//根据code找到对应的警戒潮位
				const tempFilterAlert = this.distStationsAlertlevelList.filter((tempAlert) => {
					return tempAlert.station_code == tempCode
				})
				/** 
				 * 将 {
						station_code: string
						alert_tide_list: number[]
						alert_level_list: number[]
					}
					-> 
					alerts: { code: string; alert: AlertTideEnum; tide: number }[]
				 */
				/** 转换后的警戒等级与警戒潮位的对应关系: { code: string; alert: AlertTideEnum; tide: number }[] */
				let alerts: { code: string; alert: AlertTideEnum; tide: number }[] = []

				if (tempFilterAlert.length > 0) {
					const tempAlertMix = tempFilterAlert[0]
					for (let index = 0; index < tempAlertMix.alert_level_list.length; index++) {
						const tempAlertLevel = tempAlertMix.alert_level_list[index]
						const tempAlertTide = tempAlertMix.alert_tide_list[index]
						alerts.push({
							code: tempAlertMix.station_code,
							alert: tempAlertLevel,
							tide: tempAlertTide,
						})
					}
				}
				const tempStationDict = this.stationNameDicts.find((d) => d.name == tempCode)
				if (tempStationDict != null) {
					// TODO:[*] 24-09-9 加入了 try 语句块
					try {
						const tempStationExtremumMerge = {
							stationCode: tempCode,
							stationName:
								'chname' in tempStationDict
									? tempStationDict.chname
									: DEFAULT_SITE_NAME,
							surge: temp.surge,
							dt: new Date(temp.ts * MS_UNIT),
							code: tempCode,
							name_en: tempCode,
							alerts: alerts,
							sort: tempStationDict.sort,
						}
						stationExtremumMergeList.push(tempStationExtremumMerge)
					} catch (error) {
						console.warn(`当前${tempStationDict}字典有误`)
					}
				}
			})
		}
		// 进行一次sort排序
		stationExtremumMergeList = stationExtremumMergeList.sort((a, b) => {
			return a.sort - b.sort
		})
		this.stationExtremumMergeList = stationExtremumMergeList
	}

	/** 提交选中的 海洋站极值info */
	commitStationExtremum(
		val: {
			stationName: string
			stationCode: string
			surge: number
			dt: Date
		},
		index: number
	): void {
		// console.log(val)
		// this.setStationCode(val.stationCode)
		this.pushStationsCodes(val.stationCode)
		this.pushSite(new SiteBaseDigestMidModel(val.stationCode, ObservationTypeEnum.STATION))
		this.setTyForecastDt(val.dt)
		this.setShadeTimebar(false)
		this.selectedTrIndex = index
	}

	/** 添加当前code至 codes 中 */
	@Mutation(PUSH_STATIONS_CODE, { namespace: 'station' })
	pushStationsCodes: { (code: string): void }

	/** 添加当前 site */
	@Mutation(PUSH_SITE, { namespace: 'station' })
	pushSite: { (val: SiteBaseDigestMidModel): void }

	/** 设置当前选中的 海洋站code */
	@Mutation(SET_STATION_CODE, { namespace: 'station' })
	setStationCode: { (val: string): void }

	/** 设置当前选中的 台风预报时刻 */
	@Mutation(SET_CURRENT_TY_FORECAST_DT, { namespace: 'typhoon' })
	setTyForecastDt: { (val: Date): void }

	/** 设置当前海洋站复杂配置 */
	@Mutation(SET_COMPLEX_OPTS_CURRENT_STATION, { namespace: 'complex' })
	setStationComplexOpts: {
		(val: { tyNum: string; tyCode: string; stationName: string; stationCode: string }): void
	}

	/** 设置 遮罩 timebar */
	@Mutation(SET_SHADE_NAV_TIME, { namespace: 'common' }) setShadeTimebar
}
</script>
<style scoped lang="less">
@import url('../../styles/base-form.less');
#station_alert_list {
	margin: 5px;
	// 统一的 shadow 效果
	@form-base-shadow();
	// 统一的边角半圆过渡
	@form-base-radius();
	@form-base-background();
	// position: absolute;
	// top: 80px;
	// right: 450px;
	width: 300px;
	// height: 450px;
	// background-color: #20262cd9;
	z-index: 999;
	max-height: 600px;
	.form-header {
		display: flex;
		margin: 5px;
		align-items: center;
		h4 {
			color: white;
			font-size: 1.2rem;
			margin: 10px;
		}
		span {
			display: flex;
			align-items: center;
			color: white;
		}
		// +
		.thumb-btn {
			@form-header-expand();
		}
	}
	section {
		font-size: 13px;
		color: white;
		margin: 5px;
		max-height: 420px;
		overflow: auto;
		// height: 400px;
		// overflow: auto;
		table {
			width: 100%;
			tbody {
				max-height: 250px;
				// @typhoon-legend();
				tr:hover {
					background: #27ae60;
				}
				.activate {
					background: #9b59b6;
				}
			}
		}
	}
}
</style>
