import { Button, Card, Col, Descriptions, Input, Radio, Row, Space, Spin, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './low-code-detail.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import moment from 'moment';
import axios from 'axios';
import { getGlobalConfig } from '@/config';
import { useSearchParams } from 'react-router-dom';
import ReactEcharts from 'echarts-for-react';

function UplinkStatus({ host }) {
    const [chartOption, setChartOption] = useState(null)
    const [loading, setLoading] = useState(true)
    const [rangeHour, setRangeHour] = useState(24)

    async function loadData() {
        setLoading(true)
        let res = await axios.get(`${host}/inner/uplinkStat`, {
            // id,
        })
        if (res.status == 200) {
            setLoading(false)
            const today = moment().format('YYYY-MM-DD')
            const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')
            const avgday = moment().subtract(2, 'days').format('YYYY-MM-DD')
            const weekAgoDay = moment().subtract(7, 'days').format('YYYY-MM-DD')
            const statusData = res.data.list
            .map(item => {
                return {
                    ...item,
                    timeFormat: moment(item.timeline).format('YYYY-MM-DD HH:mm'),
                    value: item.count,
                }
            })
            const todayStatusData = statusData.filter(item => {
                return item.timeFormat.startsWith(today)
            })
            const yesterdayStatusData = statusData.filter(item => {
                return item.timeFormat.startsWith(yesterday)
            })
            const avgStatusData = statusData.filter(item => {
                return item.timeFormat.startsWith(avgday)
            })
            const weekAgoStatusData = statusData.filter(item => {
                return item.timeFormat.startsWith(weekAgoDay)
            })
            const chartOption = {
                xAxis: {
                    type: 'category',
                    data: yesterdayStatusData.map(item => moment(item.timeline).format('HH:mm'))
                },
                yAxis: {
                    type: 'value'
                },
                legend: {
                    show: true,
                    data: ['今日', '昨日', '前日', '一周前']
                },
                tooltip: {
                    show: true,
                    // label: {
                    //     formatter() {
                    //         return '?'
                    //     }
                    // },
                },
                series: [
                    {
                        name: '今日',
                        type: 'line',
                        data: todayStatusData.map(item => {
                            return item.value
                        }),
                    },
                    {
                        name: '昨日',
                        type: 'line',
                        data: yesterdayStatusData.map(item => {
                            return item.value
                        }),
                    },
                    {
                        name: '前日',
                        type: 'line',
                        data: avgStatusData.map(item => {
                            return item.value
                        }),
                    },
                    {
                        name: '一周前',
                        type: 'line',
                        data: weekAgoStatusData.map(item => {
                            return item.value
                        }),
                    },
                    
                ]
            }
            setChartOption(chartOption)

        }
    }

    useEffect(() => {
        loadData()
    }, [rangeHour])

    if (loading || !chartOption) {
        return (
            <Spin />
        )
    }
    return (
        <div>
            <Space>
                <Button
                    onClick={() => {
                        loadData()
                    }}
                >
                    刷新
                </Button>
            </Space>
            <ReactEcharts
                style={{ height: '240px' }}
                option={chartOption}
                lazyUpdate={true}
            />
        </div>
    )
}

function IronStatus({ host }) {
    const [chartOption, setChartOption] = useState(null)
    const [loading, setLoading] = useState(true)
    const [rangeHour, setRangeHour] = useState(24)

    async function loadData() {
        setLoading(true)
        let res = await axios.get(`${host}/iron/statusList`, {
            // id,
        })
        if (res.status == 200) {
            setLoading(false)
            // console.log('iron/list', res.data)
            const statusData = res.data.list.map(item => {
                return {
                    ...item,
                    timeFormat: moment(item.time).format('YYYY-MM-DD HH:mm'),
                    timeTs: moment(item.time).toDate().getTime(),
                }
            })
            // console.log('statusData', statusData)
            // const totalMinute = 24 * 60
            const interval = 5
            const totalMinute = rangeHour * 60 / interval
            const msInterval = interval * 60 * 1000
            let hour24Data = []
            for (let min = 0; min < totalMinute; min++) {
                const time = moment().subtract(min * interval, 'minutes')
                const start = moment(new Date(Math.floor(time.toDate().getTime() / msInterval) * msInterval))
                console.log('start', start.format('YYYY-MM-DD HH:mm'))
                const end = start.clone().add(interval, 'minutes')
                const fItem = statusData.find(item => item.timeTs >= start.toDate().getTime() && item.timeTs < end.toDate().getTime())
                if (fItem) {
                    hour24Data.push({
                        time: time.format('YYYY-MM-DD HH:mm'),
                        status: fItem.status,
                    })
                }
                else {
                    hour24Data.push({
                        time: time.format('YYYY-MM-DD HH:mm'),
                        status: null,
                    })
                }
            }
            hour24Data = hour24Data.reverse()
            // console.log('hour24Data', hour24Data)
            // .reverse()
            const chartOption = {
                xAxis: {
                    type: 'category',
                    data: hour24Data.map(item => item.time)
                },
                yAxis: {
                    type: 'value'
                },
                tooltip: {
                    show: true,
                    label: {
                        formatter() {
                            return '?'
                        }
                    },
                },
                series: [
                    {
                        data: hour24Data.map(item => {
                            const isSuccess = item.status == 'success'
                            return {
                                // value: isSuccess ? 1 : 0,
                                value: 1,
                                // value: item.status ? 1 : null,
                                itemStyle: {
                                    // color: isSuccess ? 'green' : 'red',
                                    color: item.status ? (isSuccess ? 'green' : 'red') : '#999',
                                }
                            }
                        }),
                        type: 'bar'
                    }
                ]
            }
            setChartOption(chartOption)

        }
    }

    useEffect(() => {
        loadData()
    }, [rangeHour])

    if (loading || !chartOption) {
        return (
            <Spin />
        )
    }
    return (
        <div>
            <Space>
                <Button
                    onClick={() => {
                        loadData()
                    }}
                >
                    刷新
                </Button>
                <Radio.Group 
                    buttonStyle="solid"
                    value={rangeHour}
                    onChange={e => {
                        setRangeHour(e.target.value)
                    }}
                >
                    <Radio.Button value={1}>1小时</Radio.Button>
                    <Radio.Button value={24}>24 小时</Radio.Button>
                </Radio.Group>
            </Space>
            <ReactEcharts
                style={{ height: '240px' }}
                option={chartOption}
                lazyUpdate={true}
            />
        </div>
    )
}

function RedisStatus({ host }) {
    const [chartOption, setChartOption] = useState(null)
    const [loading, setLoading] = useState(true)
    const [rangeHour, setRangeHour] = useState(1)

    async function loadData() {
        setLoading(true)
        let res = await axios.get(`${host}/health/redisStatus?minute=${rangeHour * 60}`, {
            // id,
        })
        if (res.status == 200) {
            setLoading(false)
            // console.log('iron/list', res.data)
            const statusData = res.data.list.map(item => {
                return {
                    ...item,
                    timeFormat: moment(item.time).format('YYYY-MM-DD HH:mm'),
                    timeTs: moment(item.time).toDate().getTime(),
                }
            })
            // console.log('statusData', statusData)
            // const totalMinute = 24 * 60
            const interval = 1
            const totalMinute = rangeHour * 60 / interval
            const msInterval = interval * 60 * 1000
            let hour24Data = []
            for (let min = 0; min < totalMinute; min++) {
                const time = moment().subtract(min * interval, 'minutes')
                const start = moment(new Date(Math.floor(time.toDate().getTime() / msInterval) * msInterval))
                console.log('start', start.format('YYYY-MM-DD HH:mm'))
                const end = start.clone().add(interval, 'minutes')
                const fItem = statusData.find(item => item.timeTs >= start.toDate().getTime() && item.timeTs < end.toDate().getTime())
                if (fItem) {
                    hour24Data.push({
                        time: time.format('YYYY-MM-DD HH:mm'),
                        status: fItem.status,
                    })
                }
                else {
                    hour24Data.push({
                        time: time.format('YYYY-MM-DD HH:mm'),
                        status: null,
                    })
                }
            }
            hour24Data = hour24Data.reverse()
            // console.log('hour24Data', hour24Data)
            // .reverse()
            const chartOption = {
                xAxis: {
                    type: 'category',
                    data: hour24Data.map(item => item.time)
                },
                yAxis: {
                    type: 'value'
                },
                tooltip: {
                    show: true,
                    label: {
                        formatter() {
                            return '?'
                        }
                    },
                },
                series: [
                    {
                        data: hour24Data.map(item => {
                            const isSuccess = item.status == 'success'
                            return {
                                // value: isSuccess ? 1 : 0,
                                value: 1,
                                // value: item.status ? 1 : null,
                                itemStyle: {
                                    // color: isSuccess ? 'green' : 'red',
                                    color: item.status ? (isSuccess ? 'green' : 'red') : '#999',
                                }
                            }
                        }),
                        type: 'bar'
                    }
                ]
            }
            setChartOption(chartOption)

        }
    }

    useEffect(() => {
        loadData()
    }, [rangeHour])

    if (loading || !chartOption) {
        return (
            <Spin />
        )
    }
    return (
        <div>
            <Space>
                <Button
                    onClick={() => {
                        loadData()
                    }}
                >
                    刷新
                </Button>
                <Radio.Group 
                    buttonStyle="solid"
                    value={rangeHour}
                    onChange={e => {
                        setRangeHour(e.target.value)
                    }}
                >
                    <Radio.Button value={1}>1小时</Radio.Button>
                    <Radio.Button value={24}>24 小时</Radio.Button>
                </Radio.Group>
            </Space>
            <ReactEcharts
                style={{ height: '240px' }}
                option={chartOption}
                lazyUpdate={true}
            />
        </div>
    )
}


function DailyCheck({ host }) {
    const [chartOption, setChartOption] = useState(null)
    const [loading, setLoading] = useState(true)
    const [result, setResult] = useState('')

    async function loadData() {
        setLoading(true)
        let res = await axios.get(`${host}/inner/everyDayCheck?debug=1`, {
        })
        if (res.status == 200) {
            setResult(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return (
            <Spin />
        )
    }
    return (
        <div className={styles.dailyCheck}>
            <pre>{result}</pre>
        </div>
    )
}


function DeviceDetail({ host, id }) {

    const [device, setDevice ] = useState(null)
    async function loadData() {
        const res = await axios.get(`${host}/inner/quickDebug?deviceId=1647339599436825`)
        console.log('设备', res.data)
        setDevice(res.data.device)
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            {!!device &&
                <Descriptions column={1}>
                    <Descriptions.Item label="设备名称">
                        {device.deviceName}
                    </Descriptions.Item>
                    <Descriptions.Item label="productId">
                        {device.productId}
                    </Descriptions.Item>
                </Descriptions>
            }
        </div>
    )
}

function CareDetail({ host, id }) {

    const [device, setDevice ] = useState(null)
    async function loadData() {
        const res = await axios.get(`${host}/inner/quickDebug?careId=${id}`)
        console.log('设备', res.data)
        setDevice(res.data.care)
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            {!!device &&
                <Descriptions column={1}>
                    <Descriptions.Item label="住户名称">
                        {device.personName}
                    </Descriptions.Item>
                </Descriptions>
            }
        </div>
    )
}

function FamilyDetail({ host, id }) {

    const [device, setDevice ] = useState(null)
    async function loadData() {
        const res = await axios.get(`${host}/inner/quickDebug?familyId=${id}`)
        setDevice(res.data.family)
    }

    useEffect(() => {
        loadData()
    }, [])

    

    return (
        <div>
            {!!device &&
                <Descriptions column={1}>
                    <Descriptions.Item label="家庭名称">
                        {device.name}
                    </Descriptions.Item>
                </Descriptions>
            }
        </div>
    )
}

function QuickDebuger({ host, esPath = '', title, placeholder, queryKey = '' }) {
    const [imei, setImei] = useState('')

    return (
        <div>
            <Space>
                <div>
                    {title}:
                </div>
                <Input
                    value={imei}
                    onChange={e => {
                        setImei(e.target.value)
                    }}
                    placeholder={placeholder}
                />
                <Button
                    onClick={() => {
                        if (esPath) {
                            const url = `${host}${esPath.replace('{}', imei)}`
                            window.open(url)
                        }
                        else {
                            window.open(`${host}/inner/quickDebug?${queryKey}=${imei}`)
                        }
                        setImei('')
                    }}
                >
                    OK
                </Button>
            </Space>
        </div>
    )
}

function ConnectionList() {
    
    const [list, setList ] = useState([])
    

    return (
        <div>
            <Table
                dataSource={list}
                columns={[
                    {
                        title: '名称',
                        dataIndex: 'name',
                    },
                    {
                        title: '操作',
                        dataIndex: '_op',
                        render(_, item) {
                            return (
                                <Space>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            window.open(`/pages/low-code-detail?id=${item.id}`)
                                        }}
                                    >
                                        打开
                                    </Button>
                                </Space>
                            )
                        }
                    },
                ]}
            />
        </div>
    )
}

export function LowCodeDetail({ tabKey, onClickItem }) {
    const config = getGlobalConfig()
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [appDetail, setAppDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [chartOption, setChartOption] = useState(null)

    let [searchParams, setSearchParams] = useSearchParams();

    const id = searchParams.get('id')

    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/lowCode/detail`, {
            id,
        })
        if (res.success) {
            // const { list } = res.data
            // setList(list)
            const { data } = res
            document.title = `${data.name} - Lode Code`
            setLoading(false)
            setAppDetail(data)
            if (data.statusUrl) {
                let res2 = await axios.get(`${data.host}${data.statusUrl}`)
                if (res2.status == 200) {
                    console.log('status/', res2.data)
                    const statusData = res2.data.reverse()
                    const chartOption = {
                        xAxis: {
                            type: 'category',
                            data: statusData.map(item => item.date)
                        },
                        yAxis: {
                            type: 'value'
                        },
                        tooltip: {
                            show: true,
                            label: {
                                formatter() {
                                    return '?'
                                }
                            },
                        },
                        series: [
                            {
                                data: statusData.map(item => {
                                    const isSuccess = item.status == 'finish'
                                    return {
                                        value: isSuccess ? 1 : 0,
                                        itemStyle: {
                                            color: isSuccess ? 'green' : 'red',
                                        }
                                    }
                                }),
                                type: 'bar'
                            }
                        ]
                    }
                    setChartOption(chartOption)

                }
            }
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const host_asd = appDetail?.host
    // console.log('host/', host)
    
    const [deviceId, setDeviceId] = useState('')
    const [familyId, setFamilyId] = useState('')
    const [careId, setCareId] = useState('')
    const [projectId, setProjectId] = useState('')
    const [userId, setUserId] = useState('')
    const [nodeId, setNodeId] = useState('')
    const [alarmId, setAlarmId] = useState('')
    const [imei, setImei] = useState('')

    if (loading || !appDetail) {
        return (
            <Spin />
        )
    }

    return (
        <div className={styles.app}
            onKeyDown={(e) => {
                console.log('IP keydown 22222', e.target)
            }}
            >
            <div className={styles.appName}>{appDetail.name}</div>
            <Row gutter={16}>
                <Col span={12}>
                    {appDetail._crQuickDebug &&
                        <Card title="CR快速查询">
                            <div>
                                host: {appDetail.host}
                            </div>
                            <div>
                                <QuickDebuger
                                    title="设备"
                                    host={host_asd}
                                    placeholder="Device ID"
                                    queryKey="deviceId"
                                />
                                <QuickDebuger
                                    title="设备"
                                    host={host_asd}
                                    placeholder="IMEI"
                                    queryKey="imei"
                                />
                                <QuickDebuger
                                    title="设备ES"
                                    esPath="/inner/esRedirect/idx_device/type_device/{}"
                                    host={host_asd}
                                    placeholder="Device ID"
                                />
                                <QuickDebuger
                                    title="日记录"
                                    host={host_asd}
                                    placeholder="Device ID"
                                    queryKey="dayDeviceId"
                                />
                                <QuickDebuger
                                    title="日记录ES"
                                    esPath="/inner/esRedirect/idx_daily_record_202310/type_daily_stat/{}"
                                    host={host_asd}
                                    placeholder="Device ID"
                                />
                                <QuickDebuger
                                    title="月记录"
                                    host={host_asd}
                                    placeholder="Device ID"
                                    queryKey="monthDeviceId"
                                />
                                <QuickDebuger
                                    title="服务商"
                                    host={host_asd}
                                    placeholder="Servicer ID"
                                    queryKey="servicerId"
                                />
                                <QuickDebuger
                                    title="项目"
                                    host={host_asd}
                                    placeholder="Project ID"
                                    queryKey="projectId"
                                />
                                <QuickDebuger
                                    title="分组"
                                    host={host_asd}
                                    placeholder="Node ID"
                                    queryKey="nodeId"
                                />
                                <QuickDebuger
                                    title="异常ES"
                                    esPath="/inner/esRedirect/idx_alert/type_alert/{}"
                                    host={host_asd}
                                    placeholder="Device ID"
                                />
                                
                                
                                
                            </div>
                        </Card>
                    }
                    {appDetail._linQuickDebug &&
                        <Card title="LIN快速查询">
                            <div>
                                host: {appDetail.host}
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={imei}
                                        onChange={e => {
                                            setImei(e.target.value)
                                        }}
                                        placeholder="imei"
                                    />
                                    <Button
                                        onClick={() => {
                                            window.open(`${host_asd}/inner/quickDebug?imei=${imei}`)
                                            setImei('')
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Space>
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={deviceId}
                                        onChange={e => {
                                            setDeviceId(e.target.value)
                                        }}
                                        placeholder="deviceId"
                                    />
                                    <Button
                                        onClick={() => {
                                            window.open(`${host_asd}/inner/quickDebug?deviceId=${deviceId}`)
                                            setDeviceId('')
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Space>
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={familyId}
                                        onChange={e => {
                                            setFamilyId(e.target.value)
                                        }}
                                        placeholder="familyId"
                                    />
                                    <Button
                                        onClick={() => {
                                            window.open(`${host_asd}/inner/quickDebug?familyId=${familyId}`)
                                            setFamilyId('')
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Space>
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={careId}
                                        onChange={e => {
                                            setCareId(e.target.value)
                                        }}
                                        placeholder="careId"
                                    />
                                    <Button
                                        onClick={() => {
                                            window.open(`${host_asd}/inner/quickDebug?careId=${careId}`)
                                            setCareId('')
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Space>
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={projectId}
                                        onChange={e => {
                                            setProjectId(e.target.value)
                                        }}
                                        placeholder="projectId"
                                    />
                                    <Button
                                        onClick={() => {
                                            window.open(`${host_asd}/inner/quickDebug?projectId=${projectId}`)
                                            setProjectId('')
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Space>
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={userId}
                                        onChange={e => {
                                            setUserId(e.target.value)
                                        }}
                                        placeholder="userId"
                                    />
                                    <Button
                                        onClick={() => {
                                            window.open(`${host_asd}/inner/quickDebug?userId=${userId}`)
                                            setUserId('')
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Space>
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={nodeId}
                                        onChange={e => {
                                            setNodeId(e.target.value)
                                        }}
                                        placeholder="nodeId"
                                    />
                                    <Button
                                        onClick={() => {
                                            window.open(`${host_asd}/inner/quickDebug?nodeId=${nodeId}`)
                                            setNodeId('')
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Space>
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={alarmId}
                                        onChange={e => {
                                            setAlarmId(e.target.value)
                                        }}
                                        placeholder="alarmId"
                                    />
                                    <Button
                                        onClick={() => {
                                            window.open(`${host_asd}/inner/quickDebug?alarmId=${alarmId}`)
                                            setAlarmId('')
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Space>
                            </div>
                        </Card>
                    }
                </Col>
                <Col span={12}>
                    <div className={styles.cards}>
                        {!!appDetail._dailyCheck &&
                            <Card title="每日检查">
                                <div className={styles.statusChart}>
                                    <DailyCheck
                                        host={host_asd}
                                    />
                                </div>
                            </Card>
                        }
                        {!!chartOption &&
                            <Card title="离线统计">
                                <div className={styles.statusChart}>
                                    <ReactEcharts
                                        style={{ height: '240px' }}
                                        option={chartOption}
                                        lazyUpdate={true}
                                    />
                                </div>
                            </Card>
                        }
                        {!!appDetail._cr &&
                            <Card title="上行记录统计">
                                <div className={styles.statusChart}>
                                    <UplinkStatus
                                        host={host_asd}
                                    />
                                </div>
                            </Card>
                        }
                        {!!appDetail._iron &&
                            <Card title="铁矿监控（5 分钟）">
                                <div className={styles.statusChart}>
                                    <IronStatus
                                        host={host_asd}
                                    />
                                </div>
                            </Card>
                        }
                        {!!appDetail._redisStatus &&
                            <Card title="Redis监控（1 分钟）">
                                <div className={styles.statusChart}>
                                    <RedisStatus
                                        host={host_asd}
                                    />
                                </div>
                            </Card>
                        }
                        {/* <Card title="设备详情">
                            <DeviceDetail
                                host={host_asd}
                                id="1003555153489436692"
                            />
                        </Card>
                        <Card title="住户详情">
                            <CareDetail
                                host={host_asd}
                                id="245"
                            />
                        </Card>
                        <Card title="家庭详情">
                            <FamilyDetail
                                host={host_asd}
                                id="124"
                            />
                        </Card> */}
                    </div>
                </Col>
            </Row>
        </div>
    )
}

