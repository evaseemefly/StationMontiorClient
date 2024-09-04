/**
 * 脉冲圆形icon
 *
 * @class IconCirlePulsing
 */

import * as L from 'leaflet'

import { IconTypeEnum, ObservationTypeEnum, StationIconShowTypeEnum } from '@/enum/common'
// 待实现的接口
import { IStationInfo, IStationIcon } from '@/interface/station'
import { IToHtml } from '@/interface/leaflet_icon'
// 中间 model
import { StationSurgeMidModel } from '@/middle_model/station'
// filter
import { filterSpiderStationStatusCls, filterStationNameCh } from '@/util/filter'
import { getDateDiffMs } from '@/util/dateUtil'
import { IIconImplement } from '@/interface/leaflet_icon'
import { FubBaseInfoMidModel } from './fub'
import { StationIconLayerEnum } from '@/enum/map'
import { SiteBaseInfoMidModel } from './site'
import { formatObservationTypeEnum2IconTypeEnum } from '@/util/format'

interface IIconPlusingOptions {
	val?: number
	min?: number
	max?: number
	radius?: number
	iconType: IconTypeEnum
	/**
	 * 实况时刻(utc)
	 */
	gmtRealTime?: Date
	/**
	 * 需要比对的当前时间(utc)
	 */
	gmtNow?: Date
}

const iconPlusingDefaultOptions = {
	min: 1,
	max: 10,
	radius: 20,
	iconType: IconTypeEnum.TY_PULSING_ICON,
}

/** @type {*} 圆形不带脉冲效果的icon */
const iconCircleDefaultOptions = {
	min: 1,
	max: 10,
	radius: 20,
	iconType: IconTypeEnum.DYNAMIC_CIRCLE_ICON,
}

/**
 * @description 圆形ico的抽象父类
 * @author evaseemefly
 * @date 2023/03/28
 * @abstract
 * @class AbsIconCirle
 */
abstract class AbsIconCirle {
	// radiusUnit:number=
	// x 与 y 的偏移量
	shiftX = 0
	shiftY = 0
	iconBorder = 3
	/**
	 * 当前 cirle 对应的 surge val
	 *
	 * @type {number}
	 * @memberof IconCirlePulsing
	 */
	val: number
	max: number
	min: number
	radius: number
	config: IIconPlusingOptions
	constructor(options: IIconPlusingOptions) {
		// Object.assign(this, { max: 10, min: 1, radius: 10 }, options)
		this.config = { ...iconCircleDefaultOptions, ...options }
	}

	/**
	 * @description 需要子类重写的 生成 html 的方法
	 * @author evaseemefly
	 * @date 2023/03/28
	 * @abstract
	 * @returns {*}  {string}
	 * @memberof AbsIconCirle
	 */
	abstract toHtml(): string

	/**
	 * 获取当前 surge 在 min - max 的百分位数
	 *
	 * @returns {number}
	 * @memberof IconCirlePulsing
	 */
	getRadius(): number {
		// TODO:[-] 22-05-16 此处存在可能的bug，对于 max 与 min 均为 0的情况 分母可能是0
		const defaultVal = 1
		const val =
			Math.abs(this.config.val - this.config.min) /
			Math.abs(this.config.max - this.config.min)
		return isNaN(val) ? defaultVal : val
	}

	getPlusingIconBorderAbsRadius(): number {
		// 半径的最大 px
		const radiusMaxVal = 16
		// 半径的最小 px
		// const radiusMinVal = 10
		const radiusMinVal = 8
		// 半径最大与最小的差值 px
		const radiusDiffVal = radiusMaxVal - radiusMinVal
		// 半径差值的绝对值
		const radiusDiffAbsVal = radiusDiffVal * this.getRadius()
		return radiusMinVal + radiusDiffAbsVal
	}

	getPlusingIconBorderRectangle(): number[] {
		const confficient = 1.5
		const width = confficient * this.getPlusingIconBorderAbsRadius()
		const height = confficient * this.getPlusingIconBorderAbsRadius()
		return [width, height]
	}

	/**
	 * + 21-06-02 获取当前的 surge 的 脉冲icon的绝对半径
	 *
	 * @returns {number}
	 * @memberof IconCirlePulsing
	 */
	getPlusingIconAbsRadius(): number {
		// 半径的最大 px
		const radiusMaxVal = 10
		// 半径的最小 px
		const radiusMinVal = 3
		// 半径最大与最小的差值 px
		const radiusDiffVal = radiusMaxVal - radiusMinVal
		// 半径差值的绝对值
		const radiusDiffAbsVal = radiusDiffVal * this.getRadius()
		return radiusMinVal + radiusDiffAbsVal
	}

	/**
	 * + 21-06-02 获取当前 surge 的 脉冲icon矩形的 width 与 height
	 *
	 * @returns {number[]}
	 * @memberof IconCirlePulsing
	 */
	getPlusingIconRectangle(): number[] {
		const confficient = 1.5
		const width = confficient * (this.getPlusingIconAbsRadius() + this.shiftX)
		const height = confficient * (this.getPlusingIconAbsRadius() + this.shiftY)
		return [width, height]
	}

