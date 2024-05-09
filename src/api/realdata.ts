import axios, { AxiosResponse } from 'axios'
import { host } from './common'
import authHeader from './auth_header'
import { ObservationTypeEnum } from '@/enum/common'
import { loadFubsRealdataPerclock } from './fub'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/'

/**
 * 根据传入的codes以及obsType 获取对应站点的实况数据——整点
 * @param obsType
 * @param codes
 * @param startTs
 * @param endTs
 * @returns
 */
const loadSitesRealdataListPerclock = (
	obsType: ObservationTypeEnum,
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
	let func = loadFubsRealdataPerclock
	switch (obsType) {
		case ObservationTypeEnum.FUB:
			func = loadFubsRealdataPerclock
			break
		case ObservationTypeEnum.STATION:
			break
		default:
			break
	}
	return func(codes, startTs, endTs)
}

export { loadSitesRealdataListPerclock }
