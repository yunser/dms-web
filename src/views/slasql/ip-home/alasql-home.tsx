import { Button, Col, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './alasql-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
import alasql from 'alasql'
// import { saveAs } from 'file-saver'
import { read, writeFileXLSX, utils } from "xlsx";

const example = [
    {
      "community_name": "南郎家园社区居委会",
      "community_key": "110105001024",
      "street_key": "110105001000"
    },
    {
      "community_name": "北郎家园社区居委会",
      "community_key": "110105001025",
      "street_key": "110105001000"
    },
    {
      "community_name": "永安里社区居委会",
      "community_key": "110105001026",
      "street_key": "110105001000"
    },
    {
      "community_name": "光华里社区居委会",
      "community_key": "110105001027",
      "street_key": "110105001000"
    },
    {
      "community_name": "建国里社区居委会",
      "community_key": "110105001028",
      "street_key": "110105001000"
    },
    {
      "community_name": "秀水社区居委会",
      "community_key": "110105001029",
      "street_key": "110105001000"
    },
    {
      "community_name": "北郎东社区居委会",
      "community_key": "110105001033",
      "street_key": "110105001000"
    },
    {
      "community_name": "永安里东社区居委会",
      "community_key": "110105001034",
      "street_key": "110105001000"
    },
    {
      "community_name": "大北家园社区居民委员会",
      "community_key": "110105001035",
      "street_key": "110105001000"
    },
    {
      "community_name": "体东社区居委会",
      "community_key": "110105002024",
      "street_key": "110105002000"
    },
    {
      "community_name": "吉庆里社区居委会",
      "community_key": "110105002025",
      "street_key": "110105002000"
    },
    {
      "community_name": "吉祥里社区居委会",
      "community_key": "110105002026",
      "street_key": "110105002000"
    },
    {
      "community_name": "三丰里社区居委会",
      "community_key": "110105002027",
      "street_key": "110105002000"
    },
    {
      "community_name": "雅宝里社区居委会",
      "community_key": "110105002028",
      "street_key": "110105002000"
    },
    {
      "community_name": "天福园社区居委会",
      "community_key": "110105002029",
      "street_key": "110105002000"
    },
    {
      "community_name": "芳草地社区居委会",
      "community_key": "110105002030",
      "street_key": "110105002000"
    },
    {
      "community_name": "金台里社区居委会",
      "community_key": "110105003041",
      "street_key": "110105003000"
    },
    {
      "community_name": "小庄社区居委会",
      "community_key": "110105003042",
      "street_key": "110105003000"
    },
    {
      "community_name": "关东店北街社区居委会",
      "community_key": "110105003045",
      "street_key": "110105003000"
    },
    {
      "community_name": "核桃园社区居委会",
      "community_key": "110105003046",
      "street_key": "110105003000"
    },
    {
      "community_name": "呼家楼北社区居委会",
      "community_key": "110105003047",
      "street_key": "110105003000"
    },
    {
      "community_name": "呼家楼南社区居委会",
      "community_key": "110105003048",
      "street_key": "110105003000"
    },
    {
      "community_name": "金台社区居委会",
      "community_key": "110105003049",
      "street_key": "110105003000"
    },
    {
      "community_name": "东大桥社区居委会",
      "community_key": "110105003050",
      "street_key": "110105003000"
    },
    {
      "community_name": "关东店社区居委会",
      "community_key": "110105003051",
      "street_key": "110105003000"
    },
    {
      "community_name": "新街社区居委会",
      "community_key": "110105003052",
      "street_key": "110105003000"
    },
    {
      "community_name": "金桐社区居民委员会",
      "community_key": "110105003053",
      "street_key": "110105003000"
    },
    {
      "community_name": "幸福一村社区居委会",
      "community_key": "110105004032",
      "street_key": "110105004000"
    },
    {
      "community_name": "幸福二村社区居委会",
      "community_key": "110105004033",
      "street_key": "110105004000"
    },
    {
      "community_name": "北三里社区居委会",
      "community_key": "110105004034",
      "street_key": "110105004000"
    },
    {
      "community_name": "东三里社区居委会",
      "community_key": "110105004036",
      "street_key": "110105004000"
    },
    {
      "community_name": "中三里社区居委会",
      "community_key": "110105004037",
      "street_key": "110105004000"
    },
    {
      "community_name": "白家庄西里社区居委会",
      "community_key": "110105004039",
      "street_key": "110105004000"
    },
    {
      "community_name": "中纺里社区居委会",
      "community_key": "110105004040",
      "street_key": "110105004000"
    },
    {
      "community_name": "新源里社区居委会",
      "community_key": "110105005048",
      "street_key": "110105005000"
    },
    {
      "community_name": "三源里社区居委会",
      "community_key": "110105005049",
      "street_key": "110105005000"
    },
    {
      "community_name": "顺源里社区居委会",
      "community_key": "110105005050",
      "street_key": "110105005000"
    },
    {
      "community_name": "新源西里社区居委会",
      "community_key": "110105005051",
      "street_key": "110105005000"
    },
    {
      "community_name": "静安里社区居委会",
      "community_key": "110105005052",
      "street_key": "110105005000"
    },
    {
      "community_name": "左东里社区居委会",
      "community_key": "110105005053",
      "street_key": "110105005000"
    },
    {
      "community_name": "左南里社区居委会",
      "community_key": "110105005054",
      "street_key": "110105005000"
    },
    {
      "community_name": "左北里社区居委会",
      "community_key": "110105005055",
      "street_key": "110105005000"
    },
    {
      "community_name": "曙光里社区居委会",
      "community_key": "110105005056",
      "street_key": "110105005000"
    },
    {
      "community_name": "曙光凤凰城社区居民委员会",
      "community_key": "110105005057",
      "street_key": "110105005000"
    },
    {
      "community_name": "曙光里西社区居民委员会",
      "community_key": "110105005058",
      "street_key": "110105005000"
    },
    {
      "community_name": "西坝河南里社区居委会",
      "community_key": "110105006034",
      "street_key": "110105006000"
    },
    {
      "community_name": "西坝河西里社区居委会",
      "community_key": "110105006037",
      "street_key": "110105006000"
    },
    {
      "community_name": "西坝河中里社区居委会",
      "community_key": "110105006038",
      "street_key": "110105006000"
    },
    {
      "community_name": "柳芳北里社区居委会",
      "community_key": "110105006039",
      "street_key": "110105006000"
    },
    {
      "community_name": "柳芳南里社区居委会",
      "community_key": "110105006040",
      "street_key": "110105006000"
    },
    {
      "community_name": "光熙门北里北社区居委会",
      "community_key": "110105006041",
      "street_key": "110105006000"
    },
    {
      "community_name": "光熙门北里南社区居委会",
      "community_key": "110105006042",
      "street_key": "110105006000"
    },
    {
      "community_name": "西坝河东里社区居委会",
      "community_key": "110105006043",
      "street_key": "110105006000"
    },
    {
      "community_name": "光熙家园社区居委会",
      "community_key": "110105006044",
      "street_key": "110105006000"
    },
    {
      "community_name": "胜古庄社区居委会",
      "community_key": "110105007039",
      "street_key": "110105007000"
    },
    {
      "community_name": "樱花园社区居委会",
      "community_key": "110105007040",
      "street_key": "110105007000"
    },
    {
      "community_name": "和平东街社区居委会",
      "community_key": "110105007041",
      "street_key": "110105007000"
    },
    {
      "community_name": "砖角楼社区居委会",
      "community_key": "110105007042",
      "street_key": "110105007000"
    },
    {
      "community_name": "和平家园社区居委会",
      "community_key": "110105007043",
      "street_key": "110105007000"
    },
    {
      "community_name": "十四区社区居委会",
      "community_key": "110105007044",
      "street_key": "110105007000"
    },
    {
      "community_name": "小黄庄社区居委会",
      "community_key": "110105007045",
      "street_key": "110105007000"
    },
    {
      "community_name": "煤炭科技苑社区居委会",
      "community_key": "110105007046",
      "street_key": "110105007000"
    },
    {
      "community_name": "胜古北社区居委会",
      "community_key": "110105007047",
      "street_key": "110105007000"
    },
    {
      "community_name": "胜古南社区居民委员会",
      "community_key": "110105007048",
      "street_key": "110105007000"
    },
    {
      "community_name": "和平家园北社区居民委员会",
      "community_key": "110105007049",
      "street_key": "110105007000"
    },
    {
      "community_name": "和平西苑社区居民委员会",
      "community_key": "110105007050",
      "street_key": "110105007000"
    },
    {
      "community_name": "安贞里社区居委会",
      "community_key": "110105008052",
      "street_key": "110105008000"
    },
    {
      "community_name": "安贞西里社区居委会",
      "community_key": "110105008053",
      "street_key": "110105008000"
    },
    {
      "community_name": "安华里社区居委会",
      "community_key": "110105008054",
      "street_key": "110105008000"
    },
    {
      "community_name": "安华西里社区居委会",
      "community_key": "110105008055",
      "street_key": "110105008000"
    },
    {
      "community_name": "黄寺社区居委会",
      "community_key": "110105008056",
      "street_key": "110105008000"
    },
    {
      "community_name": "裕民路社区居委会",
      "community_key": "110105008057",
      "street_key": "110105008000"
    },
    {
      "community_name": "涌溪社区居委会",
      "community_key": "110105008058",
      "street_key": "110105008000"
    },
    {
      "community_name": "五路居社区居委会",
      "community_key": "110105008059",
      "street_key": "110105008000"
    },
    {
      "community_name": "安外社区居委会",
      "community_key": "110105008060",
      "street_key": "110105008000"
    },
    {
      "community_name": "外馆社区居委会",
      "community_key": "110105008061",
      "street_key": "110105008000"
    },
    {
      "community_name": "安慧里社区居委会",
      "community_key": "110105009046",
      "street_key": "110105009000"
    },
    {
      "community_name": "安慧里南社区居委会",
      "community_key": "110105009047",
      "street_key": "110105009000"
    },
    {
      "community_name": "华严北里社区居委会",
      "community_key": "110105009048",
      "street_key": "110105009000"
    },
    {
      "community_name": "华严北里西社区居委会",
      "community_key": "110105009049",
      "street_key": "110105009000"
    },
    {
      "community_name": "安翔里社区居委会",
      "community_key": "110105009050",
      "street_key": "110105009000"
    },
    {
      "community_name": "丝竹园社区居委会",
      "community_key": "110105009051",
      "street_key": "110105009000"
    },
    {
      "community_name": "北辰东路社区居委会",
      "community_key": "110105009052",
      "street_key": "110105009000"
    },
    {
      "community_name": "安苑里社区居委会",
      "community_key": "110105009053",
      "street_key": "110105009000"
    },
    {
      "community_name": "京民社区居委会",
      "community_key": "110105009054",
      "street_key": "110105009000"
    },
    {
      "community_name": "祁家豁子社区居委会",
      "community_key": "110105009055",
      "street_key": "110105009000"
    },
    {
      "community_name": "安慧里北社区居民委员会",
      "community_key": "110105009056",
      "street_key": "110105009000"
    },
    {
      "community_name": "民族园社区居民委员会",
      "community_key": "110105009057",
      "street_key": "110105009000"
    },
    {
      "community_name": "安苑北里社区居民委员会",
      "community_key": "110105009058",
      "street_key": "110105009000"
    },
    {
      "community_name": "惠新苑社区居委会",
      "community_key": "110105010022",
      "street_key": "110105010000"
    },
    {
      "community_name": "惠新北里社区居委会",
      "community_key": "110105010023",
      "street_key": "110105010000"
    },
    {
      "community_name": "高原街社区居委会",
      "community_key": "110105010024",
      "street_key": "110105010000"
    },
    {
      "community_name": "小关社区居委会",
      "community_key": "110105010025",
      "street_key": "110105010000"
    },
    {
      "community_name": "惠新里社区居委会",
      "community_key": "110105010026",
      "street_key": "110105010000"
    },
    {
      "community_name": "小关东街社区居委会",
      "community_key": "110105010027",
      "street_key": "110105010000"
    },
    {
      "community_name": "惠新东街社区居委会",
      "community_key": "110105010028",
      "street_key": "110105010000"
    },
    {
      "community_name": "惠新西街社区居民委员会",
      "community_key": "110105010029",
      "street_key": "110105010000"
    },
    {
      "community_name": "电子球场社区居委会",
      "community_key": "110105011041",
      "street_key": "110105011000"
    },
    {
      "community_name": "东路社区居委会",
      "community_key": "110105011042",
      "street_key": "110105011000"
    },
    {
      "community_name": "红霞路社区居委会",
      "community_key": "110105011043",
      "street_key": "110105011000"
    },
    {
      "community_name": "南路社区居委会",
      "community_key": "110105011044",
      "street_key": "110105011000"
    },
    {
      "community_name": "中北路社区居委会",
      "community_key": "110105011045",
      "street_key": "110105011000"
    },
    {
      "community_name": "大山子社区居委会",
      "community_key": "110105011046",
      "street_key": "110105011000"
    },
    {
      "community_name": "高家园社区居委会",
      "community_key": "110105011047",
      "street_key": "110105011000"
    },
    {
      "community_name": "怡思苑社区居委会",
      "community_key": "110105011048",
      "street_key": "110105011000"
    },
    {
      "community_name": "驼房营西里社区居委会",
      "community_key": "110105011049",
      "street_key": "110105011000"
    },
    {
      "community_name": "万红路社区居委会",
      "community_key": "110105011050",
      "street_key": "110105011000"
    },
    {
      "community_name": "银河湾社区居民委员会",
      "community_key": "110105011051",
      "street_key": "110105011000"
    },
    {
      "community_name": "枣营南里社区居委会",
      "community_key": "110105012021",
      "street_key": "110105012000"
    },
    {
      "community_name": "枣营北里社区居委会",
      "community_key": "110105012022",
      "street_key": "110105012000"
    },
    {
      "community_name": "霞光里社区居委会",
      "community_key": "110105012023",
      "street_key": "110105012000"
    },
    {
      "community_name": "农展南里社区居委会",
      "community_key": "110105012024",
      "street_key": "110105012000"
    },
    {
      "community_name": "朝阳公园社区居委会",
      "community_key": "110105012025",
      "street_key": "110105012000"
    },
    {
      "community_name": "枣营社区居民委员会",
      "community_key": "110105012026",
      "street_key": "110105012000"
    },
    {
      "community_name": "亮马社区居民委员会",
      "community_key": "110105012027",
      "street_key": "110105012000"
    },
    {
      "community_name": "一二条社区居委会",
      "community_key": "110105013027",
      "street_key": "110105013000"
    },
    {
      "community_name": "三四条社区居委会",
      "community_key": "110105013028",
      "street_key": "110105013000"
    },
    {
      "community_name": "中路北社区居委会",
      "community_key": "110105013029",
      "street_key": "110105013000"
    },
    {
      "community_name": "中路南社区居委会",
      "community_key": "110105013030",
      "street_key": "110105013000"
    },
    {
      "community_name": "水碓子社区居委会",
      "community_key": "110105013031",
      "street_key": "110105013000"
    },
    {
      "community_name": "南北里社区居委会",
      "community_key": "110105013032",
      "street_key": "110105013000"
    },
    {
      "community_name": "十里堡北里社区居委会",
      "community_key": "110105014053",
      "street_key": "110105014000"
    },
    {
      "community_name": "八里庄北里社区居委会",
      "community_key": "110105014054",
      "street_key": "110105014000"
    },
    {
      "community_name": "八里庄南里社区居委会",
      "community_key": "110105014055",
      "street_key": "110105014000"
    },
    {
      "community_name": "晨光社区居委会",
      "community_key": "110105014056",
      "street_key": "110105014000"
    },
    {
      "community_name": "道家园社区居委会",
      "community_key": "110105014058",
      "street_key": "110105014000"
    },
    {
      "community_name": "碧水园社区居委会",
      "community_key": "110105014059",
      "street_key": "110105014000"
    },
    {
      "community_name": "甜水园社区居委会",
      "community_key": "110105014060",
      "street_key": "110105014000"
    },
    {
      "community_name": "秀水园社区居委会",
      "community_key": "110105014061",
      "street_key": "110105014000"
    },
    {
      "community_name": "六里屯北里社区居委会",
      "community_key": "110105014062",
      "street_key": "110105014000"
    },
    {
      "community_name": "炫特家园社区居委会",
      "community_key": "110105014063",
      "street_key": "110105014000"
    },
    {
      "community_name": "甜水西园社区居委会",
      "community_key": "110105014064",
      "street_key": "110105014000"
    },
    {
      "community_name": "八里庄北里东社区居民委员会",
      "community_key": "110105014065",
      "street_key": "110105014000"
    },
    {
      "community_name": "十里堡社区居委会",
      "community_key": "110105015033",
      "street_key": "110105015000"
    },
    {
      "community_name": "甘露园社区居委会",
      "community_key": "110105015034",
      "street_key": "110105015000"
    },
    {
      "community_name": "八里庄东里社区居委会",
      "community_key": "110105015035",
      "street_key": "110105015000"
    },
    {
      "community_name": "八里庄西里社区居委会",
      "community_key": "110105015036",
      "street_key": "110105015000"
    },
    {
      "community_name": "红庙社区居委会",
      "community_key": "110105015037",
      "street_key": "110105015000"
    },
    {
      "community_name": "红庙北里社区居委会",
      "community_key": "110105015038",
      "street_key": "110105015000"
    },
    {
      "community_name": "延静里社区居委会",
      "community_key": "110105015039",
      "street_key": "110105015000"
    },
    {
      "community_name": "远洋天地家园社区居委会",
      "community_key": "110105015040",
      "street_key": "110105015000"
    },
    {
      "community_name": "城市华庭社区居委会",
      "community_key": "110105015041",
      "street_key": "110105015000"
    },
    {
      "community_name": "朝阳无限社区居委会",
      "community_key": "110105015042",
      "street_key": "110105015000"
    },
    {
      "community_name": "罗马嘉园社区居委会",
      "community_key": "110105015043",
      "street_key": "110105015000"
    },
    {
      "community_name": "华贸中心社区居委会",
      "community_key": "110105015044",
      "street_key": "110105015000"
    },
    {
      "community_name": "十里堡南里社区居委会",
      "community_key": "110105015045",
      "street_key": "110105015000"
    },
    {
      "community_name": "甘露园中里社区居民委员会",
      "community_key": "110105015046",
      "street_key": "110105015000"
    },
    {
      "community_name": "十里堡东里社区居民委员会",
      "community_key": "110105015047",
      "street_key": "110105015000"
    },
    {
      "community_name": "八里庄东里北社区居民委员会",
      "community_key": "110105015048",
      "street_key": "110105015000"
    },
    {
      "community_name": "垂杨柳东里社区居委会",
      "community_key": "110105016059",
      "street_key": "110105016000"
    },
    {
      "community_name": "垂杨柳西里社区居委会",
      "community_key": "110105016060",
      "street_key": "110105016000"
    },
    {
      "community_name": "广和里社区居委会",
      "community_key": "110105016061",
      "street_key": "110105016000"
    },
    {
      "community_name": "双花园社区居委会",
      "community_key": "110105016062",
      "street_key": "110105016000"
    },
    {
      "community_name": "广外南社区居委会",
      "community_key": "110105016063",
      "street_key": "110105016000"
    },
    {
      "community_name": "九龙社区居委会",
      "community_key": "110105016064",
      "street_key": "110105016000"
    },
    {
      "community_name": "大望社区居委会",
      "community_key": "110105016065",
      "street_key": "110105016000"
    },
    {
      "community_name": "广泉社区居委会",
      "community_key": "110105016066",
      "street_key": "110105016000"
    },
    {
      "community_name": "富力社区居委会",
      "community_key": "110105016067",
      "street_key": "110105016000"
    },
    {
      "community_name": "光环社区居委会",
      "community_key": "110105016068",
      "street_key": "110105016000"
    },
    {
      "community_name": "九龙南社区居委会",
      "community_key": "110105016069",
      "street_key": "110105016000"
    },
    {
      "community_name": "百子园社区居委会",
      "community_key": "110105016070",
      "street_key": "110105016000"
    },
    {
      "community_name": "和平村一社区居委会",
      "community_key": "110105016071",
      "street_key": "110105016000"
    },
    {
      "community_name": "东柏街社区居民委员会",
      "community_key": "110105016072",
      "street_key": "110105016000"
    },
    {
      "community_name": "九龙山社区居民委员会",
      "community_key": "110105016073",
      "street_key": "110105016000"
    },
    {
      "community_name": "富力西社区居民委员会",
      "community_key": "110105016074",
      "street_key": "110105016000"
    },
    {
      "community_name": "黄木厂社区居民委员会",
      "community_key": "110105016075",
      "street_key": "110105016000"
    },
    {
      "community_name": "茂兴社区居民委员会",
      "community_key": "110105016076",
      "street_key": "110105016000"
    },
    {
      "community_name": "劲松北社区居委会",
      "community_key": "110105017036",
      "street_key": "110105017000"
    },
    {
      "community_name": "劲松东社区居委会",
      "community_key": "110105017037",
      "street_key": "110105017000"
    },
    {
      "community_name": "劲松中社区居委会",
      "community_key": "110105017038",
      "street_key": "110105017000"
    },
    {
      "community_name": "劲松西社区居委会",
      "community_key": "110105017039",
      "street_key": "110105017000"
    },
    {
      "community_name": "八棵杨社区居委会",
      "community_key": "110105017040",
      "street_key": "110105017000"
    },
    {
      "community_name": "大郊亭社区居委会",
      "community_key": "110105017041",
      "street_key": "110105017000"
    },
    {
      "community_name": "农光里社区居委会",
      "community_key": "110105017042",
      "street_key": "110105017000"
    },
    {
      "community_name": "农光里中社区居委会",
      "community_key": "110105017043",
      "street_key": "110105017000"
    },
    {
      "community_name": "农光东里社区居委会",
      "community_key": "110105017044",
      "street_key": "110105017000"
    },
    {
      "community_name": "磨房北里社区居委会",
      "community_key": "110105017045",
      "street_key": "110105017000"
    },
    {
      "community_name": "百环社区居委会",
      "community_key": "110105017046",
      "street_key": "110105017000"
    },
    {
      "community_name": "和谐雅园社区居委会",
      "community_key": "110105017047",
      "street_key": "110105017000"
    },
    {
      "community_name": "西大望路社区居民委员会",
      "community_key": "110105017048",
      "street_key": "110105017000"
    },
    {
      "community_name": "首城社区居民委员会",
      "community_key": "110105017049",
      "street_key": "110105017000"
    },
    {
      "community_name": "西大望路南社区居民委员会",
      "community_key": "110105017050",
      "street_key": "110105017000"
    },
    {
      "community_name": "百环东社区居民委员会",
      "community_key": "110105017051",
      "street_key": "110105017000"
    },
    {
      "community_name": "农光里南社区居民委员会",
      "community_key": "110105017052",
      "street_key": "110105017000"
    },
    {
      "community_name": "磨房南里社区居委会",
      "community_key": "110105018065",
      "street_key": "110105018000"
    },
    {
      "community_name": "武圣东里社区居委会",
      "community_key": "110105018066",
      "street_key": "110105018000"
    },
    {
      "community_name": "松榆东里社区居委会",
      "community_key": "110105018067",
      "street_key": "110105018000"
    },
    {
      "community_name": "松榆里社区居委会",
      "community_key": "110105018068",
      "street_key": "110105018000"
    },
    {
      "community_name": "松榆西里社区居委会",
      "community_key": "110105018069",
      "street_key": "110105018000"
    },
    {
      "community_name": "武圣农光社区居委会",
      "community_key": "110105018070",
      "street_key": "110105018000"
    },
    {
      "community_name": "华威北里社区居委会",
      "community_key": "110105018071",
      "street_key": "110105018000"
    },
    {
      "community_name": "潘家园东里社区居委会",
      "community_key": "110105018072",
      "street_key": "110105018000"
    },
    {
      "community_name": "华威西里社区居委会",
      "community_key": "110105018073",
      "street_key": "110105018000"
    },
    {
      "community_name": "潘家园社区居委会",
      "community_key": "110105018074",
      "street_key": "110105018000"
    },
    {
      "community_name": "潘家园南里社区居委会",
      "community_key": "110105018075",
      "street_key": "110105018000"
    },
    {
      "community_name": "华威里社区居委会",
      "community_key": "110105018076",
      "street_key": "110105018000"
    },
    {
      "community_name": "松榆西里北社区居民委员会",
      "community_key": "110105018077",
      "street_key": "110105018000"
    },
    {
      "community_name": "武圣西里社区居民委员会",
      "community_key": "110105018078",
      "street_key": "110105018000"
    },
    {
      "community_name": "一区社区居委会",
      "community_key": "110105019013",
      "street_key": "110105019000"
    },
    {
      "community_name": "二区社区居委会",
      "community_key": "110105019014",
      "street_key": "110105019000"
    },
    {
      "community_name": "三区社区居委会",
      "community_key": "110105019015",
      "street_key": "110105019000"
    },
    {
      "community_name": "东里社区居委会",
      "community_key": "110105019016",
      "street_key": "110105019000"
    },
    {
      "community_name": "西里社区居委会",
      "community_key": "110105019017",
      "street_key": "110105019000"
    },
    {
      "community_name": "北里社区居委会",
      "community_key": "110105019018",
      "street_key": "110105019000"
    },
    {
      "community_name": "翠城馨园社区居委会",
      "community_key": "110105019024",
      "street_key": "110105019000"
    },
    {
      "community_name": "翠城雅园社区居委会",
      "community_key": "110105019025",
      "street_key": "110105019000"
    },
    {
      "community_name": "翠城趣园社区居委会",
      "community_key": "110105019026",
      "street_key": "110105019000"
    },
    {
      "community_name": "翠城盛园社区居委会",
      "community_key": "110105019027",
      "street_key": "110105019000"
    },
    {
      "community_name": "翠城熙园社区居委会",
      "community_key": "110105019028",
      "street_key": "110105019000"
    },
    {
      "community_name": "双合家园社区居民委员会",
      "community_key": "110105019029",
      "street_key": "110105019000"
    },
    {
      "community_name": "翠城福园社区居民委员会",
      "community_key": "110105019030",
      "street_key": "110105019000"
    },
    {
      "community_name": "祈东家园社区居民委员会",
      "community_key": "110105019031",
      "street_key": "110105019000"
    },
    {
      "community_name": "北焦家园社区居民委员会",
      "community_key": "110105019032",
      "street_key": "110105019000"
    },
    {
      "community_name": "双美家园社区居民委员会",
      "community_key": "110105019033",
      "street_key": "110105019000"
    },
    {
      "community_name": "东郊社区居委会",
      "community_key": "110105021021",
      "street_key": "110105021000"
    },
    {
      "community_name": "百子湾西社区居委会",
      "community_key": "110105021022",
      "street_key": "110105021000"
    },
    {
      "community_name": "紫南家园社区居委会",
      "community_key": "110105021023",
      "street_key": "110105021000"
    },
    {
      "community_name": "平乐园社区居委会",
      "community_key": "110105021024",
      "street_key": "110105021000"
    },
    {
      "community_name": "欢乐谷社区居委会",
      "community_key": "110105021025",
      "street_key": "110105021000"
    },
    {
      "community_name": "双龙南里社区居委会",
      "community_key": "110105021026",
      "street_key": "110105021000"
    },
    {
      "community_name": "南新园社区居委会",
      "community_key": "110105021027",
      "street_key": "110105021000"
    },
    {
      "community_name": "百子湾东社区居委会",
      "community_key": "110105021028",
      "street_key": "110105021000"
    },
    {
      "community_name": "山水文园社区居委会",
      "community_key": "110105021029",
      "street_key": "110105021000"
    },
    {
      "community_name": "赛洛城社区居委会",
      "community_key": "110105021030",
      "street_key": "110105021000"
    },
    {
      "community_name": "百子湾北社区居民委员会",
      "community_key": "110105021031",
      "street_key": "110105021000"
    },
    {
      "community_name": "广百西路社区居民委员会",
      "community_key": "110105021032",
      "street_key": "110105021000"
    },
    {
      "community_name": "世纪东方城社区居民委员会",
      "community_key": "110105021033",
      "street_key": "110105021000"
    },
    {
      "community_name": "广华新城社区居民委员会",
      "community_key": "110105021034",
      "street_key": "110105021000"
    },
    {
      "community_name": "美景东方社区居民委员会",
      "community_key": "110105021035",
      "street_key": "110105021000"
    },
    {
      "community_name": "石门社区居民委员会",
      "community_key": "110105021036",
      "street_key": "110105021000"
    },
    {
      "community_name": "双龙西社区居民委员会",
      "community_key": "110105021037",
      "street_key": "110105021000"
    },
    {
      "community_name": "华侨城社区居民委员会",
      "community_key": "110105021038",
      "street_key": "110105021000"
    },
    {
      "community_name": "远景社区居民委员会",
      "community_key": "110105021039",
      "street_key": "110105021000"
    },
    {
      "community_name": "广华新城东社区居民委员会",
      "community_key": "110105021040",
      "street_key": "110105021000"
    },
    {
      "community_name": "南新园西社区居民委员会",
      "community_key": "110105021041",
      "street_key": "110105021000"
    },
    {
      "community_name": "楼梓庄村委会",
      "community_key": "110105021200",
      "street_key": "110105021000"
    },
    {
      "community_name": "大郊亭村委会",
      "community_key": "110105021201",
      "street_key": "110105021000"
    },
    {
      "community_name": "甘露园南里二区社区居委会",
      "community_key": "110105022001",
      "street_key": "110105022000"
    },
    {
      "community_name": "大黄庄社区居委会",
      "community_key": "110105022004",
      "street_key": "110105022000"
    },
    {
      "community_name": "通惠家园社区居委会",
      "community_key": "110105022016",
      "street_key": "110105022000"
    },
    {
      "community_name": "兴隆家园社区居委会",
      "community_key": "110105022019",
      "street_key": "110105022000"
    },
    {
      "community_name": "丽景馨居社区居委会",
      "community_key": "110105022020",
      "street_key": "110105022000"
    },
    {
      "community_name": "八里庄社区居委会",
      "community_key": "110105022021",
      "street_key": "110105022000"
    },
    {
      "community_name": "甘露园南里一区社区居委会",
      "community_key": "110105022022",
      "street_key": "110105022000"
    },
    {
      "community_name": "康家园西社区居委会",
      "community_key": "110105022023",
      "street_key": "110105022000"
    },
    {
      "community_name": "康家园东社区居委会",
      "community_key": "110105022024",
      "street_key": "110105022000"
    },
    {
      "community_name": "高井社区居委会",
      "community_key": "110105022025",
      "street_key": "110105022000"
    },
    {
      "community_name": "太平庄南社区居委会",
      "community_key": "110105022026",
      "street_key": "110105022000"
    },
    {
      "community_name": "太平庄北社区居委会",
      "community_key": "110105022027",
      "street_key": "110105022000"
    },
    {
      "community_name": "花北西社区居委会",
      "community_key": "110105022028",
      "street_key": "110105022000"
    },
    {
      "community_name": "花北东社区居委会",
      "community_key": "110105022029",
      "street_key": "110105022000"
    },
    {
      "community_name": "北花园社区居委会",
      "community_key": "110105022030",
      "street_key": "110105022000"
    },
    {
      "community_name": "高碑店东社区居委会",
      "community_key": "110105022034",
      "street_key": "110105022000"
    },
    {
      "community_name": "高碑店西社区居委会",
      "community_key": "110105022035",
      "street_key": "110105022000"
    },
    {
      "community_name": "方家园社区居委会",
      "community_key": "110105022036",
      "street_key": "110105022000"
    },
    {
      "community_name": "西店社区居委会",
      "community_key": "110105022037",
      "street_key": "110105022000"
    },
    {
      "community_name": "半壁店社区居委会",
      "community_key": "110105022038",
      "street_key": "110105022000"
    },
    {
      "community_name": "小郊亭社区居委会",
      "community_key": "110105022039",
      "street_key": "110105022000"
    },
    {
      "community_name": "高碑店文化园社区居委会",
      "community_key": "110105022040",
      "street_key": "110105022000"
    },
    {
      "community_name": "花园闸社区居委会",
      "community_key": "110105022041",
      "street_key": "110105022000"
    },
    {
      "community_name": "力源里社区居委会",
      "community_key": "110105022042",
      "street_key": "110105022000"
    },
    {
      "community_name": "水南庄社区居委会",
      "community_key": "110105022043",
      "street_key": "110105022000"
    },
    {
      "community_name": "太平庄社区居委会",
      "community_key": "110105022044",
      "street_key": "110105022000"
    },
    {
      "community_name": "高碑店古街社区居民委员会",
      "community_key": "110105022045",
      "street_key": "110105022000"
    },
    {
      "community_name": "汇星苑社区居民委员会",
      "community_key": "110105022046",
      "street_key": "110105022000"
    },
    {
      "community_name": "高井村委会",
      "community_key": "110105022201",
      "street_key": "110105022000"
    },
    {
      "community_name": "北花园村委会",
      "community_key": "110105022202",
      "street_key": "110105022000"
    },
    {
      "community_name": "高碑店村委会",
      "community_key": "110105022203",
      "street_key": "110105022000"
    },
    {
      "community_name": "半壁店村委会",
      "community_key": "110105022204",
      "street_key": "110105022000"
    },
    {
      "community_name": "丽都社区居委会",
      "community_key": "110105023009",
      "street_key": "110105023000"
    },
    {
      "community_name": "芳园里社区居委会",
      "community_key": "110105023015",
      "street_key": "110105023000"
    },
    {
      "community_name": "安家楼社区居委会",
      "community_key": "110105023016",
      "street_key": "110105023000"
    },
    {
      "community_name": "水岸家园社区居委会",
      "community_key": "110105023017",
      "street_key": "110105023000"
    },
    {
      "community_name": "将府家园社区居委会",
      "community_key": "110105023018",
      "street_key": "110105023000"
    },
    {
      "community_name": "梵谷水郡社区居委会",
      "community_key": "110105023019",
      "street_key": "110105023000"
    },
    {
      "community_name": "瞰都嘉园社区居委会",
      "community_key": "110105023020",
      "street_key": "110105023000"
    },
    {
      "community_name": "驼房营北里社区居民委员会",
      "community_key": "110105023021",
      "street_key": "110105023000"
    },
    {
      "community_name": "阳光上东社区居民委员会",
      "community_key": "110105023022",
      "street_key": "110105023000"
    },
    {
      "community_name": "将府锦苑东社区居民委员会",
      "community_key": "110105023023",
      "street_key": "110105023000"
    },
    {
      "community_name": "将府锦苑西社区居民委员会",
      "community_key": "110105023024",
      "street_key": "110105023000"
    },
    {
      "community_name": "驼房营村委会",
      "community_key": "110105023201",
      "street_key": "110105023000"
    },
    {
      "community_name": "东八间房村委会",
      "community_key": "110105023202",
      "street_key": "110105023000"
    },
    {
      "community_name": "芍药居一社区居委会",
      "community_key": "110105024010",
      "street_key": "110105024000"
    },
    {
      "community_name": "芍药居二社区居委会",
      "community_key": "110105024011",
      "street_key": "110105024000"
    },
    {
      "community_name": "芍药居三社区居委会",
      "community_key": "110105024012",
      "street_key": "110105024000"
    },
    {
      "community_name": "惠忠庵社区居委会",
      "community_key": "110105024013",
      "street_key": "110105024000"
    },
    {
      "community_name": "尚家楼社区居委会",
      "community_key": "110105024014",
      "street_key": "110105024000"
    },
    {
      "community_name": "太阳宫社区居委会",
      "community_key": "110105024017",
      "street_key": "110105024000"
    },
    {
      "community_name": "十字口社区居委会",
      "community_key": "110105024018",
      "street_key": "110105024000"
    },
    {
      "community_name": "牛王庙社区居委会",
      "community_key": "110105024019",
      "street_key": "110105024000"
    },
    {
      "community_name": "芍药居四社区居委会",
      "community_key": "110105024020",
      "street_key": "110105024000"
    },
    {
      "community_name": "夏家园社区居委会",
      "community_key": "110105024021",
      "street_key": "110105024000"
    },
    {
      "community_name": "西坝河北里社区居委会",
      "community_key": "110105024022",
      "street_key": "110105024000"
    },
    {
      "community_name": "芍药居五社区居民居委会",
      "community_key": "110105024023",
      "street_key": "110105024000"
    },
    {
      "community_name": "太阳宫村委会",
      "community_key": "110105024200",
      "street_key": "110105024000"
    },
    {
      "community_name": "十字口村委会",
      "community_key": "110105024201",
      "street_key": "110105024000"
    },
    {
      "community_name": "牛王庙村委会",
      "community_key": "110105024202",
      "street_key": "110105024000"
    },
    {
      "community_name": "大屯里社区居委会",
      "community_key": "110105025015",
      "street_key": "110105025000"
    },
    {
      "community_name": "亚运新新家园社区居委会",
      "community_key": "110105025029",
      "street_key": "110105025000"
    },
    {
      "community_name": "慧忠里第一社区居委会",
      "community_key": "110105025034",
      "street_key": "110105025000"
    },
    {
      "community_name": "慧忠里第二社区居委会",
      "community_key": "110105025035",
      "street_key": "110105025000"
    },
    {
      "community_name": "慧忠北里第一社区居委会",
      "community_key": "110105025036",
      "street_key": "110105025000"
    },
    {
      "community_name": "慧忠北里第二社区居委会",
      "community_key": "110105025037",
      "street_key": "110105025000"
    },
    {
      "community_name": "安慧北里秀雅社区居委会",
      "community_key": "110105025038",
      "street_key": "110105025000"
    },
    {
      "community_name": "安慧北里安园社区居民委员会",
      "community_key": "110105025039",
      "street_key": "110105025000"
    },
    {
      "community_name": "育慧西里社区居委会",
      "community_key": "110105025040",
      "street_key": "110105025000"
    },
    {
      "community_name": "育慧里社区居委会",
      "community_key": "110105025041",
      "street_key": "110105025000"
    },
    {
      "community_name": "世纪村社区居委会",
      "community_key": "110105025042",
      "street_key": "110105025000"
    },
    {
      "community_name": "安慧东里社区居委会",
      "community_key": "110105025043",
      "street_key": "110105025000"
    },
    {
      "community_name": "嘉铭园社区居委会",
      "community_key": "110105025044",
      "street_key": "110105025000"
    },
    {
      "community_name": "欧陆经典社区居委会",
      "community_key": "110105025045",
      "street_key": "110105025000"
    },
    {
      "community_name": "金泉家园社区居委会",
      "community_key": "110105025046",
      "street_key": "110105025000"
    },
    {
      "community_name": "安慧东里第二社区居民委员会",
      "community_key": "110105025047",
      "street_key": "110105025000"
    },
    {
      "community_name": "安慧北里逸园社区居民委员会",
      "community_key": "110105025048",
      "street_key": "110105025000"
    },
    {
      "community_name": "中灿家园社区居民委员会",
      "community_key": "110105025049",
      "street_key": "110105025000"
    },
    {
      "community_name": "融华嘉园社区居民委员会",
      "community_key": "110105025050",
      "street_key": "110105025000"
    },
    {
      "community_name": "富成花园社区居民委员会",
      "community_key": "110105025051",
      "street_key": "110105025000"
    },
    {
      "community_name": "花家地西里社区居委会",
      "community_key": "110105026034",
      "street_key": "110105026000"
    },
    {
      "community_name": "方舟苑社区居委会",
      "community_key": "110105026035",
      "street_key": "110105026000"
    },
    {
      "community_name": "大西洋新城社区居委会",
      "community_key": "110105026036",
      "street_key": "110105026000"
    },
    {
      "community_name": "望京西园四区社区居委会",
      "community_key": "110105026038",
      "street_key": "110105026000"
    },
    {
      "community_name": "南湖东园社区居委会",
      "community_key": "110105026039",
      "street_key": "110105026000"
    },
    {
      "community_name": "南湖西里社区居委会",
      "community_key": "110105026040",
      "street_key": "110105026000"
    },
    {
      "community_name": "花家地社区居委会",
      "community_key": "110105026041",
      "street_key": "110105026000"
    },
    {
      "community_name": "望花路西里社区居委会",
      "community_key": "110105026042",
      "street_key": "110105026000"
    },
    {
      "community_name": "望花路东里社区居委会",
      "community_key": "110105026043",
      "street_key": "110105026000"
    },
    {
      "community_name": "花家地南里社区居委会",
      "community_key": "110105026044",
      "street_key": "110105026000"
    },
    {
      "community_name": "南湖中园社区居委会",
      "community_key": "110105026045",
      "street_key": "110105026000"
    },
    {
      "community_name": "花家地西里三区社区居委会",
      "community_key": "110105026046",
      "street_key": "110105026000"
    },
    {
      "community_name": "花家地北里社区居委会",
      "community_key": "110105026047",
      "street_key": "110105026000"
    },
    {
      "community_name": "圣星社区居委会",
      "community_key": "110105026048",
      "street_key": "110105026000"
    },
    {
      "community_name": "爽秋路社区居委会",
      "community_key": "110105026049",
      "street_key": "110105026000"
    },
    {
      "community_name": "南湖西园社区居委会",
      "community_key": "110105026050",
      "street_key": "110105026000"
    },
    {
      "community_name": "望京西园三区社区居委会",
      "community_key": "110105026051",
      "street_key": "110105026000"
    },
    {
      "community_name": "望京园社区居委会",
      "community_key": "110105026060",
      "street_key": "110105026000"
    },
    {
      "community_name": "南湖西园二区社区居委会",
      "community_key": "110105026061",
      "street_key": "110105026000"
    },
    {
      "community_name": "望京东园五区社区居委会",
      "community_key": "110105026062",
      "street_key": "110105026000"
    },
    {
      "community_name": "阜荣街社区居委会",
      "community_key": "110105026063",
      "street_key": "110105026000"
    },
    {
      "community_name": "望京西路社区居委会",
      "community_key": "110105026064",
      "street_key": "110105026000"
    },
    {
      "community_name": "夏都雅园社区居民委员会",
      "community_key": "110105026065",
      "street_key": "110105026000"
    },
    {
      "community_name": "国风社区居民委员会",
      "community_key": "110105026066",
      "street_key": "110105026000"
    },
    {
      "community_name": "宝星社区居民委员会",
      "community_key": "110105026067",
      "street_key": "110105026000"
    },
    {
      "community_name": "坝北居委会",
      "community_key": "110105026010",
      "street_key": "110105026000"
    },
    {
      "community_name": "四道口居民委员会",
      "community_key": "110105027001",
      "street_key": "110105027000"
    },
    {
      "community_name": "三台山居民委员会",
      "community_key": "110105027002",
      "street_key": "110105027000"
    },
    {
      "community_name": "玉器厂居民委员会",
      "community_key": "110105027003",
      "street_key": "110105027000"
    },
    {
      "community_name": "恋日绿岛社区居民委员会",
      "community_key": "110105027004",
      "street_key": "110105027000"
    },
    {
      "community_name": "中海城社区居民委员会",
      "community_key": "110105027009",
      "street_key": "110105027000"
    },
    {
      "community_name": "鸿博家园第一社区居民委员会",
      "community_key": "110105027010",
      "street_key": "110105027000"
    },
    {
      "community_name": "鸿博家园第二社区居民委员会",
      "community_key": "110105027011",
      "street_key": "110105027000"
    },
    {
      "community_name": "鸿博家园第三社区居民委员会",
      "community_key": "110105027012",
      "street_key": "110105027000"
    },
    {
      "community_name": "鸿博家园第四社区居民委员会",
      "community_key": "110105027013",
      "street_key": "110105027000"
    },
    {
      "community_name": "鸿博家园第五社区居民委员会",
      "community_key": "110105027014",
      "street_key": "110105027000"
    },
    {
      "community_name": "小红门村民委员会",
      "community_key": "110105027200",
      "street_key": "110105027000"
    },
    {
      "community_name": "牌坊村村民委员会",
      "community_key": "110105027201",
      "street_key": "110105027000"
    },
    {
      "community_name": "龙爪树村民委员会",
      "community_key": "110105027202",
      "street_key": "110105027000"
    },
    {
      "community_name": "肖村村民委员会",
      "community_key": "110105027203",
      "street_key": "110105027000"
    },
    {
      "community_name": "老君堂社区居委会",
      "community_key": "110105028013",
      "street_key": "110105028000"
    },
    {
      "community_name": "弘善家园第二社区居委会",
      "community_key": "110105028015",
      "street_key": "110105028000"
    },
    {
      "community_name": "弘善家园第一社区居委会",
      "community_key": "110105028016",
      "street_key": "110105028000"
    },
    {
      "community_name": "弘善家园第三社区居委会",
      "community_key": "110105028017",
      "street_key": "110105028000"
    },
    {
      "community_name": "周庄嘉园第一社区居委会",
      "community_key": "110105028018",
      "street_key": "110105028000"
    },
    {
      "community_name": "十八里店第一社区居委会",
      "community_key": "110105028019",
      "street_key": "110105028000"
    },
    {
      "community_name": "弘善寺社区居民委员会",
      "community_key": "110105028020",
      "street_key": "110105028000"
    },
    {
      "community_name": "祁庄社区居民委员会",
      "community_key": "110105028021",
      "street_key": "110105028000"
    },
    {
      "community_name": "十八里店村委会",
      "community_key": "110105028200",
      "street_key": "110105028000"
    },
    {
      "community_name": "吕家营村委会",
      "community_key": "110105028201",
      "street_key": "110105028000"
    },
    {
      "community_name": "十里河村委会",
      "community_key": "110105028202",
      "street_key": "110105028000"
    },
    {
      "community_name": "周家庄村委会",
      "community_key": "110105028203",
      "street_key": "110105028000"
    },
    {
      "community_name": "小武基村委会",
      "community_key": "110105028204",
      "street_key": "110105028000"
    },
    {
      "community_name": "老君堂村委会",
      "community_key": "110105028205",
      "street_key": "110105028000"
    },
    {
      "community_name": "横街子村委会",
      "community_key": "110105028206",
      "street_key": "110105028000"
    },
    {
      "community_name": "西直河村委会",
      "community_key": "110105028207",
      "street_key": "110105028000"
    },
    {
      "community_name": "前祁庄居委会",
      "community_key": "110105028009",
      "street_key": "110105028000"
    },
    {
      "community_name": "后祁庄居委会",
      "community_key": "110105028010",
      "street_key": "110105028000"
    },
    {
      "community_name": "白墙子居委会",
      "community_key": "110105028011",
      "street_key": "110105028000"
    },
    {
      "community_name": "六道口居委会",
      "community_key": "110105028012",
      "street_key": "110105028000"
    },
    {
      "community_name": "弘善寺居委会",
      "community_key": "110105028014",
      "street_key": "110105028000"
    },
    {
      "community_name": "平房社区居委会",
      "community_key": "110105029012",
      "street_key": "110105029000"
    },
    {
      "community_name": "富华家园社区居委会",
      "community_key": "110105029016",
      "street_key": "110105029000"
    },
    {
      "community_name": "姚家园西社区居委会",
      "community_key": "110105029017",
      "street_key": "110105029000"
    },
    {
      "community_name": "星河湾社区居委会",
      "community_key": "110105029018",
      "street_key": "110105029000"
    },
    {
      "community_name": "华纺易城社区居委会",
      "community_key": "110105029019",
      "street_key": "110105029000"
    },
    {
      "community_name": "国美家园社区居委会",
      "community_key": "110105029020",
      "street_key": "110105029000"
    },
    {
      "community_name": "雅成里社区居委会",
      "community_key": "110105029021",
      "street_key": "110105029000"
    },
    {
      "community_name": "定福家园南社区居委会",
      "community_key": "110105029022",
      "street_key": "110105029000"
    },
    {
      "community_name": "天鹅湾社区居委会",
      "community_key": "110105029024",
      "street_key": "110105029000"
    },
    {
      "community_name": "青年路社区居委会",
      "community_key": "110105029026",
      "street_key": "110105029000"
    },
    {
      "community_name": "姚家园东社区居委会",
      "community_key": "110105029027",
      "street_key": "110105029000"
    },
    {
      "community_name": "逸翠园社区居委会",
      "community_key": "110105029028",
      "street_key": "110105029000"
    },
    {
      "community_name": "泓鑫家园社区居民委员会",
      "community_key": "110105029030",
      "street_key": "110105029000"
    },
    {
      "community_name": "国美家园第二社区居民委员会",
      "community_key": "110105029031",
      "street_key": "110105029000"
    },
    {
      "community_name": "平房村委会",
      "community_key": "110105029200",
      "street_key": "110105029000"
    },
    {
      "community_name": "姚家园村委会",
      "community_key": "110105029202",
      "street_key": "110105029000"
    },
    {
      "community_name": "黄渠村委会",
      "community_key": "110105029203",
      "street_key": "110105029000"
    },
    {
      "community_name": "石各庄村委会",
      "community_key": "110105029204",
      "street_key": "110105029000"
    },
    {
      "community_name": "石佛营东里社区居委会",
      "community_key": "110105030007",
      "street_key": "110105030000"
    },
    {
      "community_name": "东润枫景社区居委会",
      "community_key": "110105030009",
      "street_key": "110105030000"
    },
    {
      "community_name": "石佛营西里社区居委会",
      "community_key": "110105030010",
      "street_key": "110105030000"
    },
    {
      "community_name": "石佛营南里社区居委会",
      "community_key": "110105030011",
      "street_key": "110105030000"
    },
    {
      "community_name": "紫萝园社区居委会",
      "community_key": "110105030013",
      "street_key": "110105030000"
    },
    {
      "community_name": "公园大道社区居委会",
      "community_key": "110105030014",
      "street_key": "110105030000"
    },
    {
      "community_name": "泛海国际南社区居委会",
      "community_key": "110105030015",
      "street_key": "110105030000"
    },
    {
      "community_name": "观湖国际社区居委会",
      "community_key": "110105030017",
      "street_key": "110105030000"
    },
    {
      "community_name": "南十里居社区居委会",
      "community_key": "110105030018",
      "street_key": "110105030000"
    },
    {
      "community_name": "东风苑社区居民委员会",
      "community_key": "110105030019",
      "street_key": "110105030000"
    },
    {
      "community_name": "豆各庄村委会",
      "community_key": "110105030200",
      "street_key": "110105030000"
    },
    {
      "community_name": "将台洼村委会",
      "community_key": "110105030201",
      "street_key": "110105030000"
    },
    {
      "community_name": "辛庄村委会",
      "community_key": "110105030202",
      "street_key": "110105030000"
    },
    {
      "community_name": "六里屯村委会",
      "community_key": "110105030203",
      "street_key": "110105030000"
    },
    {
      "community_name": "大羊坊社区居委会",
      "community_key": "110105031005",
      "street_key": "110105031000"
    },
    {
      "community_name": "双泉社区居委会",
      "community_key": "110105031006",
      "street_key": "110105031000"
    },
    {
      "community_name": "总装社区居委会",
      "community_key": "110105031012",
      "street_key": "110105031000"
    },
    {
      "community_name": "科学园社区居委会",
      "community_key": "110105031013",
      "street_key": "110105031000"
    },
    {
      "community_name": "风林绿洲社区居委会",
      "community_key": "110105031015",
      "street_key": "110105031000"
    },
    {
      "community_name": "北沙滩社区居委会",
      "community_key": "110105031016",
      "street_key": "110105031000"
    },
    {
      "community_name": "林萃社区居委会",
      "community_key": "110105031017",
      "street_key": "110105031000"
    },
    {
      "community_name": "绿色家园社区居委会",
      "community_key": "110105031018",
      "street_key": "110105031000"
    },
    {
      "community_name": "南沙滩社区居委会",
      "community_key": "110105031019",
      "street_key": "110105031000"
    },
    {
      "community_name": "万科星园社区居委会",
      "community_key": "110105031020",
      "street_key": "110105031000"
    },
    {
      "community_name": "龙祥社区居委会",
      "community_key": "110105031021",
      "street_key": "110105031000"
    },
    {
      "community_name": "国奥村社区居委会",
      "community_key": "110105031023",
      "street_key": "110105031000"
    },
    {
      "community_name": "拂林园社区居民委员会",
      "community_key": "110105031024",
      "street_key": "110105031000"
    },
    {
      "community_name": "大羊坊南社区居委会",
      "community_key": "110105031025",
      "street_key": "110105031000"
    },
    {
      "community_name": "林萃西里社区居民委员会",
      "community_key": "110105031026",
      "street_key": "110105031000"
    },
    {
      "community_name": "北沙滩北社区居民委员会",
      "community_key": "110105031027",
      "street_key": "110105031000"
    },
    {
      "community_name": "新街坊社区居委会",
      "community_key": "110105032001",
      "street_key": "110105032000"
    },
    {
      "community_name": "立城苑社区居委会",
      "community_key": "110105032009",
      "street_key": "110105032000"
    },
    {
      "community_name": "北苑一号院社区居委会",
      "community_key": "110105032013",
      "street_key": "110105032000"
    },
    {
      "community_name": "北苑二号院社区居委会",
      "community_key": "110105032014",
      "street_key": "110105032000"
    },
    {
      "community_name": "北苑三号院社区居委会",
      "community_key": "110105032015",
      "street_key": "110105032000"
    },
    {
      "community_name": "北苑家园清友园社区居委会",
      "community_key": "110105032016",
      "street_key": "110105032000"
    },
    {
      "community_name": "北苑家园绣菊园社区居委会",
      "community_key": "110105032017",
      "street_key": "110105032000"
    },
    {
      "community_name": "北苑家园紫绶园社区居委会",
      "community_key": "110105032018",
      "street_key": "110105032000"
    },
    {
      "community_name": "朝来绿色家园社区居委会",
      "community_key": "110105032019",
      "street_key": "110105032000"
    },
    {
      "community_name": "时代庄园社区居委会",
      "community_key": "110105032020",
      "street_key": "110105032000"
    },
    {
      "community_name": "青年城社区居委会",
      "community_key": "110105032021",
      "street_key": "110105032000"
    },
    {
      "community_name": "莲葩园社区居委会",
      "community_key": "110105032022",
      "street_key": "110105032000"
    },
    {
      "community_name": "茉藜园社区居委会",
      "community_key": "110105032023",
      "street_key": "110105032000"
    },
    {
      "community_name": "黄金苑社区居委会",
      "community_key": "110105032024",
      "street_key": "110105032000"
    },
    {
      "community_name": "立清路第一社区居委会",
      "community_key": "110105032025",
      "street_key": "110105032000"
    },
    {
      "community_name": "广达路社区居委会",
      "community_key": "110105032026",
      "street_key": "110105032000"
    },
    {
      "community_name": "清苑路第一社区居委会",
      "community_key": "110105032027",
      "street_key": "110105032000"
    },
    {
      "community_name": "红军营社区居委会",
      "community_key": "110105032028",
      "street_key": "110105032000"
    },
    {
      "community_name": "北卫家园社区居民委员会",
      "community_key": "110105032029",
      "street_key": "110105032000"
    },
    {
      "community_name": "清河营中路社区居民委员会",
      "community_key": "110105032030",
      "street_key": "110105032000"
    },
    {
      "community_name": "清苑路第二社区居民委员会",
      "community_key": "110105032031",
      "street_key": "110105032000"
    },
    {
      "community_name": "清苑路第三社区居民委员会",
      "community_key": "110105032032",
      "street_key": "110105032000"
    },
    {
      "community_name": "北苑社区居民委员会",
      "community_key": "110105032033",
      "street_key": "110105032000"
    },
    {
      "community_name": "清苑路第四社区居民委员会",
      "community_key": "110105032034",
      "street_key": "110105032000"
    },
    {
      "community_name": "朝来绿色家园东社区居民委员会",
      "community_key": "110105032035",
      "street_key": "110105032000"
    },
    {
      "community_name": "筑华年社区居民委员会",
      "community_key": "110105032036",
      "street_key": "110105032000"
    },
    {
      "community_name": "立清路第二社区居民委员会",
      "community_key": "110105032037",
      "street_key": "110105032000"
    },
    {
      "community_name": "清苑路第五社区居民委员会",
      "community_key": "110105032038",
      "street_key": "110105032000"
    },
    {
      "community_name": "广顺社区居民委员会",
      "community_key": "110105032039",
      "street_key": "110105032000"
    },
    {
      "community_name": "红军营村委会",
      "community_key": "110105032201",
      "street_key": "110105032000"
    },
    {
      "community_name": "北湖渠村委会",
      "community_key": "110105032202",
      "street_key": "110105032000"
    },
    {
      "community_name": "来广营村委会",
      "community_key": "110105032203",
      "street_key": "110105032000"
    },
    {
      "community_name": "新生村委会",
      "community_key": "110105032204",
      "street_key": "110105032000"
    },
    {
      "community_name": "清河营村委会",
      "community_key": "110105032205",
      "street_key": "110105032000"
    },
    {
      "community_name": "荟万鸿社区居委会",
      "community_key": "110105033002",
      "street_key": "110105033000"
    },
    {
      "community_name": "鑫兆佳园社区居委会",
      "community_key": "110105033003",
      "street_key": "110105033000"
    },
    {
      "community_name": "万象新天社区居委会",
      "community_key": "110105033004",
      "street_key": "110105033000"
    },
    {
      "community_name": "常营民族家园社区居委会",
      "community_key": "110105033005",
      "street_key": "110105033000"
    },
    {
      "community_name": "连心园社区居委会",
      "community_key": "110105033006",
      "street_key": "110105033000"
    },
    {
      "community_name": "苹果派社区居委会",
      "community_key": "110105033007",
      "street_key": "110105033000"
    },
    {
      "community_name": "常营福第社区居委会",
      "community_key": "110105033008",
      "street_key": "110105033000"
    },
    {
      "community_name": "畅心阳光社区居委会",
      "community_key": "110105033009",
      "street_key": "110105033000"
    },
    {
      "community_name": "常营保利社区居委会",
      "community_key": "110105033010",
      "street_key": "110105033000"
    },
    {
      "community_name": "丽景园社区居委会",
      "community_key": "110105033011",
      "street_key": "110105033000"
    },
    {
      "community_name": "住欣家园社区居委会",
      "community_key": "110105033012",
      "street_key": "110105033000"
    },
    {
      "community_name": "东方华庭社区居委会",
      "community_key": "110105033013",
      "street_key": "110105033000"
    },
    {
      "community_name": "鑫兆佳园北社区居民委员会",
      "community_key": "110105033014",
      "street_key": "110105033000"
    },
    {
      "community_name": "万象新天北社区居民委员会",
      "community_key": "110105033015",
      "street_key": "110105033000"
    },
    {
      "community_name": "燕保汇鸿家园社区居民委员会",
      "community_key": "110105033016",
      "street_key": "110105033000"
    },
    {
      "community_name": "燕保常营家园社区居民委员会",
      "community_key": "110105033017",
      "street_key": "110105033000"
    },
    {
      "community_name": "福怡苑社区居委会",
      "community_key": "110105034001",
      "street_key": "110105034000"
    },
    {
      "community_name": "三间房南里社区居委会",
      "community_key": "110105034003",
      "street_key": "110105034000"
    },
    {
      "community_name": "定南里社区居委会",
      "community_key": "110105034004",
      "street_key": "110105034000"
    },
    {
      "community_name": "定北里社区居委会",
      "community_key": "110105034005",
      "street_key": "110105034000"
    },
    {
      "community_name": "定西北里社区居委会",
      "community_key": "110105034006",
      "street_key": "110105034000"
    },
    {
      "community_name": "定西南里社区居委会",
      "community_key": "110105034007",
      "street_key": "110105034000"
    },
    {
      "community_name": "双桥铁路社区居委会",
      "community_key": "110105034008",
      "street_key": "110105034000"
    },
    {
      "community_name": "双桥路社区居委会",
      "community_key": "110105034009",
      "street_key": "110105034000"
    },
    {
      "community_name": "双柳社区居委会",
      "community_key": "110105034010",
      "street_key": "110105034000"
    },
    {
      "community_name": "双惠苑社区居委会",
      "community_key": "110105034013",
      "street_key": "110105034000"
    },
    {
      "community_name": "绿洲家园社区居委会",
      "community_key": "110105034014",
      "street_key": "110105034000"
    },
    {
      "community_name": "艺水芳园社区居委会",
      "community_key": "110105034015",
      "street_key": "110105034000"
    },
    {
      "community_name": "美然动力社区居委会",
      "community_key": "110105034016",
      "street_key": "110105034000"
    },
    {
      "community_name": "聚福苑社区居委会",
      "community_key": "110105034026",
      "street_key": "110105034000"
    },
    {
      "community_name": "泰福苑社区居委会",
      "community_key": "110105034027",
      "street_key": "110105034000"
    },
    {
      "community_name": "三间房东村村委会",
      "community_key": "110105034200",
      "street_key": "110105034000"
    },
    {
      "community_name": "三间房西村村委会",
      "community_key": "110105034201",
      "street_key": "110105034000"
    },
    {
      "community_name": "定福庄东村村委会",
      "community_key": "110105034202",
      "street_key": "110105034000"
    },
    {
      "community_name": "定福庄西村村委会",
      "community_key": "110105034203",
      "street_key": "110105034000"
    },
    {
      "community_name": "褡裢坡村村委会",
      "community_key": "110105034204",
      "street_key": "110105034000"
    },
    {
      "community_name": "白家楼村村委会",
      "community_key": "110105034205",
      "street_key": "110105034000"
    },
    {
      "community_name": "东柳村村委会",
      "community_key": "110105034207",
      "street_key": "110105034000"
    },
    {
      "community_name": "西柳村村委会",
      "community_key": "110105034208",
      "street_key": "110105034000"
    },
    {
      "community_name": "新房村村委会",
      "community_key": "110105034209",
      "street_key": "110105034000"
    },
    {
      "community_name": "北双桥村村委会",
      "community_key": "110105034210",
      "street_key": "110105034000"
    },
    {
      "community_name": "金家村村委会",
      "community_key": "110105034211",
      "street_key": "110105034000"
    },
    {
      "community_name": "八里桥社区居委会",
      "community_key": "110105035001",
      "street_key": "110105035000"
    },
    {
      "community_name": "管庄东里社区居委会",
      "community_key": "110105035002",
      "street_key": "110105035000"
    },
    {
      "community_name": "管庄西里社区居委会",
      "community_key": "110105035003",
      "street_key": "110105035000"
    },
    {
      "community_name": "建东苑社区居委会",
      "community_key": "110105035004",
      "street_key": "110105035000"
    },
    {
      "community_name": "京通苑社区居委会",
      "community_key": "110105035005",
      "street_key": "110105035000"
    },
    {
      "community_name": "丽景苑社区居委会",
      "community_key": "110105035006",
      "street_key": "110105035000"
    },
    {
      "community_name": "惠河东里社区居委会",
      "community_key": "110105035007",
      "street_key": "110105035000"
    },
    {
      "community_name": "瑞祥里社区居委会",
      "community_key": "110105035008",
      "street_key": "110105035000"
    },
    {
      "community_name": "惠河西里社区居委会",
      "community_key": "110105035009",
      "street_key": "110105035000"
    },
    {
      "community_name": "新天地社区居委会",
      "community_key": "110105035010",
      "street_key": "110105035000"
    },
    {
      "community_name": "远洋一方嘉园社区居民委员会",
      "community_key": "110105035011",
      "street_key": "110105035000"
    },
    {
      "community_name": "管庄北里社区居民委员会",
      "community_key": "110105035012",
      "street_key": "110105035000"
    },
    {
      "community_name": "远洋一方润园社区居民委员会",
      "community_key": "110105035013",
      "street_key": "110105035000"
    },
    {
      "community_name": "新天地一社区居民委员会",
      "community_key": "110105035014",
      "street_key": "110105035000"
    },
    {
      "community_name": "西会村委会",
      "community_key": "110105035200",
      "street_key": "110105035000"
    },
    {
      "community_name": "东会村委会",
      "community_key": "110105035201",
      "street_key": "110105035000"
    },
    {
      "community_name": "八里桥村委会",
      "community_key": "110105035202",
      "street_key": "110105035000"
    },
    {
      "community_name": "果家店村委会",
      "community_key": "110105035203",
      "street_key": "110105035000"
    },
    {
      "community_name": "塔营村委会",
      "community_key": "110105035204",
      "street_key": "110105035000"
    },
    {
      "community_name": "小寺村委会",
      "community_key": "110105035205",
      "street_key": "110105035000"
    },
    {
      "community_name": "重兴寺村委会",
      "community_key": "110105035206",
      "street_key": "110105035000"
    },
    {
      "community_name": "司辛庄村委会",
      "community_key": "110105035207",
      "street_key": "110105035000"
    },
    {
      "community_name": "郭家场村委会",
      "community_key": "110105035208",
      "street_key": "110105035000"
    },
    {
      "community_name": "杨闸村委会",
      "community_key": "110105035209",
      "street_key": "110105035000"
    },
    {
      "community_name": "管庄村村委会",
      "community_key": "110105035210",
      "street_key": "110105035000"
    },
    {
      "community_name": "咸宁侯村委会",
      "community_key": "110105035211",
      "street_key": "110105035000"
    },
    {
      "community_name": "朝阳农场地区居委会",
      "community_key": "110105036001",
      "street_key": "110105036000"
    },
    {
      "community_name": "楼梓庄居委会",
      "community_key": "110105036003",
      "street_key": "110105036000"
    },
    {
      "community_name": "金泽家园社区居委会",
      "community_key": "110105036004",
      "street_key": "110105036000"
    },
    {
      "community_name": "金盏嘉园第一社区居委会",
      "community_key": "110105036005",
      "street_key": "110105036000"
    },
    {
      "community_name": "金盏嘉园第二社区居委会",
      "community_key": "110105036006",
      "street_key": "110105036000"
    },
    {
      "community_name": "金泽家园北社区居委会",
      "community_key": "110105036007",
      "street_key": "110105036000"
    },
    {
      "community_name": "雷庄村村委会",
      "community_key": "110105036200",
      "street_key": "110105036000"
    },
    {
      "community_name": "东大队村村委会",
      "community_key": "110105036201",
      "street_key": "110105036000"
    },
    {
      "community_name": "西大队村村委会",
      "community_key": "110105036202",
      "street_key": "110105036000"
    },
    {
      "community_name": "小店村村委会",
      "community_key": "110105036203",
      "street_key": "110105036000"
    },
    {
      "community_name": "长店村村委会",
      "community_key": "110105036204",
      "street_key": "110105036000"
    },
    {
      "community_name": "北马房村村委会",
      "community_key": "110105036205",
      "street_key": "110105036000"
    },
    {
      "community_name": "楼梓庄村委会",
      "community_key": "110105036206",
      "street_key": "110105036000"
    },
    {
      "community_name": "沙窝村委会",
      "community_key": "110105036207",
      "street_key": "110105036000"
    },
    {
      "community_name": "黎各庄村委会",
      "community_key": "110105036208",
      "street_key": "110105036000"
    },
    {
      "community_name": "马各庄村委会",
      "community_key": "110105036209",
      "street_key": "110105036000"
    },
    {
      "community_name": "皮村村委会",
      "community_key": "110105036210",
      "street_key": "110105036000"
    },
    {
      "community_name": "东窑村委会",
      "community_key": "110105036211",
      "street_key": "110105036000"
    },
    {
      "community_name": "曹各庄村委会",
      "community_key": "110105036212",
      "street_key": "110105036000"
    },
    {
      "community_name": "康营家园一社区",
      "community_key": "110105037001",
      "street_key": "110105037000"
    },
    {
      "community_name": "康营家园二社区",
      "community_key": "110105037002",
      "street_key": "110105037000"
    },
    {
      "community_name": "康营家园三社区",
      "community_key": "110105037003",
      "street_key": "110105037000"
    },
    {
      "community_name": "康营家园四社区",
      "community_key": "110105037004",
      "street_key": "110105037000"
    },
    {
      "community_name": "下辛堡社区",
      "community_key": "110105037005",
      "street_key": "110105037000"
    },
    {
      "community_name": "景润苑社区",
      "community_key": "110105037006",
      "street_key": "110105037000"
    },
    {
      "community_name": "孙河村",
      "community_key": "110105037200",
      "street_key": "110105037000"
    },
    {
      "community_name": "康营村",
      "community_key": "110105037203",
      "street_key": "110105037000"
    },
    {
      "community_name": "北甸东村",
      "community_key": "110105037204",
      "street_key": "110105037000"
    },
    {
      "community_name": "北甸西村",
      "community_key": "110105037205",
      "street_key": "110105037000"
    },
    {
      "community_name": "西甸村",
      "community_key": "110105037206",
      "street_key": "110105037000"
    },
    {
      "community_name": "下辛堡村",
      "community_key": "110105037207",
      "street_key": "110105037000"
    },
    {
      "community_name": "上辛堡村",
      "community_key": "110105037208",
      "street_key": "110105037000"
    },
    {
      "community_name": "黄港村",
      "community_key": "110105037209",
      "street_key": "110105037000"
    },
    {
      "community_name": "李县坟村",
      "community_key": "110105037210",
      "street_key": "110105037000"
    },
    {
      "community_name": "雷桥村",
      "community_key": "110105037211",
      "street_key": "110105037000"
    },
    {
      "community_name": "沈家坟村",
      "community_key": "110105037212",
      "street_key": "110105037000"
    },
    {
      "community_name": "沙子营村",
      "community_key": "110105037213",
      "street_key": "110105037000"
    },
    {
      "community_name": "苇沟村",
      "community_key": "110105037214",
      "street_key": "110105037000"
    },
    {
      "community_name": "马南里社区居委会",
      "community_key": "110105038001",
      "street_key": "110105038000"
    },
    {
      "community_name": "京旺家园第一社区居民委员会",
      "community_key": "110105038008",
      "street_key": "110105038000"
    },
    {
      "community_name": "京旺家园第二社区居民委员会",
      "community_key": "110105038009",
      "street_key": "110105038000"
    },
    {
      "community_name": "燕保马泉营家园社区居民委员会",
      "community_key": "110105038010",
      "street_key": "110105038000"
    },
    {
      "community_name": "东洲家园社区居民委员会",
      "community_key": "110105038011",
      "street_key": "110105038000"
    },
    {
      "community_name": "广善第一社区居委会",
      "community_key": "110105038012",
      "street_key": "110105038000"
    },
    {
      "community_name": "新锦社区居民委员会",
      "community_key": "110105038013",
      "street_key": "110105038000"
    },
    {
      "community_name": "崔各庄村委会",
      "community_key": "110105038200",
      "street_key": "110105038000"
    },
    {
      "community_name": "善各庄村委会",
      "community_key": "110105038201",
      "street_key": "110105038000"
    },
    {
      "community_name": "何各庄村委会",
      "community_key": "110105038202",
      "street_key": "110105038000"
    },
    {
      "community_name": "马泉营村委会",
      "community_key": "110105038203",
      "street_key": "110105038000"
    },
    {
      "community_name": "奶东村委会",
      "community_key": "110105038204",
      "street_key": "110105038000"
    },
    {
      "community_name": "奶西村委会",
      "community_key": "110105038205",
      "street_key": "110105038000"
    },
    {
      "community_name": "索家村委会",
      "community_key": "110105038206",
      "street_key": "110105038000"
    },
    {
      "community_name": "费家村委会",
      "community_key": "110105038207",
      "street_key": "110105038000"
    },
    {
      "community_name": "南皋村委会",
      "community_key": "110105038208",
      "street_key": "110105038000"
    },
    {
      "community_name": "望京村委会",
      "community_key": "110105038209",
      "street_key": "110105038000"
    },
    {
      "community_name": "草场地村委会",
      "community_key": "110105038210",
      "street_key": "110105038000"
    },
    {
      "community_name": "东辛店村委会",
      "community_key": "110105038211",
      "street_key": "110105038000"
    },
    {
      "community_name": "北皋村委会",
      "community_key": "110105038212",
      "street_key": "110105038000"
    },
    {
      "community_name": "东营村委会",
      "community_key": "110105038213",
      "street_key": "110105038000"
    },
    {
      "community_name": "黑桥村委会",
      "community_key": "110105038214",
      "street_key": "110105038000"
    },
    {
      "community_name": "高杨树社区居委会",
      "community_key": "110105039001",
      "street_key": "110105039000"
    },
    {
      "community_name": "红松园社区居委会",
      "community_key": "110105039006",
      "street_key": "110105039000"
    },
    {
      "community_name": "红松园北里社区居委会",
      "community_key": "110105039007",
      "street_key": "110105039000"
    },
    {
      "community_name": "康静里社区居委会",
      "community_key": "110105039011",
      "street_key": "110105039000"
    },
    {
      "community_name": "东坝家园社区居委会",
      "community_key": "110105039020",
      "street_key": "110105039000"
    },
    {
      "community_name": "奥林匹克花园社区居委会",
      "community_key": "110105039021",
      "street_key": "110105039000"
    },
    {
      "community_name": "朝阳新城社区居委会",
      "community_key": "110105039024",
      "street_key": "110105039000"
    },
    {
      "community_name": "丽富嘉园社区居委会",
      "community_key": "110105039025",
      "street_key": "110105039000"
    },
    {
      "community_name": "常青藤社区居委会",
      "community_key": "110105039026",
      "street_key": "110105039000"
    },
    {
      "community_name": "景和园社区居委会",
      "community_key": "110105039027",
      "street_key": "110105039000"
    },
    {
      "community_name": "东泽园社区居委会",
      "community_key": "110105039028",
      "street_key": "110105039000"
    },
    {
      "community_name": "悦和园社区居民委员会",
      "community_key": "110105039029",
      "street_key": "110105039000"
    },
    {
      "community_name": "金驹家园第一社区居民委员会",
      "community_key": "110105039030",
      "street_key": "110105039000"
    },
    {
      "community_name": "金驹家园第二社区居民委员会",
      "community_key": "110105039031",
      "street_key": "110105039000"
    },
    {
      "community_name": "福润四季社区居民委员会",
      "community_key": "110105039032",
      "street_key": "110105039000"
    },
    {
      "community_name": "坝鑫家园社区居民委员会",
      "community_key": "110105039033",
      "street_key": "110105039000"
    },
    {
      "community_name": "朝阳新城第二社区居民委员会",
      "community_key": "110105039034",
      "street_key": "110105039000"
    },
    {
      "community_name": "汇景苑社区居民委员会",
      "community_key": "110105039035",
      "street_key": "110105039000"
    },
    {
      "community_name": "郑村社区居民委员会",
      "community_key": "110105039036",
      "street_key": "110105039000"
    },
    {
      "community_name": "福园第一社区居民委员会",
      "community_key": "110105039037",
      "street_key": "110105039000"
    },
    {
      "community_name": "润泽社区居民委员会",
      "community_key": "110105039038",
      "street_key": "110105039000"
    },
    {
      "community_name": "东湾社区居民委员会",
      "community_key": "110105039039",
      "street_key": "110105039000"
    },
    {
      "community_name": "福园第二社区居民委员会",
      "community_key": "110105039040",
      "street_key": "110105039000"
    },
    {
      "community_name": "七棵树村委会",
      "community_key": "110105039200",
      "street_key": "110105039000"
    },
    {
      "community_name": "单店村委会",
      "community_key": "110105039201",
      "street_key": "110105039000"
    },
    {
      "community_name": "西北门村委会",
      "community_key": "110105039202",
      "street_key": "110105039000"
    },
    {
      "community_name": "后街村委会",
      "community_key": "110105039203",
      "street_key": "110105039000"
    },
    {
      "community_name": "东风村村委会",
      "community_key": "110105039204",
      "street_key": "110105039000"
    },
    {
      "community_name": "驹子房村委会",
      "community_key": "110105039205",
      "street_key": "110105039000"
    },
    {
      "community_name": "三岔河村委会",
      "community_key": "110105039206",
      "street_key": "110105039000"
    },
    {
      "community_name": "焦庄村村委会",
      "community_key": "110105039207",
      "street_key": "110105039000"
    },
    {
      "community_name": "东晓景村委会",
      "community_key": "110105039208",
      "street_key": "110105039000"
    },
    {
      "community_name": "大街社区居委会",
      "community_key": "110105039008",
      "street_key": "110105039000"
    },
    {
      "community_name": "双桥第一社区居委会",
      "community_key": "110105040001",
      "street_key": "110105040000"
    },
    {
      "community_name": "双桥第二社区居委会",
      "community_key": "110105040002",
      "street_key": "110105040000"
    },
    {
      "community_name": "康城社区居委会",
      "community_key": "110105040003",
      "street_key": "110105040000"
    },
    {
      "community_name": "怡景城社区居委会",
      "community_key": "110105040004",
      "street_key": "110105040000"
    },
    {
      "community_name": "旭园社区居委会",
      "community_key": "110105040005",
      "street_key": "110105040000"
    },
    {
      "community_name": "东旭社区居委会",
      "community_key": "110105040006",
      "street_key": "110105040000"
    },
    {
      "community_name": "双桥第三社区居委会",
      "community_key": "110105040007",
      "street_key": "110105040000"
    },
    {
      "community_name": "大鲁店一村委会",
      "community_key": "110105040200",
      "street_key": "110105040000"
    },
    {
      "community_name": "大鲁店二村委会",
      "community_key": "110105040201",
      "street_key": "110105040000"
    },
    {
      "community_name": "大鲁店三村委会",
      "community_key": "110105040202",
      "street_key": "110105040000"
    },
    {
      "community_name": "小鲁店村委会",
      "community_key": "110105040203",
      "street_key": "110105040000"
    },
    {
      "community_name": "郎各庄村委会",
      "community_key": "110105040204",
      "street_key": "110105040000"
    },
    {
      "community_name": "郎辛庄村委会",
      "community_key": "110105040205",
      "street_key": "110105040000"
    },
    {
      "community_name": "万子营西村委会",
      "community_key": "110105040206",
      "street_key": "110105040000"
    },
    {
      "community_name": "万子营东村委会",
      "community_key": "110105040207",
      "street_key": "110105040000"
    },
    {
      "community_name": "黑庄户村委会",
      "community_key": "110105040208",
      "street_key": "110105040000"
    },
    {
      "community_name": "四合庄村委会",
      "community_key": "110105040209",
      "street_key": "110105040000"
    },
    {
      "community_name": "定辛庄西村委会",
      "community_key": "110105040210",
      "street_key": "110105040000"
    },
    {
      "community_name": "定辛庄东村委会",
      "community_key": "110105040211",
      "street_key": "110105040000"
    },
    {
      "community_name": "双树南村委会",
      "community_key": "110105040212",
      "street_key": "110105040000"
    },
    {
      "community_name": "双树北村委会",
      "community_key": "110105040213",
      "street_key": "110105040000"
    },
    {
      "community_name": "苏坟村委会",
      "community_key": "110105040214",
      "street_key": "110105040000"
    },
    {
      "community_name": "么铺村委会",
      "community_key": "110105040215",
      "street_key": "110105040000"
    },
    {
      "community_name": "青青家园社区居委会",
      "community_key": "110105041003",
      "street_key": "110105041000"
    },
    {
      "community_name": "绿丰家园社区居委会",
      "community_key": "110105041004",
      "street_key": "110105041000"
    },
    {
      "community_name": "阳光家园社区居委会",
      "community_key": "110105041005",
      "street_key": "110105041000"
    },
    {
      "community_name": "京城雅居社区居委会",
      "community_key": "110105041006",
      "street_key": "110105041000"
    },
    {
      "community_name": "文化传播社区居委会",
      "community_key": "110105041007",
      "street_key": "110105041000"
    },
    {
      "community_name": "朝丰家园社区居委会",
      "community_key": "110105041008",
      "street_key": "110105041000"
    },
    {
      "community_name": "富力又一城第一社区居委会",
      "community_key": "110105041010",
      "street_key": "110105041000"
    },
    {
      "community_name": "富力又一城第二社区居委会",
      "community_key": "110105041011",
      "street_key": "110105041000"
    },
    {
      "community_name": "明德园社区居民委员会",
      "community_key": "110105041012",
      "street_key": "110105041000"
    },
    {
      "community_name": "青荷里社区居民委员会",
      "community_key": "110105041013",
      "street_key": "110105041000"
    },
    {
      "community_name": "御景湾社区居民委员会",
      "community_key": "110105041014",
      "street_key": "110105041000"
    },
    {
      "community_name": "宸欣园社区居民委员会",
      "community_key": "110105041015",
      "street_key": "110105041000"
    },
    {
      "community_name": "豆各庄村委会",
      "community_key": "110105041200",
      "street_key": "110105041000"
    },
    {
      "community_name": "马家湾村委会",
      "community_key": "110105041201",
      "street_key": "110105041000"
    },
    {
      "community_name": "水牛坊村委会",
      "community_key": "110105041202",
      "street_key": "110105041000"
    },
    {
      "community_name": "孙家坡村委会",
      "community_key": "110105041203",
      "street_key": "110105041000"
    },
    {
      "community_name": "孟家屯村委会",
      "community_key": "110105041204",
      "street_key": "110105041000"
    },
    {
      "community_name": "东马各庄村委会",
      "community_key": "110105041205",
      "street_key": "110105041000"
    },
    {
      "community_name": "西马各庄村委会",
      "community_key": "110105041206",
      "street_key": "110105041000"
    },
    {
      "community_name": "于家围南队村委会",
      "community_key": "110105041207",
      "street_key": "110105041000"
    },
    {
      "community_name": "于家围北队村委会",
      "community_key": "110105041208",
      "street_key": "110105041000"
    },
    {
      "community_name": "南何家村村委会",
      "community_key": "110105041209",
      "street_key": "110105041000"
    },
    {
      "community_name": "石槽村村委会",
      "community_key": "110105041210",
      "street_key": "110105041000"
    },
    {
      "community_name": "黄厂村村委会",
      "community_key": "110105041211",
      "street_key": "110105041000"
    },
    {
      "community_name": "观音堂社区居委会",
      "community_key": "110105042001",
      "street_key": "110105042000"
    },
    {
      "community_name": "白鹿社区居委会",
      "community_key": "110105042002",
      "street_key": "110105042000"
    },
    {
      "community_name": "官悦欣园社区居委会",
      "community_key": "110105042013",
      "street_key": "110105042000"
    },
    {
      "community_name": "观音堂二社区居民委员会",
      "community_key": "110105042014",
      "street_key": "110105042000"
    },
    {
      "community_name": "海棠社区居民委员会",
      "community_key": "110105042015",
      "street_key": "110105042000"
    },
    {
      "community_name": "官庄大队村委会",
      "community_key": "110105042200",
      "street_key": "110105042000"
    },
    {
      "community_name": "观音堂大队村委会",
      "community_key": "110105042201",
      "street_key": "110105042000"
    },
    {
      "community_name": "王四营大队村委会",
      "community_key": "110105042202",
      "street_key": "110105042000"
    },
    {
      "community_name": "南花园大队村委会",
      "community_key": "110105042203",
      "street_key": "110105042000"
    },
    {
      "community_name": "道口大队村委会",
      "community_key": "110105042204",
      "street_key": "110105042000"
    },
    {
      "community_name": "孛罗营大队村委会",
      "community_key": "110105042205",
      "street_key": "110105042000"
    },
    {
      "community_name": "望京西园社区居委会",
      "community_key": "110105043001",
      "street_key": "110105043000"
    },
    {
      "community_name": "南湖东园北社区居委会",
      "community_key": "110105043002",
      "street_key": "110105043000"
    },
    {
      "community_name": "南湖中园北社区居委会",
      "community_key": "110105043003",
      "street_key": "110105043000"
    },
    {
      "community_name": "望京花园社区居委会",
      "community_key": "110105043004",
      "street_key": "110105043000"
    },
    {
      "community_name": "利泽西园一区社区居委会",
      "community_key": "110105043005",
      "street_key": "110105043000"
    },
    {
      "community_name": "果岭里社区居委会",
      "community_key": "110105043006",
      "street_key": "110105043000"
    },
    {
      "community_name": "望湖社区居委会",
      "community_key": "110105043007",
      "street_key": "110105043000"
    },
    {
      "community_name": "大望京社区居委会",
      "community_key": "110105043008",
      "street_key": "110105043000"
    },
    {
      "community_name": "东湖湾社区居委会",
      "community_key": "110105043009",
      "street_key": "110105043000"
    },
    {
      "community_name": "望京西园二区社区居民委员会",
      "community_key": "110105043010",
      "street_key": "110105043000"
    },
    {
      "community_name": "望京花园东社区居民委员会",
      "community_key": "110105043011",
      "street_key": "110105043000"
    },
    {
      "community_name": "康都佳园社区居民委员会",
      "community_key": "110105043012",
      "street_key": "110105043000"
    },
    {
      "community_name": "南路西里社区居委会",
      "community_key": "110105400001",
      "street_key": "110105400000"
    },
    {
      "community_name": "南路东里社区居委会",
      "community_key": "110105400002",
      "street_key": "110105400000"
    },
    {
      "community_name": "西平街社区居委会",
      "community_key": "110105400003",
      "street_key": "110105400000"
    },
    {
      "community_name": "南平里社区居委会",
      "community_key": "110105400004",
      "street_key": "110105400000"
    },
    {
      "community_name": "机场工作区社区",
      "community_key": "110105400400",
      "street_key": "110105400000"
    }
]

var data = [ {a: 1, b: 10}, {a: 2, b: 20}, {a: 1, b: 30} ];

var res = alasql('SELECT a, SUM(b) AS b FROM ? GROUP BY a',[data]);
console.log('qqq', res)

function ExpireTimeRender(value) {
    const m = moment(value)
    let color
    if (m.isBefore(moment().add(7, 'days'))) {
        color = 'red'
    }
    else if (m.isBefore(moment().add(30, 'days'))) {
        color = 'orange'
    }
    return (
        <div style={{ color }}>{m.format('YYYY-MM-DD HH:mm:ss')}</div>
    )
}

export function AlasqlHome({ config, onUploaded }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curIp, setCurIp] = useState('--')

    const [datas, setDatas] = useState([])
    const [results, setResults] = useState([])
    const [code, setCode] = useState('SELECT street_key FROM ?')


    // async function loadData() {
    //     let res = await request.get('https://nodeapi.yunser.com/ip/me')
    //     console.log('res', res)
    //     if (res.success) {
    //         setCurIp(res.data)
    //     }
    // }

    useEffect(() => {
        // loadData()
    }, [])

    async function uploadJson(json) {
        let res = await request.post(`${config.host}/mysql/connect`, {
            type: 'alasql',
            jsonList: json,
        })
        console.log('res', res)
        if (res.success) {
            // setCurIp(res.data)
            onUploaded && onUploaded(res.data)

        }
    }

    return (
        <div className={styles.app}
            onDragOver={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
            onDrop={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const file = e.dataTransfer.files[0]
                console.log('file', file)
                // uploadFile({ file })
                const reader = new FileReader()
                reader.onload = async () => {
                    console.log(reader.result)
                    let workbook = read(reader.result, {
                        type: 'binary'
                    })
                    let sheets = workbook.Sheets;

                    let names = []
                    for (let sheet in sheets) {
                        if (sheets.hasOwnProperty(sheet)) {
                            const json = utils.sheet_to_json(sheets[sheet])
                            console.log('json', json)
                            uploadJson(json)
                            break
                        }
                    }

                    // names = names[0]
                    // console.log('names', names)
                    // const root = JSON.parse((reader.result) as any)
                    // const nodes_will = await parseRoot(page)
                    // console.log('nodes_will', nodes_will)

                    // editor.current.setNodes(nodes_will.children)
                }
                // reader.readAsText(file, 'utf-8')
                reader.readAsBinaryString(file)
                // var reader = new FileReader();
                //读取成功
            }}
        >
            拖拽 xlsx 文件上传
        </div>
    )
}