	protected getAlarmColor(): string {
		// TODO:[-] 21-06-08 此处代码与 middle_model -> stations.ts -> IconFormMinStationSurgeMidModel -> getAlarmColor 重复
		const surge = this.config.val
		let colorStr = 'green'
		if (surge) {
			switch (true) {
				case surge === 0:
					colorStr = 'default'
					break
				case surge <= 100:
					colorStr = 'green'
					break
				case surge <= 150:
					colorStr = 'blue'
					break
				case surge <= 200:
					colorStr = 'yellow'
					break
				case surge <= 250:
					colorStr = 'orange'
					break
				case surge > 250:
					colorStr = 'red'
					break
			}
		}

		return colorStr
	}
}

/**
 * 实现方式1
 * 功能：根据传入的值，动态调整脉冲边缘的半径以及脉冲圆点的半径大小
 * 具体实现：
 * r=20px
 * math.abs(val-min)/math.abs(max-min) * r
 * @author evaseemefly
 * @class IconCirlePulsing
 */
class IconCirlePulsing extends AbsIconCirle {
	constructor(options: IIconPlusingOptions) {
		super(options)
		// Object.assign(this, { max: 10, min: 1, radius: 10 }, options)
		// this.config = { ...iconPlusingDefaultOptions, ...options }
	}
	toHtml(): string {
		const that = this
		// TODO:[-] 22-05-16 注意此处若为 海洋站静态位置 则 宽高都为 NaN
		// 海洋站icon的宽高
		const iconPulsingWidth = that.getPlusingIconRectangle()[0]
		const iconPulsingHeight = that.getPlusingIconRectangle()[1]
		// icon 的外侧脉冲的宽高
		const iconBorderWidth = that.getPlusingIconBorderRectangle()[0]
		const iconBorderHeight = that.getPlusingIconBorderRectangle()[1]
		// - 22-03-08 注意由于在 /styles/map/my-leaflet.less -> my-leaflet-icon-border 中对box-shadow 设置了3px的阴影宽度，但 box的border是不会向内挤占空间的
		const borderUnit = 3 / 2
		// 第一个div是外侧脉冲,第二个div是内部的icon
		// TODO:[*] 22-03-07 注意此处 my-leaflet-icon-border orange 会有一个 3px的border的距离，但外侧的border是不会影响内部的定位，所以不需要加入对该border边距的计算
		// 最终: 只需要平移 (-r/2,-r/2)
		const divHtml = `<div class="my-leaflet-pulsing-marker" >
              <div class="my-leaflet-icon-border ${this.getAlarmColor()}" style="width: ${iconBorderWidth}px;height:${iconBorderHeight}px;left:${
			-iconBorderWidth / 2
		}px;top:${-iconBorderHeight / 2}px"></div>
              <div class="my-leaflet-pulsing-icon ${this.getAlarmColor()}" style="width: ${iconPulsingWidth}px;height:${iconPulsingHeight}px;left:${
			-iconPulsingWidth / 2
		}px;top:${-iconPulsingHeight / 2}px"></div>
            </div>`
		return divHtml
	}
}

/**
 * @description 静态 cirle icon
 * @author evaseemefly
 * @date 2024/04/26
 * @class IconStaticsCirle
 * @implements {IIconImplement}
 */
class IconStaticsCirle implements IIconImplement {
	code: string
	name: string
	lat: number
	lon: number
	iconType: IconTypeEnum
	constructor(code: string, name: string, lat: number, lon: number, iconType: IconTypeEnum) {
		this.code = code
		this.name = name
		this.lat = lat
		this.lon = lon
		this.iconType = iconType
	}

	toHtml(): string {
		// 固定宽度 cirle icon 半径和高度为固定值
		const fixedRadius = 8
		// TODO:[*] 24-09-02 不需要在 addStaticsIcon2Map 方法中指定 className ，改为在此实体对象中动态生成 div 标签，并在标签中动态添加 class
		const divHtml = `<div class="my-leaflet-pulsing-marker" >              
              <div class="my-leaflet-pulsing-icon ${this.getClassName()}" style="width: ${fixedRadius}px;height:${fixedRadius}px;left:${
			-fixedRadius / 2
		}px;top:${-fixedRadius / 2}px"></div>
            </div>`
		return divHtml
	}

	/**
	 * @description TODO:[*] 24-09-02
	 * 由 this.iconType:IconTypeEnum 确定对应的中心填充颜色
	 * @author evaseemefly
	 * @date 2024/09/02
	 * @returns {*}  {string}
	 * @memberof IconStaticsCirle
	 */
	getAlarmColor(): string {
		const colorStr = '#000000'
		return colorStr
	}
	getClassName(): string {
		let defaultClassName = 'default_icon'
		switch (this.iconType) {
			case IconTypeEnum.STATION_STATICS_ICON:
				defaultClassName = 'station_static_inused'
				break
			case IconTypeEnum.STATION_STATICS_UNUSED_ICON:
				defaultClassName = 'station_static_unused'
				break
			case IconTypeEnum.FUB_ICON:
				defaultClassName = 'fub_static_inused'
				break
			default:
				break
		}
		return defaultClassName
		// throw new Error('Method not implemented.')
	}
}

/**
 * @description 动态(根据surge动态设置半径)圆形icon(不带脉冲效果)
 * copy 自 IconCirlePulsing
 * @author evaseemefly
 * @date 2023/03/28
 * @class IconCirle
 */
