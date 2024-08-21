import axios, { AxiosResponse } from 'axios'
import { consulUrl } from './common'
import authHeader from './auth_header'

import { ITyphoonParams4Station } from '@/interface/station'
import { ObservationTypeEnum } from '@/enum/common'
import { ObserveElementEnum } from '@/enum/element'

// 后端的请求地址及端口
// export const host = host
axios.defaults.withCredentials = true

const area = '/station'

/**
 * 获取指定站点的过程增水集合
 * @param params
 * @returns
 */
const getConsulKV = (key: string) => {
	const url = `${consulUrl}`
	return axios.get(url, {
		headers: authHeader(),
		params: { key: key },
	})
}

export { getConsulKV }
