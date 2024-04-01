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
} from '../types'
import { DEFAULT_STATION_CODE } from '@/const/default'
interface IStation {
	stationCode: string
	isShowStationSurgeForm: boolean
	regionPid: number
	/** 海洋站基础信息集合 */
	stationBaseInfoList: StationBaseInfoMidModel[]
	/** 选中的海洋站codes */
	stationsCodes: string[]
}

const state: IStation = {
	stationCode: DEFAULT_STATION_CODE,
	isShowStationSurgeForm: false,
	regionPid: -1,
	/** 海洋站基础信息集合 */
	stationBaseInfoList: [],
	stationsCodes: [],
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
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
