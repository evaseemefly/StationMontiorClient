import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'

import { ITyphoonParams4Station } from '@/interface/station'
import { LayerTypeEnum } from '@/enum/map'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/station'

/**
 * 获取所有潮位站距离当前最近的潮值
 * @param now
 * @returns
 */
const loadSurgeListByRecently = (now: Date) => {
	const url = `${host}${area}/surge/list/recent`
	return axios.get(url, {
		headers: authHeader(),
		params: { now: now },
	})
}

/**
 * 获取指定 code 的站点的 >= start , <=end 时间范围的surge list
 * @param code
 * @param start
 * @param end
 * @returns
 */
const loadTargetStationSurgeRealdataList = (code: string, start: Date, end: Date) => {
	const url = `${host}${area}/surge/one/`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code, start_dt: start, end_dt: end },
	})
}

/**
 * 获取单站的天文潮位
 * @param code
 * @param start
 * @param end
 * @returns
 */
const loadTargetStationTideRealdataList = (code: string, start: Date, end: Date) => {
	const url = `${host}${area}/tide/one/`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code, start_dt: start, end_dt: end },
	})
}

/**
 * + 23-07-21 获取国内站点的天文潮集合
 * @param code
 * @param start
 * @param end
 * @returns
 */
const loadInLandAstronomictideList = (code: string, start: number, end: number) => {
	const url = `${host}${area}/surge/astronomictide/list`
	return axios.get(url, {
		headers: authHeader(),
		params: { station_code: code, start_ts: start, end_ts: end },
	})
}

/**
 * + 24-03-14 获取所有站点时间范围内的天文潮集合
 * @param start
 * @param end
 * @returns
 */
const loadDistAstronomictideList = (
	start: number,
	end: number
): Promise<
	AxiosResponse<{ station_code: string; forecast_ts_list: number[]; tide_list: number[] }[]>
> => {
	const url = `${host}${area}/astronomictide/dist/dtrang`
	return axios.get(url, {
		headers: authHeader(),
		params: { start_ts: start, end_ts: end },
	})
}

/**
 * 获取国内所有站点的 [start,end] issueTs 发布的总潮位集合
 * @param startTs
 * @param endTs
 * @param issueTs
 * @returns
 */
const loadInLandDistStationTotalSurgeList = (startTs: number, endTs: number, issueTs: number) => {
	const url = `${host}${area}/dist/stations/totalsurge`
	return axios.get(url, {
		headers: authHeader(),
		params: { start_ts: startTs, end_ts: endTs, issue_ts: issueTs },
	})
}

/**
 *  * + 24-03-13
 * 获取全部站点的实况极值(整点)集合
 * @param startTs
 * @param endTs
 * @returns
 */
const loadAllStationRealdataMaximumList = (
	startTs: number,
	endTs: number
): Promise<AxiosResponse<{ station_code: string; issue_ts: number; surge: number }[]>> => {
	/**
	 * 
	 * [
		{
			"station_code": "YAO",
			"issue_ts": 1708387200,
			"issue_dt": "2024-02-20T00:00:00",
			"surge": 263.0
		},
		{
			"station_code": "PTN",
			"issue_ts": 1708372800,
			"issue_dt": "2024-02-19T20:00:00",
			"surge": 537.0
		}
	]
	 */
	const url = `${host}${area}/realtime/all/dtrange/max/`
	return axios.get(url, {
		headers: authHeader(),
		params: { start_ts: startTs, end_ts: endTs },
	})
}

/**+ 24-03-19
 * 加载所有站点的指定时间范围内的极值集合 */
const loadDistStationRealdataExtremumList = (
	startTs: number,
	endTs: number
): Promise<AxiosResponse<{ station_code: string; issue_ts: number; surge: number }[]>> => {
	const url = `${host}${area}/realtime/dist/dtrange/extreme/maximum`
	return axios.get(url, {
		headers: authHeader(),
		params: { start_ts: startTs, end_ts: endTs },
	})
}
/**
 * + 24-03-15 获取所有站点实况集合
 * @param startTs
 * @param endTs
 * @returns
 */
const loadDistStationRealdataList = (
	startTs: number,
	endTs: number
): Promise<AxiosResponse<{ station_code: string; surge_list: number[]; ts_list: number[] }[]>> => {
	const url = `${host}${area}/realtime/dist/dtrange/perclock/`
	return axios.get(url, {
		headers: authHeader(),
		params: { start_ts: startTs, end_ts: endTs },
	})
}

export {
	loadSurgeListByRecently,
	loadTargetStationSurgeRealdataList,
	loadTargetStationTideRealdataList,
	loadInLandAstronomictideList,
	loadInLandDistStationTotalSurgeList,
	loadAllStationRealdataMaximumList,
	loadDistAstronomictideList,
	loadDistStationRealdataList,
	loadDistStationRealdataExtremumList,
}
