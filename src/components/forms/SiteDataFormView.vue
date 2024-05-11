<template>
	<!-- <transition
		enter-active-class="animate__animated animate__fadeIn"
		leave-active-class="animate__animated animate__fadeOut"
	> -->
	<div v-draggable id="station_surge_form" v-if="isShow" class="right-station-surge-form">
		<div class="my-detail-form">
			<div class="sub-titles">
				<div class="title-border">
					<div
						:class="[
							index == subTitleIndex
								? 'actived my-sub-title'
								: 'unactived my-sub-title',
							item.disabled ? 'disabled' : '',
						]"
						:key="index"
						@click="commitSite(item)"
						v-for="(item, index) in sites"
					>
						{{ item.code }}
					</div>
				</div>
				<div class="thumb-btn" @click="setExpanded(false)">
					<i class="fa-solid fa-minus"></i>
				</div>
				<!-- <div class="my-sub-title right" @click="setExpanded()">最小化</div> -->
			</div>
			<div class="detail-content">
				<FubDataChart :obsVals="obsVals"></FubDataChart>
			</div>
		</div>
	</div>
	<!-- </transition> -->
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'

import StationDataChart from '@/components/charts/StationDataChart.vue'
import FubDataChart from '@/components/charts/FubDataChart.vue'
import {
	GET_SHOW_STATION_SURGE_FORM,
	GET_STATIONS_CODES,
	SET_SHOW_STATION_SURGE_FORM,
} from '@/store/types'
import { DistStationSurgeListMidModel } from '@/middle_model/surge'
import { DEFAULT_STATION_CODE, DEFAULT_STATION_NAME } from '@/const/default'
import { AlertTideEnum } from '@/enum/surge'
import { DistStationWindListMidModel } from '@/middle_model/wind'
import { ObservationTypeEnum } from '@/enum/common'
import { ObserveElementMidModel, ObserveValueMidModel } from '@/middle_model/obs'
import { SiteBaseDigestMidModel } from '@/middle_model/site'
/** + 24-03-21 海洋站数据显示form 包含 tabs 以及 charts 组件 */
@Component({ components: { StationDataChart, FubDataChart } })
export default class SiteDataFormView extends Vue {
	/** 当前选中的站点 code */
	selectedCode: string = DEFAULT_STATION_CODE

	/** 是否加载完毕 */
	@Prop({ type: Boolean, default: false })
	isFinished: boolean

	isChildFinished = false

	/** 标题数组 */
	subTitles: { title: string; code: string }[] = []

	subTitleIndex = -1

	/** 副标题名称(当前选中的站点name) */
	subTitle = DEFAULT_STATION_NAME

	/** 当前选定站位的观测要素集合 */
	obsVals: ObserveElementMidModel[] = []

	/** 当前选定的站位 */
	selectedSite: SiteBaseDigestMidModel = null

	/** 当前 selectedCode 对应的数据集合 */
	stationMergeDataList: {
		/** 实况(总潮位) */
		realdataList: DistStationSurgeListMidModel
		/** 天文潮 */
		astronmictideList: DistStationSurgeListMidModel
		alertlevelList: {
			station_code: string
			alert_tide_list: number[]
			alert_level_list: number[]
		}
	} | null = null
	/** 不同站点的天文潮集合
	 * TODO:[*] 24-03-15 此处将数据类型修改为与distStationRealdataList一致
	 */
	@Prop({ type: Array, default: [] })
	distStationAstronmictideList: DistStationSurgeListMidModel[]

	/** 不同站点的总潮位集合 */
	@Prop({ type: Array, default: [] })
	distStationRealdataList: DistStationSurgeListMidModel[]

	/** 不同站点的风要素集合 */
	@Prop({ type: Array, default: [] })
	distStationWindRealdataList: DistStationWindListMidModel[]

	/** + 24-03-14 所有站点的警戒潮位集合 */
	@Prop({ type: Array, default: () => [] })
	distStationsAlertlevelList: {
		station_code: string
		alert_tide_list: number[]
		alert_level_list: number[]
	}[]

	@Prop({ type: Array, default: () => [] })
	allSiteRealdataList: ObserveValueMidModel[]

	/** 由RealdataHomeView 统一传递进本组件 */
	@Prop({ type: Array, default: [] })
	distStationNameDicts: { name: string; chname: string; sort: number }[]

	/** 展开显示form由  getIsShow 与 codes 数量共同决定*/
	get isShow(): boolean {
		return this.getIsShow && this.getCodes.length > 0
	}

	@Getter(GET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) getIsShow: boolean

	@Mutation(SET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) setShowStationForm: {
		(val: boolean): void
	}

	/** 实况数组 */
	realdataList: number[] = []
	/** 天文潮数组 */
	tideList: number[] = []
	/** 增水数组 */
	surgeList: number[] = []
	/** 对应时间戳数组 */
	tsList: number[] = []

	/** 风向集合 */
	wdList: number[] = []

	/** 风速集合 */
	wsList: number[] = []

	/** 当前code对应的警戒潮位集合 */
	alertlevelList: {
		tide: number
		alert: AlertTideEnum
	}[] = []

