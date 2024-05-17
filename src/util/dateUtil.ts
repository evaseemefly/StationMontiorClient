/**
 * + 23-03-29
 * 处理时间的工具类
 */

import { MS_UNIT } from '@/const/unit'
import moment from 'moment'

/**
 * @description 获取 dt1-dt2 的 ms
 * @author evaseemefly
 * @date 2023/03/29
 * @param {Date} dt1
 * @param {Date} dt2
 * @returns {*}  {number}
 */
const getDateDiffMs = (dt1: Date, dt2: Date): number => {
	return dt1.getTime() - dt2.getTime()
}

/**
 * @description 将ts(单位:s)转换为date—— ts*MS_UNIT
 * @author evaseemefly
 * @date 2024/05/14
 * @param {number} ts 单位:s
 * @returns {*}  {Date}
 */
const getDate = (ts: number): Date => {
	return moment(ts * MS_UNIT).toDate()
}

export { getDateDiffMs, getDate }
