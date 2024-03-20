<template>
	<div id="station_list" v-loading="isLoading" element-loading-background="loadBackground">
		<div class="form-header">
			<h4>站点数量:</h4>
			<!-- <div class="primary-title"></div> -->
			<span>{{ getStationCount }}</span>
			<div class="thumb-btn" @click="setExpanded(false)">
				<i class="fa-solid fa-minus"></i>
			</div>
			<!-- <div class="desc"></div> -->
		</div>
		<section>
			<table>
				<thead>
					<tr>
						<th>站点名称</th>
						<th>增水极值</th>
						<th>时间</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(stationTemp, index) in stationSurgeMixList"
						:key="stationTemp.id"
						@click="commitStationExtremum(stationTemp, index)"
						:class="index == selectedTrIndex ? 'activate' : ' '"
					>
						<td>{{ stationTemp.stationName }}</td>
						<td>
							<!-- {{ stationTemp.surge }} -->
							<SurgeValuePrgressLineView
								:value="stationTemp.surge"
								:valMax="maxVal"
								:valMin="0"
								:realdata="stationTemp.surge"
								:lineWidth="84"
							></SurgeValuePrgressLineView>
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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import { DEFAULT_TY_NUM, NONE_STATION_NAME } from '@/const/default'
// 父类
// import x from './baseExpandView.vue'
// store
import {
	GET_SHOW_STATION_EXTREMUM_FORM,
	SET_SHOW_STATION_EXTREMUM_FORM,
	SET_STATION_CODE,
	SET_CURRENT_TY_FORECAST_DT,
	SET_COMPLEX_OPTS_CURRENT_STATION,
	SET_SHADE_NAV_TIME,
} from '@/store/types'
// api
import { loadStationExtremumDataList, loadStationNameDict } from '@/api/station'
// 接口
import { IHttpResponse } from '@/interface/common'
// 工具类
import { fortmatData2MDHM, filterSurgeAlarmColor, filterStationNameCh } from '@/util/filter'
// enum
import { IExpandEnum } from '@/enum/common'
// 其他组件
import SurgeValuePrgressLineView from '@/components/progress/surgeValueProgressView.vue'
import station from '@/store/modules/station'
import { MS_UNIT } from '@/const/unit'
import { StationBaseInfoMidModel } from '@/middle_model/station'
import { DistStationSurgeListMidModel } from '@/middle_model/surge'
/** 海洋站极值列表 */
@Component({
	filters: {
		fortmatData2MDHM,
		filterSurgeAlarmColor,
	},
	components: {
		SurgeValuePrgressLineView,
	},
})
export default class StationExtremumListView extends Vue {
	@Prop({ type: Boolean, default: false })
	isFinished: boolean

	@Prop({ type: String, default: '极值显示' })
	title

	/** 台风编号(str) */
	@Prop({ default: DEFAULT_TY_NUM, type: String, required: false })
	tyNum: string

	/** 海洋站数量 */
	stationCount = 0

	/** 总潮位集合 */
	@Prop({ default: [], type: Array })
	distStationTotalSurgeList: DistStationSurgeListMidModel[]

	/** 天文潮集合 */
	@Prop({ type: Array, default: [] })
	distStationAstronmictideList: DistStationSurgeListMidModel[]

	/** 页面加载时的背景颜色 */
	loadBackground = '#20262cd9'

	/** 海洋站极值集合
	 * TODO:[*] 24-03-20 注意一下 surge 是否正确
	 */
	stationSurgeMixList: {
		stationCode: string
		stationName: string
		/** 增水 */
		surge: number
		dt: Date
		/** 实况 */
		realdata: number
		/** 天文潮 */
		tide: number
		sort: number
	}[] = []

	/** 海洋站名称中英文对照字典
	 * 由 distStationBaseInfoList 替代
	 */
	@Prop({ type: Array, required: true, default: [] })
	stationNameDict: { name: string; chname: string; sort: number }[]

