import { Button, Descriptions, Form, Input, Space, Table, Tabs } from 'antd';
import React from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './table-detail.module.less';
import _ from 'lodash';
import { ExecModal } from '../exec-modal/exec-modal';
// console.log('lodash', _)
const { TabPane } = Tabs

function TableInfoEditor({ config, tableInfo, tableName, dbName }) {
    const [form] = Form.useForm()
    const [sql, setSql] = useState('')

    useEffect(() => {
        form.setFieldsValue({
            ...tableInfo,
        })
    }, [tableInfo])

    async function update() {
        // setLoading(true)
        const values = await form.validateFields()
        if (values.TABLE_NAME != tableInfo.TABLE_NAME) {
            const sql = `ALTER TABLE \`${tableInfo.TABLE_NAME}\`
    RENAME TO \`${values.TABLE_NAME}\`
;`
            console.log('sql', sql)
            setSql(sql)
        }
    }

    return (
        <div>
            <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={{
                    port: 3306,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="TABLE_NAME"
                    label="表名称"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="TABLE_COMMENT"
                    label="注释"
                    rules={[]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                        wrapperCol={{ offset: 8, span: 16 }}
                        // name="passowrd"
                        // label="Passowrd"
                        // rules={[{ required: true, },]}
                    >
                        <Space>
                            <Button
                                // loading={loading}
                                type="primary"
                                onClick={update}>提交</Button>
                            {/* <Button onClick={save}>保存</Button> */}
                        </Space>
                    </Form.Item>
            </Form>
            {!!sql &&
                <ExecModal
                    config={config}
                    sql={sql}
                    tableName={tableName}
                    dbName={dbName}
                />
            }
        </div>
    )
}

export function TableDetail({ config, dbName, tableName }) {

    const [tableColumns, setTableColumns] = useState([])
    const [indexes, setIndexes] = useState([])
    const [partitions, setPartitions] = useState([])
    const [tableInfo, setTableInfo] = useState({})
    const [modelVisible, setModalVisible] = useState(false)
    const [modelCode, setModalCode] = useState('')
    const [fields, setFields] = useState([])

    const partitionColumns = [
        {
            title: '分区名',
            dataIndex: 'PARTITION_NAME',
        },
        {
            title: '表达式',
            dataIndex: 'PARTITION_EXPRESSION',
        },
        {
            title: '数据长度',
            dataIndex: 'DATA_LENGTH',
        },
        {
            title: '描述',
            dataIndex: 'PARTITION_DESCRIPTION',
        },
    ]
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
            let res = await request.post(`${config.host}/mysql/tableDetail`, {
                dbName,
                tableName,
            }, {
                noMessage: true,
            })
            console.log('loadTableInfo', res)
            if (res.status == 200) {
                setTableColumns(res.data.columns)
                setPartitions(res.data.partitions)
                
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
                setTableInfo(res.data.table)
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
                <TabPane tab="基本信息" key="basic">
                    <TableInfoEditor
                        config={config}
                        tableInfo={tableInfo}
                        tableName={tableName}
                        dbName={dbName}
                    />
                    <Descriptions column={1}>
                        {/* <Descriptions.Item label="label">{tableInfo.AUTO_INCREMENT}</Descriptions.Item> */}
                        <Descriptions.Item label="表名称">{tableInfo.TABLE_NAME}</Descriptions.Item>
                        <Descriptions.Item label="排序规则">{tableInfo.TABLE_COLLATION}</Descriptions.Item>
                        <Descriptions.Item label="行">{tableInfo.DATA_LENGTH}</Descriptions.Item>
                        <Descriptions.Item label="引擎">{tableInfo.ENGINE}</Descriptions.Item>
                        <Descriptions.Item label="注释">{tableInfo.TABLE_COMMENT}</Descriptions.Item>
                        <Descriptions.Item label="平均行长度">{tableInfo.AVG_ROW_LENGTH}</Descriptions.Item>
                        <Descriptions.Item label="当前值">{tableInfo.AUTO_INCREMENT}</Descriptions.Item>
                        <Descriptions.Item label="行格式">{tableInfo.ROW_FORMAT}</Descriptions.Item>
                        {/* : null
                        CHECKSUM: null
                        CHECK_TIME: null
                        CREATE_OPTIONS: "row_format=DYNAMIC"
                        CREATE_TIME: "2022-07-28T08:20:02.000Z"
                        DATA_FREE: 0
                        INDEX_LENGTH: 0
                        MAX_DATA_LENGTH: 0
                        TABLE_CATALOG: "def"
                        TABLE_ROWS: 8
                        TABLE_SCHEMA: "linxot"
                        TABLE_TYPE: "BASE TABLE"
                        UPDATE_TIME: "2022-08-20T14:18:58.000Z"
                        VERSION: 10 */}
                    </Descriptions>
                </TabPane>
                <TabPane tab="列信息" key="columns">
                    <Table
                        columns={columns}
                        dataSource={tableColumns}
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
                <TabPane tab="分区信息" key="partition">
                    <Table
                        columns={partitionColumns}
                        dataSource={partitions}
                        bordered
                        pagination={false}
                        size="small"
                    />
                </TabPane>
            </Tabs>
        </div>
    )
}