class DynamicIconCirle extends AbsIconCirle {
	constructor(options: IIconPlusingOptions) {
		super(options)
	}
	toHtml(): string {
		const that = this
		// TODO:[-] 22-05-16 注意此处若为 海洋站静态位置 则 宽高都为 NaN
		// 海洋站icon的宽高
		const iconPulsingWidth = that.getPlusingIconRectangle()[0]
		const iconPulsingHeight = that.getPlusingIconRectangle()[1]
		// - 22-03-08 注意由于在 /styles/map/my-leaflet.less -> my-leaflet-icon-border 中对box-shadow 设置了3px的阴影宽度，但 box的border是不会向内挤占空间的
		const borderUnit = 3 / 2
		// 第一个div是外侧脉冲,第二个div是内部的icon
		// TODO:[*] 22-03-07 注意此处 my-leaflet-icon-border orange 会有一个 3px的border的距离，但外侧的border是不会影响内部的定位，所以不需要加入对该border边距的计算
		// 最终: 只需要平移 (-r/2,-r/2)
		// TODO:[-] 23-03-28 只保留了圆形icon，去掉了脉冲div
		const divHtml = `<div class="my-leaflet-pulsing-marker station-status" >              
              <div class="my-leaflet-pulsing-icon ${this.getAlarmColor()}" style="width: ${iconPulsingWidth}px;height:${iconPulsingHeight}px;left:${
			-iconPulsingWidth / 2
		}px;top:${-iconPulsingHeight / 2}px"></div>
            </div>`
		return divHtml
	}

	/**
	 * @description 对于动态固定的 station surge 圆形icon 改为通过 最后更新时间与当前时间的差获取对应的color cls
	 * @author evaseemefly
	 * @date 2023/04/20
	 * @returns {*}  {string}
	 * @memberof DynamicIconCirle
	 */
	getAlarmColor(): string {
		return filterSpiderStationStatusCls(this.config.gmtRealTime, this.config.gmtNow)
	}
}

/**
 * @description 固定宽度(icon半径固定)圆形icon(且不带脉冲效果)
 * @author evaseemefly
 * @date 2023/03/29
 * @class FixedIconCirle
 * @extends {AbsIconCirle}
 */
class FixedIconCirle extends AbsIconCirle {
	constructor(options: IIconPlusingOptions) {
		super(options)
	}

	toHtml(): string {
		// 固定宽度 cirle icon 半径和高度为固定值
		const fixedRadius = 8
		const divHtml = `<div class="my-leaflet-pulsing-marker" >              
              <div class="my-leaflet-pulsing-icon ${this.getAlarmColor()}" style="width: ${fixedRadius}px;height:${fixedRadius}px;left:${
			-fixedRadius / 2
		}px;top:${-fixedRadius / 2}px"></div>
            </div>`
		return divHtml
	}

	/**
	 * @description 重写抽象父类中的实现方法——改为由当前的gmt_realtime 与 比对的时间计算时间差获取对应的状态color
	 * @author evaseemefly
	 * @date 2023/03/29
	 * @protected
	 * @returns {*}  {string}
	 * @memberof FixedIconCirle
	 */
	protected getAlarmColor(): string {
		// TODO:[-] 21-06-08 此处代码与 middle_model -> stations.ts -> IconFormMinStationSurgeMidModel -> getAlarmColor 重复

		return filterSpiderStationStatusCls(this.config.gmtRealTime, this.config.gmtNow)

		// return colorStr
	}
}

/**
 * @description 根据传入的 surge 生成对应的 cls
 * @author evaseemefly
 * @date 2023/07/13
 * @class FixedStationSurgeIcon
 * @extends {AbsIconCirle}
 */
class FixedStationSurgeIcon extends AbsIconCirle {
	constructor(options: IIconPlusingOptions) {
		super(options)
	}

	toHtml(): string {
		// 固定宽度 cirle icon 半径和高度为固定值
		const fixedRadius = 8
		const divHtml = `<div class="my-leaflet-pulsing-marker" >              
              <div class="my-leaflet-pulsing-icon ${this.getAlarmColor()}" style="width: ${fixedRadius}px;height:${fixedRadius}px;left:${
			-fixedRadius / 2
		}px;top:${-fixedRadius / 2}px"></div>
            </div>`
		return divHtml
	}

	/**
	 * @description 重写抽象父类中的实现方法——改为由当前的gmt_realtime 与 比对的时间计算时间差获取对应的状态color
	 * + 23-08-29 此处统一修改 根据增水等级统一分级
	 * @author evaseemefly
	 * @date 2023/03/29
	 * @protected
	 * @returns {*}  {string}
	 * @memberof FixedIconCirle
	 */
	protected getAlarmColor(): string {
		/** 增水值 */
		const surge = this.config.val
		let colorStr = 'green'

		switch (true) {
			// < 1h
			case surge <= 100:
				colorStr = 'green-icon'
				break
			// < 2h
			case surge <= 150:
				colorStr = 'blue'
				break
			// < 6h
			case surge <= 200:
				colorStr = 'yellow'
				break
			// < 24h
			case surge <= 250:
				colorStr = 'orange'
				break
			case surge > 250:
				colorStr = 'red'
				break
		}

		return colorStr
	}
}

