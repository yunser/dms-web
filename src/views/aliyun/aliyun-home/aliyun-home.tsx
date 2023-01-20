import { Button, Col, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './aliyun-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CloseCircleOutlined, DownloadOutlined, EllipsisOutlined, EyeInvisibleOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import moment from 'moment';
import { uid } from 'uid';
// import { saveAs } from 'file-saver'

function ExpireTimeRender(value) {
    const m = moment(value)
    let color
    let textDecoration
    if (m.isBefore(moment())) {
        // color = 'red'
        textDecoration = 'line-through'
    }
    else if (m.isBefore(moment().add(7, 'days'))) {
        color = 'red'
    }
    else if (m.isBefore(moment().add(30, 'days'))) {
        color = 'orange'
    }
    return (
        <div style={{ color, textDecoration }}>{m.format('YYYY-MM-DD HH:mm:ss')}</div>
    )
}

export function AliyunHome({ config, onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')

    const [installed, setInstalled] = useState(false)
    const [allList, setAllList] = useState([])
    const [ecsList, setEcsList] = useState([])
    const [rdsList, setRdsList] = useState([])
    const [certList, setCertList] = useState([])
    const [cdnCertList, setCdnCertList] = useState([])
    const [domainList, setDomainList] = useState([])
    const [billingList, setBillingList] = useState([])
    const [tencentServerList, setTencentServerList] = useState([])
    const [tencentMysqlList, setTencentMysqlList] = useState([])
    const [tencentLighthouseList, setTencentLighthouseList] = useState([])
    const [tab, setTab] = useState('main')

    async function loadData() {
        let res = await request.post(`${config.host}/file/aliyun`, {
        })
        if (res.success) {
            const { installed, ecs, rds, cert, cdnCert, domain, billing, tencentServer, tencentMysql, tencentLighthouse } = res.data
            setInstalled(installed)
            const allList = [
                ...ecs.map(item => {
                    return {
                        type: 'ecs',
                        name: item.instanceName,
                        expireTime: item.expiredTime,
                    }
                }),
                ...rds.map(item => {
                    return {
                        type: 'rds',
                        name: item.DBInstanceDescription,
                        expireTime: item.expireTime,
                    }
                }),
                ...cert.map(item => {
                    return {
                        type: 'ssl',
                        name: item.domain,
                        expireTime: item.certEndTime,
                    }
                }),
                ...cdnCert.map(item => {
                    return {
                        type: 'cdnSsl',
                        name: item.domainName,
                        expireTime: item.certExpireTime,
                    }
                }),
                ...domain.map(item => {
                    return {
                        type: 'domain',
                        name: item.DomainName,
                        expireTime: item.ExpirationDate,
                    }
                }),
                ...tencentServer.map(item => {
                    return {
                        type: 'tencentServer',
                        name: item.InstanceName,
                        expireTime: item.ExpiredTime,
                    }
                }),
                ...tencentMysql.map(item => {
                    return {
                        type: 'tencentMysql',
                        name: item.InstanceName,
                        expireTime: item.DeadlineTime,
                    }
                }),
                ...tencentLighthouse.map(item => {
                    return {
                        type: 'tencentLighthouse',
                        name: item.InstanceName,
                        expireTime: item.ExpiredTime,
                    }
                }),
            ]
                .sort((a, b) => {
                    function score(item) {
                        return - moment(item.expireTime).toDate().getTime()
                    }
                    return score(b) - score(a)
                })
                .map(item => {
                    return {
                        ...item,
                        id: uid(32),
                    }
                })
            setAllList(allList)
            setEcsList(ecs.sort((a, b) => {
                function score(item) {
                    return - moment(item.expiredTime).toDate().getTime()
                }
                return score(b) - score(a)
            }))
            setRdsList(rds.sort((a, b) => {
                function score(item) {
                    return - moment(item.expireTime).toDate().getTime()
                }
                return score(b) - score(a)
            }))
            setCertList(cert.sort((a, b) => {
                function score(item) {
                    return - moment(new Date(item.certEndTime)).toDate().getTime()
                }
                return score(b) - score(a)
            }))
            setCdnCertList(cdnCert.sort((a, b) => {
                function score(item) {
                    return - moment(new Date(item.certExpireTime)).toDate().getTime()
                }
                return score(b) - score(a)
            }))

            setDomainList(domain.sort((a, b) => {
                function score(item) {
                    return - moment(item.ExpirationDate).toDate().getTime()
                }
                return score(b) - score(a)
            }))
            setBillingList(billing.sort((a, b) => {
                function score(item) {
                    return - parseFloat(item.availableAmount.replace(/,/, ''))
                }
                return score(b) - score(a)
            }))
            setTencentServerList(tencentServer.sort((a, b) => {
                function score(item) {
                    return - moment(item.ExpiredTime).toDate().getTime()
                }
                return score(b) - score(a)
            }))
            setTencentMysqlList(tencentMysql.sort((a, b) => {
                function score(item) {
                    return - moment(item.DeadlineTime).toDate().getTime()
                }
                return score(b) - score(a)
            }))
            setTencentLighthouseList(tencentLighthouse.sort((a, b) => {
                function score(item) {
                    return - moment(item.ExpiredTime).toDate().getTime()
                }
                return score(b) - score(a)
            }))
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    if (!installed) {
        return (
            <div className={styles.installBox}>
                <div>本功能依赖于 <a href="https://github.com/yunser/aliyun-cli" target="_blank">@yunser/aliyun-cli</a>，
                    请安装并生成数据后，再刷新此页面
                </div>
            </div>
        )
    }

    const ecs = (
        <div>
            <Table
                dataSource={ecsList}
                columns={[
                    {
                        title: 'ECS 实例名称',
                        dataIndex: 'instanceName',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '到期时间',
                        dataIndex: 'expiredTime',
                        render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const rds = (
        <div>
            <Table
                dataSource={rdsList}
                columns={[
                    {
                        title: 'RDS 实例名称',
                        dataIndex: 'DBInstanceDescription',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '到期时间',
                        dataIndex: 'expireTime',
                        render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const cdnSsl = (
        <div>
            <Table
                dataSource={cdnCertList}
                columns={[
                    {
                        title: '域名',
                        dataIndex: 'domainName',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '证书到期时间',
                        dataIndex: 'certExpireTime',
                        render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const ssl = (
        <div>
            <Table
                dataSource={certList}
                columns={[
                    {
                        title: '证书域名',
                        dataIndex: 'domain',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '到期时间',
                        dataIndex: 'certEndTime',
                        render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const domain = (
        <div>
            <Table
                dataSource={domainList}
                columns={[
                    {
                        title: '域名',
                        dataIndex: 'DomainName',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '到期时间',
                        dataIndex: 'ExpirationDate',
                        render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const billing = (
        <div>
            <Table
                dataSource={billingList}
                columns={[
                    {
                        title: '名称',
                        dataIndex: 'name',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '可用余额',
                        dataIndex: 'availableAmount',
                        render(value) {
                            let color
                            if (value < 0) {
                                color = 'red'
                            }
                            return (
                                <div style={{ color, }}>{value}</div>
                            )
                        }
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const tencentServer = (
        <div>
            <Table
                dataSource={tencentServerList}
                columns={[
                    {
                        title: '名称',
                        dataIndex: 'InstanceName',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '到期时间',
                        dataIndex: 'ExpiredTime',
                        render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const tencentMysql = (
        <div>
            <Table
                dataSource={tencentMysqlList}
                columns={[
                    {
                        title: '名称',
                        dataIndex: 'InstanceName',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '到期时间',
                        dataIndex: 'DeadlineTime',
                        render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const tencentLighthouse = (
        <div>
            <Table
                dataSource={tencentLighthouseList}
                columns={[
                    {
                        title: '名称',
                        dataIndex: 'InstanceName',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: '到期时间',
                        dataIndex: 'ExpiredTime',
                        render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    // console.log('allList', allList)

    const main = (
        <div>
            <div className={styles.welcome}>欢迎使用阿里云/腾讯云助手</div>

            <div className={styles.section}>
                {/* <div className={styles.title}>一个月内快到期产品：</div> */}
                <Table
                    dataSource={allList}
                    columns={[
                        {
                            title: '产品名称',
                            dataIndex: 'name',
                            width: 280,
                        },
                        {
                            title: '类型',
                            dataIndex: 'type',
                            width: 120,
                            render(value) {
                                const map = {
                                    ecs: 'ECS',
                                    rds: 'RDS',
                                    ssl: 'SSL',
                                    cdnSsl: 'CDN SSL',
                                    domain: 'Domain',
                                    // tencentServer: 'Tencent Server',
                                    tencentServer: '腾讯服务器',
                                    tencentMysql: '腾讯 MySQL',
                                    tencentLighthouse: '腾讯轻量服务器',
                                }
                                return map[value] || value
                            },
                        },
                        {
                            title: '到期时间',
                            dataIndex: 'expireTime',
                            width: 180,
                            render: ExpireTimeRender,
                        },
                        {
                            title: '操作',
                            dataIndex: 'op',
                            render(_value, item) {
                                return (
                                    <Space>
                                        <IconButton
                                            tooltip={t('hide')}
                                            onClick={() => {
                                                setAllList(allList.filter(_item => _item.id != item.id))
                                            }}
                                        >
                                            <EyeInvisibleOutlined />
                                        </IconButton>
                                    </Space>
                                )
                            },
                        },
                    ]}
                    size="small"
                />
            </div>
        </div>
    )

    return (
        <div className={styles.container} key={tab}>
            <div>
                <Button
                    onClick={() => {
                        loadData()
                    }}
                >刷新</Button>
            </div>

                    {/* {tab} */}
            <Tabs
                activeKey={tab}
                onChange={key => {
                    setTab(key)
                }}
                items={[
                    {
                        label: '概览',
                        key: 'main',
                        children: main,
                    },
                    {
                        label: 'ECS',
                        key: 'ecs',
                        children: ecs,
                    },
                    {
                        label: 'RDS',
                        key: 'rds',
                        children: rds,
                    },
                    {
                        label: 'SSL',
                        key: 'ssl',
                        children: ssl,
                    },
                    {
                        label: 'CDN SSL',
                        key: 'cdnSsl',
                        children: cdnSsl,
                    },
                    {
                        label: 'Domain',
                        key: 'domain',
                        children: domain,
                    },
                    {
                        label: '腾讯服务器',
                        key: 'tencent-server',
                        children: tencentServer,
                    },
                    {
                        label: '腾讯 MySQL',
                        key: 'tencent-mysql',
                        children: tencentMysql,
                    },
                    {
                        label: '腾讯轻量服务器',
                        key: 'tencent-lighthouse',
                        children: tencentLighthouse,
                    },
                    {
                        label: '阿里云 Billing',
                        key: 'billing',
                        children: billing,
                    },
                ]}
            />
        </div>
    )
}