	/** TODO:[-] 24-05-09 控制显示不同种类的观测站点 station|fub (显示form有所不同) */
	obsType: ObservationTypeEnum = ObservationTypeEnum.STATION

	/** 设置当前选中的站点编号 */
	commitCode(code: string): void {
		this.selectedCode = code
		// const filterSubTitle=this.subTitles.filter(t => t.code===code)
		for (let index = 0; index < this.subTitles.length; index++) {
			const element = this.subTitles[index]
			if (element.code === code) {
				this.subTitleIndex = index
				this.subTitle = element.title
			}
		}
	}

	/** 选定当前站位 */
	commitSite(val: SiteBaseDigestMidModel): void {
		const siteRealdata = this.allSiteRealdataList.filter((t) => t.code === val.stationCode)
		this.selectedSite = val
		if (siteRealdata.length > 0) {
			this.obsVals = siteRealdata[0].obsVals
		}
	}

	@Getter(GET_STATIONS_CODES, { namespace: 'station' }) getCodes: string[]

	@Watch('getCodes')
	onCodes(val: string[]): void {
		this.subTitles = []
		for (var i = 0; i < val.length; i++) {
			const filterTemp = this.distStationNameDicts.filter((d) => d.name == val[i])
			if (filterTemp.length > 0) {
				this.subTitles.push({ title: filterTemp[0].chname, code: filterTemp[0].name })
			}
		}
		// TODO:[-] 24-04-01 重新加载code后，默认选中最后一个code
		const lastCode = val[val.length - 1]
		this.commitCode(lastCode)
	}

	/** 当前站点 */
	get sites(): SiteBaseDigestMidModel[] {
		let sites: SiteBaseDigestMidModel[] = []
		sites = this.allSiteRealdataList.map((s) => {
			return new SiteBaseDigestMidModel(s.code, s.obsType)
			// return { code: s.code, obsType: s.obsType }
		})
		return sites
	}

	/** 监听当前选中 code
	 * step1: distStationRealdataList
	 * step2: distStationsAlertlevelList
	 * step3: distStationsAlertlevelList 中过滤
	 * step4: 生成传递给子组件的 mergelist
	 */
	@Watch('selectedCode')
	onSelectedCode(code: string): void {
		this.isChildFinished = false
		this.clearAlertLevelList()
		// step1: 根据 code 过滤 警戒潮位，实况结果，天文潮结果
		const tempFilterAlertRes = this.distStationsAlertlevelList.filter(
			(temp) => temp.station_code == code
		)
		const tempFilterRealdataRes = this.distStationRealdataList.filter(
			(temp) => temp.stationCode == code
		)
		const tempFilterAstronmictideRes = this.distStationAstronmictideList.filter(
			(temp) => temp.stationCode == code
		)
		/** 当前code 对应的风要素集合 */
		const tempFilterWindRes = this.distStationWindRealdataList.filter(
			(temp) => temp.stationCode == code
		)

		// step2: 为天文潮与实况赋值
		this.realdataList =
			tempFilterRealdataRes.length > 0 ? tempFilterRealdataRes[0].surgeList : []
		this.tideList =
			tempFilterAstronmictideRes.length > 0 ? tempFilterAstronmictideRes[0].surgeList : []
		this.tsList = tempFilterAstronmictideRes[0].tsList.map((ts) => {
			return ts
		})
		this.surgeList = this.tideList.map((ele, index) => {
			return this.realdataList[index] == null ? null : this.realdataList[index] - ele
		})
		this.wdList = tempFilterWindRes.length > 0 ? tempFilterWindRes[0].wdList : []

		this.wsList = tempFilterWindRes.length > 0 ? tempFilterWindRes[0].wsList : []

		// step 3: 获取指定站点对应的警戒潮位
		if (tempFilterAlertRes.length > 0) {
			const filterAlers = tempFilterAlertRes[0]
			for (let index = 0; index < filterAlers.alert_level_list.length; index++) {
				const level = filterAlers.alert_level_list[index]
				const tide = filterAlers.alert_tide_list[index]
				this.alertlevelList.push({ tide: tide, alert: level })
			}
		}
		this.isChildFinished = true
	}

	setExpanded(val: boolean) {
		this.setShowStationForm(val)
	}

	/** 清空 this.alertlevellist */
	clearAlertLevelList(): void {
		this.alertlevelList = []
	}
}
</script>
<style scoped lang="less">
@import '../../styles/station/station-chart';
// + 21-12-06 加入重写的 emelemtnui 样式
@import '../../styles/my-elementui/common';
@import '../../styles/base-form.less';
.test {
	background: rgb(252, 182, 31);
	color: rgb(235, 232, 70);
}

#station_surge_form {
	bottom: 60px;
	left: 50px;
	// @form-base-background();
}
.detail-content {
	@form-base-background();
}
// TODO:[*] 24-03-26 新加入的tabs样式
.sub-titles {
	.title-border {
		display: flex;
		border-radius: 2px;
		box-shadow: 0 0 10px 0px black;
		@form-base-background();
	}
	.thumb-btn {
		@form-header-expand();
		top: 15px;
	}
}
</style>