/**
 * @description 台风脉冲圆 icon
 * @author evaseemefly
 * @date 2022/10/24
 * @class IconTyphoonCirlePulsing
 */
class IconTyphoonCirlePulsing {
	// radiusUnit:number=
	// x 与 y 的偏移量
	shiftX = 4
	shiftY = 4
	/**
	 * 当前 cirle 对应的 surge val
	 *
	 * @type {number}
	 * @memberof IconCirlePulsing
	 */
	val: number
	max: number
	min: number
	radius: number
	config: IIconPlusingOptions
	constructor(options: IIconPlusingOptions) {
		// Object.assign(this, { max: 10, min: 1, radius: 10 }, options)
		this.config = { ...iconPlusingDefaultOptions, ...options }
	}
	toHtml(): string {
		const that = this
		const iconBorderWidth = that.getPlusingIconRectangle()[0]
		const iconBorderHeight = that.getPlusingIconRectangle()[1]
		const iconPulsingWidth = that.getPlusingIconBorderRectangle()[0]
		const iconPulsingHeight = that.getPlusingIconBorderRectangle()[1]
		let divHtml = ''
		switch (true) {
			case this.config.iconType === IconTypeEnum.TY_PULSING_ICON:
				// - 22-03-07 暂时注释掉台风脉冲信号(带位置偏移)
				// divHtml = `<div class="my-leaflet-pulsing-marker" >
				//     <div class="my-leaflet-icon-border ${this.getAlarmColor()}" style="width: ${iconBorderWidth}px;height:${iconBorderHeight}px;left:${
				//     that.shiftX
				// }px;top:${that.shiftY}px"></div>
				//     <div class="my-leaflet-pulsing-icon ${this.getAlarmColor()}" style="width: ${iconPulsingWidth}px;height:${iconPulsingHeight}px;"></div>
				//   </div>`
				//---
				// TODO:[-] 22-03-07 注意此处的icon div 均需要 left:-width/2;top:-height/2
				divHtml = `<div class="my-leaflet-pulsing-marker" >
                      <div class="my-leaflet-icon-border ${this.getAlarmColor()}" style="width: ${iconBorderWidth}px;height:${iconBorderHeight}px;left:${
					-iconBorderWidth / 2
				}px;top:${-iconBorderHeight / 2}px"></div>
                      <div class="my-leaflet-pulsing-icon ${this.getAlarmColor()}" style="width: ${iconPulsingWidth}px;height:${iconPulsingHeight}px;left:${
					-iconPulsingWidth / 2
				}px;top:${-iconPulsingHeight / 2}px"></div>
                    </div>`
				//---
				//         divHtml = `<div class="my-leaflet-pulsing-marker" >
				//     <div class="my-leaflet-icon-border ${this.getAlarmColor()}" style="width: ${iconBorderWidth}px;height:${iconBorderHeight}px;"></div>
				//     <div class="my-leaflet-pulsing-icon ${this.getAlarmColor()}" style="width: ${iconPulsingWidth}px;height:${iconPulsingHeight}px;"></div>
				//   </div>`
				break
			case this.config.iconType === IconTypeEnum.TY_PATH_ICON:
				// 台风路径示意点
				const cirleUnit = 12
				const cirleRadius = `${cirleUnit}px`
				divHtml = `<div class="my-leaflet-pulsing-marker" >
                  <div class="my-leaflet-icon-border orange}" style="width:${cirleRadius};height:${cirleRadius};left:${
					-cirleUnit / 2
				}px;top:${-cirleUnit / 2}px"></div>
                  <div class="my-leaflet-pulsing-icon orange}" style="width: ${cirleRadius};height:${cirleRadius};left:${
					-cirleUnit / 2
				}px;top:${-cirleUnit / 2}px"></div>
                </div>`
				break
		}

		return divHtml
	}

	/**
	 * 获取当前 surge 在 min - max 的百分位数
	 *
	 * @returns {number}
	 * @memberof IconCirlePulsing
	 */
	getRadius(): number {
		const val =
			Math.abs(this.config.val - this.config.min) /
			Math.abs(this.config.max - this.config.min)
		return val
	}

	/**
	 * + 21-06-02 获取当前的 surge 的 脉冲icon的绝对半径
	 *
	 * @returns {number}
	 * @memberof IconCirlePulsing
	 */
	getPlusingIconAbsRadius(): number {
		// 半径的最大 px
		const radiusMaxVal = 10
		// 半径的最小 px
		const radiusMinVal = 6
		// 半径最大与最小的差值 px
		const radiusDiffVal = radiusMaxVal - radiusMinVal
		// 半径差值的绝对值
		const radiusDiffAbsVal = radiusDiffVal * this.getRadius()
		return radiusMinVal + radiusDiffAbsVal
	}

	/**
	 * + 21-06-02 获取当前 surge 的 脉冲icon矩形的 width 与 height
	 *
	 * @returns {number[]}
	 * @memberof IconCirlePulsing
	 */
	getPlusingIconRectangle(): number[] {
		const confficient = 1.8
		const width = confficient * (this.getPlusingIconAbsRadius() + this.shiftX)
		const height = confficient * (this.getPlusingIconAbsRadius() + this.shiftY)
		return [width, height]
	}

