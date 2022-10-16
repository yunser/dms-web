import React, { useMemo, useState, useEffect, useRef } from 'react'
// import ReactEcharts from 'echarts-for-react';
import {
    Input,
    Row,
    Col,
    Card,
    Divider,
    Tooltip,
    Button,
    message,
    Select,
    Space,
    Empty,
    List,
    Typography,
    Descriptions,
    Upload,
    Table,
    Tabs,
    Radio,
    Popover,
    Form,
} from 'antd'
import iterate from 'iterare'
// import {
//     QuestionCircleOutlined,
//     CopyOutlined,
//     SaveOutlined,
//     SendOutlined,
//     UploadOutlined,
//     InboxOutlined,
// } from '@ant-design/icons'
import { saveAs } from 'file-saver'
// import styles from './editor.less'
import classes from './viewer.module.less'
import classnames from 'classnames'
import GridLayout from 'react-grid-layout'
import copy from 'copy-to-clipboard'
import CloseCircleOutlined from '@ant-design/icons/lib/icons/CloseCircleOutlined'
import { TextRule } from './rule'
import { Parser } from './parser'
import moment from 'moment'
import { Filter, Filters } from '@/components/filters'
import { CommonTable } from '@/components/table/table';
import fileSize from 'filesize'
import work from 'webworkify-webpack';
import { HttpEditor } from '../editor';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useSearchParams,
} from "react-router-dom";


const format_default = `$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"`

const FormItem = Form.Item;

const { Search } = Input
const { TextArea } = Input
const { Dragger } = Upload;
const { Option } = Select
const { TabPane } = Tabs;

function getTime(result, field) {
    let map = {
        t0_500: 0,
        t500_1000: 0,
        t1000_3000: 0,
        t3000_5000: 0,
        t5000: 0
    }
    for (let item of result) {
        item.responseTime = parseFloat(item.request_time || 0)
        if (item.responseTime < 500) {
            map.t0_500++
        } else if (item.responseTime < 1000) {
            map.t500_1000++
        } else if (item.responseTime < 3000) {
            map.t1000_3000++
        } else if (item.responseTime < 5000) {
            map.t3000_5000++
        } else if (item.responseTime > 5000) {
            map.t5000++
        }
    }
    let newResult = []
    for (let key in map) {
        newResult.push({
            name: key,
            times: map[key],
            percent: (map[key] / result.length * 100).toFixed(2)
        })
    }
    newResult = newResult.sort((a, b) => {
        return b.times - a.times
    })
    return newResult.slice(0, 10)
}

function hasValue(value: any) {
    // return value !== null && value !== undefined;
    return !!value || value === 0 || value === false;
}


export function Viewer() {
    
    let [searchParams, setSearchParams] = useSearchParams();

    const host = searchParams.get('host')
    console.log('host', host)

    const [config, setConfig] = useState({
        format: format_default,
    })
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('')

    const [keyword, setKeyword] = useState('')




    // console.log('item', list[0])

    

    return (
        <div className={classes.viewer}>
            <div>
                {/* <Tabs
                    activeKey={tab}
                    onChange={key => {
                        setTab(key)
                    }}
                    // type="card"
                >
                    <TabPane tab="输入" key={TabKey.Input} />
                    <TabPane tab="记录" key={TabKey.Log} />
                    <TabPane tab="IP 统计" key={TabKey.Ip} />
                    <TabPane tab="爬虫分析" key={TabKey.Spider} />
                    <TabPane tab="时间分布分析" key={TabKey.Time} />
                    <TabPane tab="请求时间分析" key={TabKey.RequestTime} />
                    <TabPane tab="状态码统计" key={TabKey.Code} />
                    <TabPane tab="URL 统计" key={TabKey.Url} />
                    <TabPane tab="来源统计" key={TabKey.Referer} />
                    <TabPane tab="方法统计" key={TabKey.Method} />
                    <TabPane tab="设置" key={TabKey.Setting} />
                    
                </Tabs> */}
                
                
            </div>

            <HttpEditor
                host={host}
            />

            {/* <QuestionCircleOutlined className={classes.helpAndAbout}
                onClick={() => {
                    window.open('https://project.yunser.com/products/f236e1d016dc11e9a07ccda9c9b24cf0', '_blank')
                }}
            /> */}
        </div>
    )
}
