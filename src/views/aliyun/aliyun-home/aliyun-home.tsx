import { Button, Col, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './aliyun-home.module.less';
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
// import { saveAs } from 'file-saver'

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

export function AliyunHome({ config, onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')

    const [installed, setInstalled] = useState(false)
    const [ecsList, setEcsList] = useState([])
    const [rdsList, setRdsList] = useState([])
    const [certList, setCertList] = useState([])
    const [domainList, setDomainList] = useState([])
    const [billingList, setBillingList] = useState([])
    const [tab, setTab] = useState('main')

    async function loadData() {
        let res = await request.post(`${config.host}/file/aliyun`, {
        })
        if (res.success) {
            const { installed, ecs, rds, cert, domain, billing } = res.data
            setInstalled(installed)
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
                        // render: ExpireTimeRender,
                    },
                    {
                        title: '',
                        dataIndex: '__empty__',
                    },
                ]}
            />
        </div>
    )

    const main = (
        <div>
            欢迎使用阿里云助手
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
                        label: 'Domain',
                        key: 'domain',
                        children: domain,
                    },
                    {
                        label: 'Billing',
                        key: 'billing',
                        children: billing,
                    },
                ]}
            />
        </div>
    )
}