	getPlusingIconBorderAbsRadius(): number {
		// 半径的最大 px
		const radiusMaxVal = 16
		// 半径的最小 px
		// const radiusMinVal = 10
		const radiusMinVal = 8
		// 半径最大与最小的差值 px
		const radiusDiffVal = radiusMaxVal - radiusMinVal
		// 半径差值的绝对值
		const radiusDiffAbsVal = radiusDiffVal * this.getRadius()
		return radiusMinVal + radiusDiffAbsVal
	}

	getPlusingIconBorderRectangle(): number[] {
		const confficient = 1.5
		const width = confficient * this.getPlusingIconBorderAbsRadius()
		const height = confficient * this.getPlusingIconBorderAbsRadius()
		return [width, height]
	}

	private getAlarmColor(): string {
		// TODO:[-] 21-06-08 此处代码与 middle_model -> stations.ts -> IconFormMinStationSurgeMidModel -> getAlarmColor 重复
		const surge = this.config.val
		let colorStr = 'green'
		if (surge) {
			switch (true) {
				case surge <= 100:
					colorStr = 'green'
					break
				case surge <= 150:
					colorStr = 'blue'
					break
				case surge <= 200:
					colorStr = 'yellow'
					break
				case surge <= 250:
					colorStr = 'orange'
					break
				case surge > 250:
					colorStr = 'red'
					break
			}
		}

		return colorStr
	}
}

/**
 * 台风自定义 icon (图片)
 *
 * @class IconTyphoonCustom
 * @extends {IconTyphoonCirlePulsing}
 */
class IconTyphoonCustom extends IconTyphoonCirlePulsing {
	toHtml(): string {
		const that = this
		const iconBorderWidth = that.getPlusingIconRectangle()[0]
		const iconBorderHeight = that.getPlusingIconRectangle()[1]
		const iconPulsingWidth = that.getPlusingIconBorderRectangle()[0]
		const iconPulsingHeight = that.getPlusingIconBorderRectangle()[1]
		let divHtml = ''
		const cirleUnit = 12
		const cirleRadius = `${cirleUnit}px`
		divHtml = `<div class="my-leaflet-pulsing-marker" >
                  <div class="my-leaflet-custom-icon-border orange}" style="width:${cirleRadius};height:${cirleRadius};left:${
			-cirleUnit / 2
		}px;top:${-cirleUnit / 2}px"></div>
                  <div class="my-leaflet-custom-icon orange}" style="width: ${cirleRadius};height:${cirleRadius};left:${
			-cirleUnit / 2
		}px;top:${-cirleUnit / 2}px">
              <img>
              </div>
                </div>`

		return divHtml
	}
}

/**
 * 海洋站精简 icon form 精简信息框
 *
 * @class IconStationSurge
 */
class IconMinStationSurge {
	stationName: string
	surge: number
	productTypeStr: string
	constructor(name: string, surge: number, productTypeStr = '潮位') {
		this.stationName = name
		this.surge = surge
		this.productTypeStr = productTypeStr
	}
	toHtml(): string {
		const divHtml = `<div class="my-station-surge-div">
          <div class="station-min-div-title">${this.stationName}</div>
          <div class="station-min-div-content liner-default ">${this.productTypeStr}</div>
          <div class="station-min-div-content ${this.getAlarmColor()}">${
			this.surge !== 0 ? this.surge : '-'
		}</div>
        </div>`
		return divHtml
	}
	private getAlarmColor(): string {
		const surge = this.surge
		let colorStr = 'green'
		switch (true) {
			case surge === 0:
				colorStr = 'default'
				break
			case surge <= 100:
				colorStr = 'green'
				break
			case surge <= 150:
				colorStr = 'blue'
				break
			case surge <= 200:
				colorStr = 'yellow'
				break
			case surge <= 250:
				colorStr = 'orange'
				break
			case surge > 250:
				colorStr = 'red'
				break
		}
		return colorStr
	}
}

/**
 * 潮位站的详细 icon form 详情信息框
 *
 * @class IconDetailedStationSurge
 */
class IconDetailedStationSurge {
	stationName: string
	surge: number
	productTypeStr: string
	surgeMin: number
	surgeMax: number
	constructor(
		name: string,
		surge: number,
		surgeMin: number,
		surgeMax: number,
		productTypeStr = '潮位'
	) {
		this.stationName = name
		this.surge = surge
		this.surgeMin = surgeMin
		this.surgeMax = surgeMax
		this.productTypeStr = productTypeStr
	}
}

/**
 * @description 只有title的icon(一般为name)
 * 与 @/src/middle_model/station -> IconFormTitleStationSurgeMidModel 相似
 * @author evaseemefly
 * @date 2024/04/28
 * @class IconOnlyTitle
 * @implements {IToHtml}
 */
class IconOnlyTitle implements IToHtml {
	/** 中文名称 */
	name: string
	/** code */
	code: string
	constructor(name: string, code: string) {
		this.name = name
		this.code = code
	}
	toHtml(): string {
		const divHtml = `<div class="my-station-title-surge-div">
        <div class="station-title-div-title">${this.name}</div>
        </div>`
		return divHtml
	}
	getClassName(): string {
		return `station-surge-icon-onlytitle `
	}
	getStationCode(): string {
		return this.code
	}
}

