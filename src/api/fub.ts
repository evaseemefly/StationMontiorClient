import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'
import { ObservationTypeEnum } from '@/enum/common'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/fub'

/**
 * 获取所有浮标站点的基础信息
 * @param params
 * @returns
 */
const loadAllFubsBaseInfo = (): Promise<
	AxiosResponse<
		{
			id: number
			name: string
			code: string
			lat: number
			lon: number
			sort: number
			fub_type: ObservationTypeEnum
			fub_kind: ObservationTypeEnum
		}[]
	>
> => {
	const url = `${host}${area}/all/info/`
	return axios.get(url, {
		headers: authHeader(),
	})
}

/**
 * @description 获取制定浮标的实况数据(整点)
 * @author evaseemefly
 * @date 2024/05/08
 * @param {string} codes
 * @param {number} startTs
 * @param {number} endTs
 * @returns {*}  {Promise<
 * 	AxiosResponse<
 * 		{
 * 			code: string
 * 			observation_list: {
 * 				station_code: string
 * 				element_type: ObservationTypeEnum
 * 				ts_list: number[]
 * 				val_list: number[]
 * 			}[]
 * 		}[]
 * 	>
 * >}
 */
const loadFubsRealdataPerclock = (
	codes: string[],
	startTs: number,
	endTs: number
): Promise<
	AxiosResponse<
		{
			code: string
			observation_list: {
				station_code: string
				element_type: ObservationTypeEnum
				ts_list: number[]
				val_list: number[]
			}[]
		}[]
	>
> => {
	const url = `${host}${area}/realtime/many/perclock/`
	return axios.get(url, {
		headers: authHeader(),
		params: {
			start_ts: startTs,
			end_ts: endTs,
			// station_codes: '' + codes,
			station_codes: codes,
		},
	})
}

export { loadAllFubsBaseInfo, loadFubsRealdataPerclock }
