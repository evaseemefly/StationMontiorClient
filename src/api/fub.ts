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

export { loadAllFubsBaseInfo }
