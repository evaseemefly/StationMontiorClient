import { StationBaseInfoMidModel } from '@/middle_model/station'
import {
	SET_STATION_CODE,
	GET_STATION_CODE,
	SET_SHOW_STATION_SURGE_FORM,
	GET_SHOW_STATION_SURGE_FORM,
	SET_REGION_PID,
	GET_REGION_PID,
	SET_STATIONS_BASEINFO_LIST,
	GET_STATIONS_BASEINFO_LIST,
	SET_STATIONS_CODES,
	GET_STATIONS_CODES,
	PUSH_STATIONS_CODE,
	REMOVE_STATIONS_CODE,
	GET_OBSERVATION_TYPE,
	SET_OBSERVATION_TYPE,
	GET_SITE,
	SET_SITE,
	PUSH_SITE,
	REMOVE_SITE,
} from '../types'
import { DEFAULT_STATION_CODE } from '@/const/default'
import { StationIconLayerEnum } from '@/enum/map'
import { SiteBaseDigestMidModel } from '@/middle_model/site'

interface IStation {
	stationCode: string
	isShowStationSurgeForm: boolean
	regionPid: number
	/** 海洋站基础信息集合 */
	stationBaseInfoList: StationBaseInfoMidModel[]
	/** 选中的海洋站codes */
	stationsCodes: string[]
	/** 观测手段:StationIconLayerEnum FUB|STATION */
	observationType: StationIconLayerEnum
	/** 站点摘要信息集合(code,type) */
	siteBaseInfoList: SiteBaseDigestMidModel[]
}

/** 常量 */
const CONSTANT = {
	/** sites的限制长度:默认为8 */
	SITES_LIMIT_COUNT: 5,
}

const state: IStation = {
	stationCode: DEFAULT_STATION_CODE,
	isShowStationSurgeForm: false,
	regionPid: -1,
	/** 海洋站基础信息集合 */
	stationBaseInfoList: [],
	stationsCodes: [],
	/** 观测手段 */
	observationType: StationIconLayerEnum.ICON_STATION,
	/** 站点摘要信息集合(code,type) */
	siteBaseInfoList: [],
}
const getters = {
	[GET_STATION_CODE](state: IStation): string {
		return state.stationCode
	},
	[GET_SHOW_STATION_SURGE_FORM](state: IStation): boolean {
		return state.isShowStationSurgeForm
	},
	[GET_REGION_PID](state: IStation): number {
		return state.regionPid
	},
	[GET_STATIONS_BASEINFO_LIST](state: IStation): StationBaseInfoMidModel[] {
		return state.stationBaseInfoList
	},
	[GET_STATIONS_CODES](state: IStation): string[] {
		return state.stationsCodes
	},
	[GET_OBSERVATION_TYPE](state: IStation): StationIconLayerEnum {
		return state.observationType
	},
	[GET_SITE](state: IStation): SiteBaseDigestMidModel[] {
		const codes = state.siteBaseInfoList.map((c) => {
			return c.stationCode
		})
		console.log(`监听到vuex->station->siteBaseInfoList发生变化:[${codes}]`)
		return state.siteBaseInfoList
	},
}
// 使用dispatch调用
const actions = {}
// 使用commit调用
const mutations = {
	[SET_STATION_CODE](state: IStation, val: string): void {
		state.stationCode = val
	},
	[SET_SHOW_STATION_SURGE_FORM](state: IStation, val: boolean): void {
		state.isShowStationSurgeForm = val
	},
	[SET_REGION_PID](state: IStation, val: number): void {
		state.regionPid = val
	},
	[SET_STATIONS_BASEINFO_LIST](state: IStation, val: StationBaseInfoMidModel[]): void {
		state.stationBaseInfoList = val
	},
	[SET_STATIONS_CODES](state: IStation, val: string[]): void {
		state.stationsCodes = val
	},
	/** 向 codes中推送 code */
	[PUSH_STATIONS_CODE](state: IStation, val: string): void {
		// TODO:[-] 24-04-01 需要先检查是否存在指定code
		// state.stationsCodes = state.stationsCodes.filter((temp) => temp != val)
		if (state.stationsCodes.filter((temp) => temp == val).length == 0) {
			state.stationsCodes.push(val)
		}
	},
	/** 从 codes 中删除 code */
	[REMOVE_STATIONS_CODE](state: IStation, val: string): void {
		state.stationsCodes = state.stationsCodes.filter((temp) => temp != val)
	},
	[SET_OBSERVATION_TYPE](state: IStation, val: StationIconLayerEnum): void {
		state.observationType = val
	},
	/** 一次性设置 site 集合 */
	[SET_SITE](state: IStation, val: SiteBaseDigestMidModel[]): void {
		state.siteBaseInfoList = val
	},
	/** TODO:[*] 24-07-02 加入长度限制——若超出长度则先进先出剔除 */
	[PUSH_SITE](state: IStation, val: SiteBaseDigestMidModel): void {
		if (state.siteBaseInfoList.filter((s) => s.stationCode == val.stationCode).length == 0) {
			// TODO:[*] 24-07-02 加入对于队列的限制
			if (state.siteBaseInfoList.length > CONSTANT.SITES_LIMIT_COUNT) {
				// 删除头元素
				state.siteBaseInfoList.shift()
			}
			state.siteBaseInfoList.push(val)
		}
	},
	[REMOVE_SITE](state: IStation, val: SiteBaseDigestMidModel): void {
		state.siteBaseInfoList = state.siteBaseInfoList.filter(
			(temp) => temp.stationCode != val.stationCode
		)
	},
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