/**
 * 根据台风等级获取对应的台风 icon url
 *
 * @param {string} tyType
 * @return {*}
 */
const getTyIconUrlByType = (tyType: string) => {
	let iconUrl = ''
	switch (true) {
		// 热带风暴
		case tyType === 'TS':
			iconUrl = '/static/icons/ty/ty_icon_green.svg'
			break
		// 强热带风暴
		case tyType === 'STS':
			iconUrl = '/static/icons/ty/ty_icon_blue.svg'
			break
		// 台风
		case tyType === 'TY':
			iconUrl = '/static/icons/ty/ty_icon_yellow.svg'
			break
		// 强台风
		case tyType === 'STY':
			iconUrl = '/static/icons/ty/ty_icon_orange.svg'
			break
		// 超强台风
		case tyType === 'SuperTY':
			iconUrl = '/static/icons/ty/ty_icon_red.svg'
			break
		default:
			iconUrl = '/static/icons/ty/ty_icon_green.svg'
			break
	}
	return iconUrl
}

/**
 * @description 根据 海洋站info集合 以 icon 的形式添加至 map,并返回 layergroup ids 集合
 * @author evaseemefly
 * @date 2022/10/25
 * @param {L.Map} mymap
 * @param {IStationInfo[]} stationList
 * @param {number} surgeMax
 * @param {{ name: string; chname: string }[]} stationNameDict 海洋站中英文对照字典
 * @param {(stationTemp: { code: string; name: string }) => void} callbackFunc 回调函数，用来触发 marker.onClick 事件
 * @returns {*}  {number[]}
 */
const addStationIcon2Map = (
	mymap: L.Map,
	stationList: IStationInfo[],
	surgeMax: number,
	stationNameDict: { name: string; chname: string }[],
	callbackFunc: (stationTemp: { code: string; name: string }) => void,
	iconType: IconTypeEnum = IconTypeEnum.TY_PULSING_ICON,
	stationIconShowType: StationIconShowTypeEnum = StationIconShowTypeEnum.SHOW_SURGE_VAL,
	now?: Date
): number[] => {
	const zoom = 7
	const self = this
	/** station status 海洋站状态icon集合 */
	const iconArr: AbsIconCirle[] = []
	const iconSurgeMinArr: IToHtml[] = []
	const stationArr: StationSurgeMidModel[] = []
	const layerItemsList: IStationIcon[] = []

	const pulsingMarkers: L.Marker[] = []
	/** 海洋站 station titles icons */
	const divMarkers: L.Marker[] = []

	// 获取极值
	stationList.forEach((temp) => {
		/** 海洋站 icon */
		// TODO:[-] 23-03-28 此处加入根据传入的 iconType 生成不同的 station icon 实现
		let icon: AbsIconCirle = null
		switch (iconType) {
			case IconTypeEnum.DYNAMIC_CIRCLE_ICON:
				icon = new DynamicIconCirle({
					val: temp.surge,
					max: surgeMax,
					min: 0,
					iconType: iconType,
					gmtRealTime: temp.gmt_realtime,
					gmtNow: now,
				})
				break
			// - 23-03-29 固定的圆形icon,需要传入gmt_realtime
			case IconTypeEnum.FIXED_CIRCLE_ICON:
				icon = new FixedIconCirle({
					val: temp.surge,
					max: surgeMax,
					min: 0,
					iconType: iconType,
					gmtRealTime: temp.gmt_realtime,
					gmtNow: now,
				})
				break
			// - 23-07-13
			case IconTypeEnum.FIXED_STATION_SURGE_ICON:
				icon = new FixedStationSurgeIcon({
					val: temp.surge,
					max: surgeMax,
					min: 0,
					iconType: iconType,
				})
				break
			case IconTypeEnum.TY_PULSING_ICON:
				icon = new IconCirlePulsing({
					val: temp.surge,
					max: surgeMax,
					min: 0,
					iconType: iconType,
				})
				break
			default:
				icon = new IconCirlePulsing({
					val: temp.surge,
					max: surgeMax,
					min: 0,
					iconType: iconType,
				})
				break
		}
		/** 当前站点英文名 */
		const stationNameEn = temp.name
		/** 当前站点中文名 */
		const stationNameCh =
			filterStationNameCh(stationNameEn, stationNameDict) !== undefined
				? filterStationNameCh(stationNameEn, stationNameDict)
				: temp.station_code
		// TODO:[*] 23-07-16 此处将 之前的 name=code => name=stationNameCh
		const tempStationSurge = new StationSurgeMidModel(
			stationNameCh,
			temp.station_code,
			'',
			'',
			new Date()
		)
		const iconSurgeMin = tempStationSurge.getImplements(zoom, {
			stationName: stationNameCh,
			stationCode: temp.station_code,
			surgeMax: surgeMax,
			surgeMin: 0,
			surgeVal: temp.surge,
			stationIconShowType: stationIconShowType,
			lastDt: temp.gmt_realtime,
			now: now,
		})
		iconArr.push(icon)
		iconSurgeMinArr.push(iconSurgeMin)
		stationArr.push(tempStationSurge)
	})
	let index = 0
	// 批量添加至 map 中
	iconArr.forEach((temp) => {
		const tempCode = stationArr[index].stationCode
		const tempStationName = stationArr[index].stationName
		const stationDivIcon = L.divIcon({
			className: `surge_pulsing_icon_default ${iconSurgeMinArr[index].getClassName()}`,
			html: temp.toHtml(),
			// 目前需要此部分，因为会造成 位置的位移
			// 坐标，[相对于原点的水平位置（左加右减），相对原点的垂直位置（上加下减）]
			// iconAnchor: [-20, 30]
		})
		iconSurgeMinArr.forEach((temp) => {}) // 2- 台站 station data form icon
		const stationSurgeMinDivICOn = L.divIcon({
			className: iconSurgeMinArr[index].getClassName(),
			html: iconSurgeMinArr[index].toHtml(),
			// 坐标，[相对于原点的水平位置（左加右减），相对原点的垂直位置（上加下减）]
			iconAnchor: [10, 30],
		})

		// TODO:[-] 22-10-23
		const stationCirlePulsingMakrer: L.Marker = L.marker(
			[stationList[index].lat, stationList[index].lon],
			{
				icon: stationDivIcon,
			}
		)
		pulsingMarkers.push(stationCirlePulsingMakrer)

		/** station title icon */
		const stationDivIconMarker: L.Marker = L.marker(
			[stationList[index].lat, stationList[index].lon],
			{
				icon: stationSurgeMinDivICOn,
				// @ts-ignore
				customData: { code: tempCode, name: tempStationName },
				riseOnHover: true, // 鼠标移入zindex升级
			}
		).on(
			'click',
			(e: {
				target: {
					options: {
						customData: { code: string; name: string }
					}
				}
			}) => {
				callbackFunc({
					code: e.target.options.customData.code,
					name: e.target.options.customData.name,
				})
			}
		)

		divMarkers.push(stationDivIconMarker)
		// const layerItem: IStationIcon = {
		// 	cirlePulsingId: stationCirlePulsingLayerId,
		// 	divIconId: stationDivIconLayerId,
		// 	code: tempCode,
		// 	name: tempStationName,
		// }
		// layerItemsList.push(layerItem)
		index++
	})
	// @ts-ignore
	const pulsingLayerGroupId: number = L.layerGroup(pulsingMarkers).addTo(mymap)._leaflet_id
	/** 海洋站 station status title icons */
	// @ts-ignore
	const divLayerGroupId: number = L.layerGroup(divMarkers).addTo(mymap)._leaflet_id
	return [pulsingLayerGroupId, divLayerGroupId]
}

