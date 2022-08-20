import { Table } from 'antd';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './table-detail.module.less';

export function TableDetail({ config, dbName, tableName }) {

    const [tableInfo, setTableInfo] = useState([])
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
    async function loadTableInfo() {
        if (dbName && tableName) {
            let res = await request.get(`${config.host}/mysql/databases/${dbName}/tables/${tableName}/columns`, {
                noMessage: true,
            })
            console.log('loadTableInfo', res)
            if (res.status == 200) {
                setTableInfo(res.data)



            }
        }
    }

    useEffect(() => {
        loadTableInfo()
    }, [])
    
	return (
        <div className={styles.detailBox}>
            <Table
                columns={columns}
                dataSource={tableInfo}
                bordered
                pagination={false}
                size="small"
            />
        </div>
    )
}