	/** 是否加载 */
	isLoading = false

	/** 当前选中的行序号 */
	selectedTrIndex = -1

	// isShow = true

	isExpanded = true

	setExpanded(val: boolean): void {
		this.isExpanded = val
		this.setShowExtremumForm(val)
	}

	@Watch('isFinished')
	onIsFinished(val: boolean): void {
		if (val) {
			this.loadStationExtremumList()
		}
	}

	/** +24-03-19 加载站点极值集合(包含增水，天文潮等信息) */
	loadStationExtremumList(): void {
		let stationSurgeMixList: {
			stationCode: string
			stationName: string
			/** 增水 */
			surge: number
			dt: Date
			/** 实况 */
			realdata: number
			/** 天文潮 */
			tide: number
			sort
		}[] = []

		for (let index = 0; index < this.distStationTotalSurgeList.length; index++) {
			const element = this.distStationTotalSurgeList[index]
			const filterAst = this.distStationAstronmictideList.filter(
				(x) => x.stationCode == element.stationCode
			)
			if (filterAst.length > 0) {
				const tempAst = filterAst[0]
				if (element.surgeList.length === tempAst.surgeList.length) {
					const tempSurge = element.surgeList[index]
					const tempTide = tempAst.surgeList[index]
					const tempStationDict = this.stationNameDict.find((x) => {
						return x.name == element.stationCode
					})
					const tempMixSurge = {
						stationCode: element.stationCode,
						stationName: tempStationDict.chname,
						surge: tempSurge - tempTide,
						realdata: tempSurge,
						tide: tempTide,
						dt: new Date(element.tsList[index] * MS_UNIT),
						sort: tempStationDict.sort,
					}
					stationSurgeMixList.push(tempMixSurge)
				}
			}
		}
		// 进行一次sort排序
		stationSurgeMixList = stationSurgeMixList.sort((a, b) => {
			return a.sort - b.sort
		})
		this.stationSurgeMixList = stationSurgeMixList
	}

	get getStationCount(): number {
		return this.stationSurgeMixList.length
	}

	get maxVal(): number {
		return Math.max(
			...this.stationSurgeMixList.map((temp) => {
				return temp.surge
			})
		)
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
		this.setStationCode(val.stationCode)
		this.setTyForecastDt(val.dt)
		this.setShadeTimebar(false)
		this.selectedTrIndex = index
		this.setStationComplexOpts({
			tyNum: this.tyNum,
			tyCode: this.tyNum,
			stationName: val.stationName,
			stationCode: val.stationCode,
		})
	}

	/** 提交给父级海洋站极值列表 */
	commitStationExtremumList(): void {
		this.$emit('submitStationExtremumList', this.stationSurgeMixList)
	}

	/** TODO:[*] 22-11-11 注意此方法与getIsShow  */
	@Watch('getShowForm')
	onGetShowForm(val: IExpandEnum): void {
		let isShow = false
		switch (val) {
			case IExpandEnum.UN_EXPANDED:
				isShow = false && this.isExpanded
				break
			case IExpandEnum.EXPANDED:
				// this.setExpanded(true)
				this.isExpanded = true
				isShow = true && this.isExpanded
				break
			case IExpandEnum.UN_SELECTED:
				isShow = this.getStationCount !== 0 && this.isExpanded
				break
		}
		this.isExpanded = isShow
	}

	/** 设置当前选中的 海洋站code */
	@Mutation(SET_STATION_CODE, { namespace: 'station' })
	setStationCode: { (val: string): void }

	/** 设置当前选中的 台风预报时刻 */
	@Mutation(SET_CURRENT_TY_FORECAST_DT, { namespace: 'typhoon' })
	setTyForecastDt: { (val: Date): void }

	@Mutation(SET_SHOW_STATION_EXTREMUM_FORM, { namespace: 'common' }) setShowExtremumForm

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
#station_list {
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