/**
 * @description 添加指定 fub 集合至 map
 * @author evaseemefly
 * @date 2024/04/29
 * @param {L.Map} mymap
 * @param {FubBaseInfoMidModel[]} fubList
 * @param {(stationTemp: {
 * 		code: string
 * 		name: string
 * 		iconType: StationIconLayerEnum
 * 	}) => void} callbackFunc 回调函数，执行完add2map操作后统一执行
 */
const addFubsIcon2Map = (
	mymap: L.Map,
	fubList: FubBaseInfoMidModel[],
	callbackFunc: (stationTemp: { code: string; name: string; iconType: IconTypeEnum }) => void
): void => {
	const icons: IIconImplement[] = []
	for (const fub of fubList) {
		const tempIcon: IconStaticsCirle = new IconStaticsCirle(
			fub.stationCode,
			fub.stationName,
			fub.lat,
			fub.lon,
			IconTypeEnum.FUB_ICON
		)
		icons.push(tempIcon)
	}
	addStaticsIcon2Map(mymap, icons, StationIconLayerEnum.ICON_FUB, callbackFunc)
}

/** 添加静态站点( station|fub )至地图中
 * 并返回 group ids
 */
const addStaticSitesIcon2Map = (
	mymap: L.Map,
	sitesList: SiteBaseInfoMidModel[],
	callbackFunc: (stationTemp: { code: string; name: string; iconType: IconTypeEnum }) => void
): number[] => {
	const icons: IIconImplement[] = []
	for (const tempSite of sitesList) {
		let tempIconType: IconTypeEnum = IconTypeEnum.STATION_STATICS_ICON
		tempIconType = formatObservationTypeEnum2IconTypeEnum(
			tempSite.observationType,
			tempSite.isInUsed
		)
		const tempIcon: IconStaticsCirle = new IconStaticsCirle(
			tempSite.stationCode,
			tempSite.stationName,
			tempSite.lat,
			tempSite.lon,
			tempIconType
		)
		icons.push(tempIcon)
	}
	return addStaticsIcon2Map(mymap, icons, StationIconLayerEnum.ICON_FUB, callbackFunc)
}

/**
 * @description 将传入的 icon 实现集合添加至 map
 * 待测试
 * 	 * 大体逻辑步骤，需要添加的为静态icon
 * 一般流程为: 1 创建icon 对象，声明 className, html,
 * 			  2 根据创建的icon，创建marker，声明 lat,lon,icon,以及传入的 customdata
 * 			  3 创建 layerGroup 并将 marker 添加至 group 统一添加至 map
 * ****
 * 添加至的map由实参传入，icons为对应的实参传入
 * 此处存在一个问题，由于icons已经由实参传入时已经实现，对于icons的实现在父级调用时已经实现，此处应修改
 * 修改方法1:可以在本文件中加入添加不同类型的icon的一个修饰类 类似于 addStationIcon2Map 方法的用途
 * @author evaseemefly
 * @date 2024/04/25
 * @param {L.Map} mymap 添加至地图
 * @param {IIconImplement} icons icon实现类集合
 * @returns {*}  {number[]} icon layer groupid,title layer groupid
 */
