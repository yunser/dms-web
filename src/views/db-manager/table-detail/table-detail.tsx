import { Table, Tabs } from 'antd';
import React from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './table-detail.module.less';
import _ from 'lodash';
console.log('lodash', _)
const { TabPane } = Tabs

export function TableDetail({ config, dbName, tableName }) {

    const [tableInfo, setTableInfo] = useState([])
    const [indexes, setIndexes] = useState([])
    const [modelVisible, setModalVisible] = useState(false)
    const [modelCode, setModalCode] = useState('')
    const [fields, setFields] = useState([])

    const columns = [
        {
            title: '列名',
            dataIndex: 'COLUMN_NAME',
        },
        {
            title: '类型',
            dataIndex: 'COLUMN_TYPE',
        },
        {
            title: '可空',
            dataIndex: 'IS_NULLABLE',
        },
        {
            title: '键',
            dataIndex: 'COLUMN_KEY',
        },
        {
            title: '默认值',
            dataIndex: 'COLUMN_DEFAULT',
        },
        {
            title: '备注',
            dataIndex: 'COLUMN_COMMENT',
        },
    ]
    const indexColumns = [
        {
            title: '索引名',
            dataIndex: 'name',
        },
        {
            title: '包含列',
            dataIndex: 'columns',
        },
        // {
        //     title: 'COLUMN_NAME',
        //     dataIndex: 'COLUMN_NAME',
        // },
        {
            title: '备注',
            dataIndex: 'comment',
        },
        {
            title: '类型',
            dataIndex: 'type',
        },
        {
            title: '不唯一',
            dataIndex: 'NON_UNIQUE',
        },
        
        
        
    ]
    async function loadTableInfo() {
        if (dbName && tableName) {
            let res = await request.get(`${config.host}/mysql/databases/${dbName}/tables/${tableName}/all`, {
                noMessage: true,
            })
            console.log('loadTableInfo', res)
            if (res.status == 200) {
                setTableInfo(res.data.columns)
                
                const groupMap = _.groupBy(res.data.indexes, 'INDEX_NAME')
                console.log('groups2', groupMap)
                const indexes = []
                for (let key in groupMap) {
                    const item0 = groupMap[key][0]
                    const columns = groupMap[key]
                    indexes.push({
                        name: item0.INDEX_NAME,
                        comment: item0.INDEX_COMMENT,
                        type: item0.INDEX_TYPE,
                        NON_UNIQUE: item0.NON_UNIQUE,
                        columns: columns
                            .sort((a, b) => {
                                return a.SEQ_IN_INDEX - b.SEQ_IN_INDEX
                            })
                            .map(item => item.COLUMN_NAME)
                            .join(', ')
                        // {
                        //     title: 'SEQ_IN_INDEX',
                        //     dataIndex: 'SEQ_IN_INDEX',
                        // },
                        // {
                        //     title: 'COLUMN_NAME',
                        //     dataIndex: 'COLUMN_NAME',
                        // },
                    })
                }
                setIndexes(indexes)
            }
        }
    }

    useEffect(() => {
        loadTableInfo()
    }, [])
    
	return (
        <div className={styles.detailBox}>
            <Tabs
                tabPosition="left"
                type="card"
            >
                <TabPane tab="列信息" key="columns">
                    <Table
                        columns={columns}
                        dataSource={tableInfo}
                        bordered
                        pagination={false}
                        size="small"
                    />
                </TabPane>
                <TabPane tab="索引信息" key="index">
                    <Table
                        columns={indexColumns}
                        dataSource={indexes}
                        bordered
                        pagination={false}
                        size="small"
                    />
                </TabPane>
            </Tabs>
        </div>
    )
}
