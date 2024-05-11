
### **业务化海洋观测系统功能介绍**



目录:

[TOC]



本系统为业务化海洋观测系统

可提供沿海观测站点、浮标的的交互式预报可视化平台。

采用了自主化前端可视化平台 **oceanflow**  的部分组件 (*[本人为开源作者](https://github.com/evaseemefly)*)，本系统前端可视化部分已经开源([地址](https://github.com/evaseemefly/StationMontiorClient)）。

![001](/docs/imgs/icons/of_earth_bold.png)

本系统采用前后端分离技术，建立B/S架构的WebGIS可视化平台。

前端主要采用`开源WebGIS引擎`，`Vue`组件化框架，引入了`echarts`,`elementui`等前端开源组件，采用`Vue2.x` 与 `TypeScript`实现前端系统。

后端服务系统尝试采用全新的基于`starlette`与`pydantic`的`fastapi`框架提供数据发布服务(之前的系统后端采用`django`+`djang rest framework`作为主体框架)。
数据处理及定时任务分别采用了：`pandas+numpy+xarray`等基于python的主流程数据处理相关库；数据库ORM模型采用`sqlalchemy2.0`(以前的系统采用了1.4)；分布式作业系统`Celery`+`RabbitMQ`(消息队列)。

数据库采用`mysql`(关系型数据库)。



#### **本系统主要功能:**

1. 可提供各个站点实况的统计信息
2. 提供`增水极值`、`总潮位集合`等统计信息，为预报员预报提供`实况数据`的支持服务
3. 提供指定时间范围内的`站点实况`、`天文潮`、`增水`以及其他观测要素(风要素)的查询显示
4. 提供站点基础信息查看(`四色警戒潮位`及其他信息)

#### **本系统的优势：**

1. 风暴潮室自主研发；
2. 可针对风暴潮预报业务做有针对性的设计与修改，更加贴合预报实际；
3. 针对预报业务改善了操作流程；
4. 后台定时对实况观测资料进行自动持久化保存，并自动进行后续处理入库提取等相应操作；
5. 基于各观测资料提供多种统计分析功能;
6. 由于采用B/S架构，可以方便预报员在中心局域网范围内访问本系统，快速查看沿海观测站点实况结果.

#### **未来计划:**
- [ ]  1- 加入浮标观测数据
- [ ]  2- 加入风观测要素

#### **系统效果图及功能简述:**

- [ ]  系统示意图
  ![001](/docs/fd_imgs/001.png)

- [ ]  1 选择加载实况的起止时间
  ![002](/docs/fd_imgs/002.jpg)

- [ ]  2 指定时间范围内的所有站点(样例)的增水详情预览
  ![003](/docs/fd_imgs/003.png)

- [ ]  3 查看多个站点的实况增水详情(样例)及其他基础信息
  ![004](/docs/fd_imgs/004.png)
  - 24-04-10 加入了风要素的读取(整点)
  ![007](/docs/fd_imgs/007.png)
  ![008](/docs/fd_imgs/008.png)

  - 24-04-12 修复了缺省值造成的bug
  ![009](/docs/fd_imgs/009.png)
  ![010](/docs/fd_imgs/010.png)

- [ ]  4 系统总体截图
  ![005](/docs/fd_imgs/005.png)

- [ ]  5 浅色系背景
  ![005](/docs/fd_imgs/006.png)

- [ ] 6 加入浮标站位的显示
  ![011](/docs/fd_imgs/011.png)
  修改为动态要素显示，以及对矢量要素的显示支持
  ![013](/docs/fd_imgs/013.jpg)

#### 鸣谢:

*感谢风暴潮室的全体同事对本系统的大力支持。*