const addStaticsIcon2Map = (
	mymap: L.Map,
	icons: IIconImplement[],
	iconType: StationIconLayerEnum,
	callbackFunc: (stationTemp: { code: string; name: string; iconType: IconTypeEnum }) => void
): number[] => {
	let groupLayersIds: number[] = []
	/**

	 *
	 *
	 */
	const iconArr: AbsIconCirle[] = []
	/** icon marker 集合 */
	const iconMarkers: L.Marker<L.DivIcon>[] = []

	/** title markers 集合 */
	const titleMarkers: L.Marker<L.DivIcon>[] = []
	// const iconType: StationIconLayerEnum = StationIconLayerEnum.ICON_FUB
	icons.forEach((temp) => {
		const tempCode = temp.code
		const tempStationName = temp.name
		const tempIconType = temp.iconType

		/** 当前icon的 class 样式名称 */
		let tempIconClsName = 'icon_static_default'

		switch (tempIconType) {
			case IconTypeEnum.STATION_STATICS_ICON:
				tempIconClsName = 'station_in_used'
				break
			case IconTypeEnum.STATION_STATICS_UNUSED_ICON:
				tempIconClsName = 'station_unused'
				break
			default:
				tempIconClsName = 'icon_static_default'
				break
		}

		/** divIcon实例,用来创建实例调用 togHtml 与 getClsName */
		const iconTitleOnly = new IconOnlyTitle(temp.name, temp.code)
		/** 只有标题的icon */
		const titleIcon: L.DivIcon = L.divIcon({
			className: `surge_pulsing_icon_default ${iconTitleOnly.getClassName()} ${tempIconClsName}`,
			html: iconTitleOnly.toHtml(),
			iconAnchor: [-20, 30],
		})

		/** 站点(fub) div icon实例 */
		// TODO:[*] 24-09-02 注意在 className 中不需要再加入 ${temp.getClassName()}—— 已经由 IconStaticsCirle.toHtml 中动态修改 div 标签及其中的 class !
		const stationDivIcon = L.divIcon({
			className: `surge_pulsing_icon_default  `,
			html: temp.toHtml(),
			// 目前需要此部分，因为会造成 位置的位移
			// 坐标，[相对于原点的水平位置（左加右减），相对原点的垂直位置（上加下减）]
			// iconAnchor: [-20, 30]
		})
		/** 站点(fub) div icon marker */
		const stationDivIconMarker: L.Marker<L.DivIcon> = L.marker([temp.lat, temp.lon], {
			icon: stationDivIcon,
			// @ts-ignore
			customData: { code: tempCode, name: tempStationName, iconType: tempIconType },
			riseOnHover: true, // 鼠标移入zindex升级
		}).on(
			'click',
			(e: {
				target: {
					options: {
						customData: { code: string; name: string; iconType: IconTypeEnum }
					}
				}
			}) => {
				callbackFunc({
					code: e.target.options.customData.code,
					name: e.target.options.customData.name,
					iconType: e.target.options.customData.iconType,
				})
			}
		)
		/** 只包含title的icon marker */
		const titleIconMarker: L.Marker<L.DivIcon> = L.marker([temp.lat, temp.lon], {
			icon: titleIcon,
			// @ts-ignore
			customData: { code: tempCode, name: tempStationName, iconType: tempIconType },
			riseOnHover: true,
		}).on(
			'click',
			(e: {
				target: {
					options: {
						customData: { code: string; name: string; iconType: IconTypeEnum }
					}
				}
			}) => {
				callbackFunc({
					code: e.target.options.customData.code,
					name: e.target.options.customData.name,
					iconType: e.target.options.customData.iconType,
				})
			}
		)

		iconMarkers.push(stationDivIconMarker)
		titleMarkers.push(titleIconMarker)
	})

	/** icon layer 群组 id */
	// @ts-ignore
	const iconLayerGroupId: number = L.layerGroup(iconMarkers).addTo(mymap)._leaflet_id

	/** title layer 群组 id */
	// @ts-ignore
	const titleLayerGroupId: number = L.layerGroup(titleMarkers).addTo(mymap)._leaflet_id

	/** icon layer groupid,title layer groupid */
	groupLayersIds = [iconLayerGroupId, titleLayerGroupId]
	return groupLayersIds
}

export {
	IconCirlePulsing,
	DynamicIconCirle,
	FixedIconCirle,
	IconMinStationSurge,
	IconDetailedStationSurge,
	IconTyphoonCirlePulsing,
	IconTyphoonCustom,
	FixedStationSurgeIcon,
	getTyIconUrlByType,
	addStationIcon2Map,
	addStaticsIcon2Map,
	addFubsIcon2Map,
	IconOnlyTitle,
	addStaticSitesIcon2Map,
}
