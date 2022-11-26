import { Button, Col, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './alasql-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
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

// const example = [
//     {
//       "community_name": "南平里社区居委会",
//       "community_key": "110105400004",
//       "street_key": "110105400000"
//     },
//     {
//       "community_name": "机场工作区社区",
//       "community_key": "110105400400",
//       "street_key": "110105400000"
//     }
// ]
// var data = [ {a: 1, b: 10}, {a: 2, b: 20}, {a: 1, b: 30} ];
// var res = alasql('SELECT a, SUM(b) AS b FROM ? GROUP BY a',[data]);

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

    async function uploadJson(json, { file }) {
        let res = await request.post(`${config.host}/mysql/connect`, {
            type: 'alasql',
            jsonList: json,
        })
        console.log('res', res)
        if (res.success) {
            // setCurIp(res.data)
            onUploaded && onUploaded({
                ...res.data,
                name: file.name,
            })

        }
    }

    function parseJsonFile(file) {
        const reader = new FileReader()
        reader.onload = async () => {
            if (!reader.result) {
                message.error('no_content')
                return
            }
            const json = JSON.parse(reader.result)
            uploadJson(json, { file })
        }
        reader.readAsText(file, 'utf-8')
    }

    function parseCsvFile(file) {
        const reader = new FileReader()
        reader.onload = async () => {
            if (!reader.result) {
                message.error('no_content')
                return
            }
            const table = reader.result.split('\n').map(line => line.split(','))
            const header = table[0]
            const body = table.slice(1)
            const list = body.map(row => {
                const item = {}
                for (let i = 0; i < header.length; i++) {
                    item[header[i]] = row[i]
                }
                return item
            })
            uploadJson(list, { file })
        }
        reader.readAsText(file, 'utf-8')
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
                if (file.name.endsWith('.json')) {
                    parseJsonFile(file)
                }
                else if (file.name.endsWith('.csv')) {
                    parseCsvFile(file)
                }
                else {
                    const reader = new FileReader()
                    reader.onload = async () => {
                        let workbook = read(reader.result, {
                            type: 'binary'
                        })
                        let sheets = workbook.Sheets;
    
                        for (let sheet in sheets) {
                            if (sheets.hasOwnProperty(sheet)) {
                                const json = utils.sheet_to_json(sheets[sheet])
                                uploadJson(json, { file })
                                break
                            }
                        }
                    }
                    reader.readAsBinaryString(file)
                }
            }}
        >
            {t('alasql.drop_file')}
        </div>
    )
}

