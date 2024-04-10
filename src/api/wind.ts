import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'

import { ITyphoonParams4Station } from '@/interface/station'
import { LayerTypeEnum } from '@/enum/map'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/wind'

/**
 * @description 获取所有站点的指定时间范围内的风要素实况集合
 * @author evaseemefly
 * @date 2024/04/10
 * @param {number} startTs
 * @param {number} endTs
 * @returns {*}  {Promise<AxiosResponse<{ station_code: string; surge_list: number[]; ts_list: number[] }[]>>}
 */
const loadDistStationWindRealdataList = (
	startTs: number,
	endTs: number
): Promise<
	AxiosResponse<
		{ station_code: string; ws_list: number[]; dir_list: number[]; ts_list: number[] }[]
	>
> => {
	const url = `${host}${area}/realtime/dist/dtrange/perclock/`
	return axios.get(url, {
		headers: authHeader(),
		params: { start_ts: startTs, end_ts: endTs },
	})
}

export { loadDistStationWindRealdataList }
