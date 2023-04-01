import { Button, Descriptions, Input, message, Modal, Popover, Select, Space, Spin, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './mysql-compare.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, ClearOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment'
import { IconButton } from '@/views/db-manager/icon-button';
import { ReloadOutlined } from '@ant-design/icons';
import { FullCenterBox } from '@/views/common/full-center-box'

const { TabPane } = Tabs
const { TextArea } = Input

function DbSelector({ config, onSuccess }) {

    const [loading, setLoading] = useState(false)
    const [connections, setConnections] = useState([])
    const [connectionId, setConnectionId] = useState('')
    const [schemas, setSchemas] = useState([])

    async function loadConnections() {
        let res = await request.post(`${config.host}/mysql/connection/list`, {
        })
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            let connections = res.data.list
            setConnections(connections)
        }
    }

    async function loadDbs(connectionId) {
        const connection = connections.find(item => item.id == connectionId)
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/connectionTables`, {
            ...connection,
        })
        setLoading(false)
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            // let connections = res.data.list
            // setConnections(connections)
            setSchemas(res.data.map(item => {
                return {
                    label: item.SCHEMA_NAME,
                    value: item.SCHEMA_NAME,
                }
            }))
        }
    }

    // async function getTableData(schemaName) {
    //     const connection = connections.find(item => item.id == connectionId)
    //     let res = await request.post(`${config.host}/mysql/connectionCompareData`, {
    //         ...connection,
    //         schemaName,
    //     })
    //     // console.log('res', res)
    //     if (res.success) {
    //         onSuccess && onSuccess(res.data)
    //         // setProjects([])
    //         // let connections = res.data.list
    //         // setConnections(connections)
    //         // setSchemas(res.data.map(item => {
    //         //     return {
    //         //         label: item.SCHEMA_NAME,
    //         //         value: item.SCHEMA_NAME,
    //         //     }
    //         // }))
    //     }
    // }


    useEffect(() => {
        // loadData()
        loadConnections()
    }, [])

    useEffect(() => {
        if (!connectionId) {
            return
        }
        loadDbs(connectionId)
    }, [connectionId])

    

    return (
        <div>
            <div className={styles.select}>
                <Select
                    options={connections.sort((a, b) => a.name.localeCompare(b.name)).map(item => {
                        return {
                            label: item.name,
                            value: item.id,
                        }
                    })}
                    style={{
                        width: 240,
                    }}
                    onChange={value => {
                        console.log('value', value)
                        setConnectionId(value)
                    }}
                    showSearch={true}
                    optionFilterProp="label"
                    // searchValue="label"
                />
            </div>
            {loading ?
                <Spin />
            :
                <Select
                    options={schemas}
                    style={{
                        width: 240,
                    }}
                    onChange={schemaName => {
                        // getTableData(schemaName)
                        onSuccess && onSuccess({
                            connectionId,
                            schemaName,
                        })
                    }}
                    showSearch={true}
                />
            }
            {/* <Space>
            </Space> */}
        </div>
    )
}

function ColumnTable({ data }) {
    return (
        <div className={styles.columnBox}>

            <Table
                dataSource={data}
                columns={[
                    {
                        title: '列名',
                        dataIndex: 'name',
                        width: 240,
                    },
                    {
                        title: 'db1',
                        dataIndex: 'db1',
                        width: 80,
                        render(_value, item) {
                            return (
                                <div>
                                    {item.type == 'added' ? '✅' : '❌'}
                                </div>
                            )
                        }
                    },
                    {
                        title: 'db2',
                        dataIndex: 'db2',
                        width: 80,
                        render(_value, item) {
                            return (
                                <div>
                                    {item.type == 'added' ? '❌' : '✅'}
                                </div>
                            )
                        }
                    },
                    {
                        title: '类型',
                        dataIndex: 'type',
                        render(value) {
                            return (
                                <div className={classNames(styles.cellType, styles[value])}>{value}</div>
                            )
                        }
                    },
                ]}
                pagination={false}
                size="small"
            />
        </div>
    )
}

function getStat(results) {
    // if (!result) {
    //     return null
    // }
    const typeMap = {
        deleted: 0,
        added: 0,
        same: 0,
        changed: 0,
        ignore: 0,
    }
    for (let item of results) {
        if (!typeMap[item.type]) {
            typeMap[item.type] = 0
        }
        typeMap[item.type]++
    }
    return {
        ...typeMap,
    }
}

async function compareColumn(tableName, table1Columns, table2Columns) {
    // const table1 = {
    //     "TABLE_CATALOG": "def",
    //     "TABLE_SCHEMA": "linxot",
    //     "TABLE_NAME": "a_compare_1",
    //     "TABLE_TYPE": "BASE TABLE",
    //     "ENGINE": "InnoDB",
    //     "VERSION": 10,
    //     "ROW_FORMAT": "Dynamic",
    //     "TABLE_ROWS": 0,
    //     "AVG_ROW_LENGTH": 0,
    //     "DATA_LENGTH": 16384,
    //     "MAX_DATA_LENGTH": 0,
    //     "INDEX_LENGTH": 0,
    //     "DATA_FREE": 0,
    //     "AUTO_INCREMENT": 1,
    //     "CREATE_TIME": "2022-10-13 11:41:23",
    //     "UPDATE_TIME": null,
    //     "CHECK_TIME": null,
    //     "TABLE_COLLATION": "utf8_general_ci",
    //     "CHECKSUM": null,
    //     "CREATE_OPTIONS": "",
    //     "TABLE_COMMENT": ""
    // }
    
    // const table2 = {
    //     "TABLE_CATALOG": "def",
    //     "TABLE_SCHEMA": "linxot",
    //     "TABLE_NAME": "a_compare_2",
    //     "TABLE_TYPE": "BASE TABLE",
    //     "ENGINE": "InnoDB",
    //     "VERSION": 10,
    //     "ROW_FORMAT": "Dynamic",
    //     "TABLE_ROWS": 0,
    //     "AVG_ROW_LENGTH": 0,
    //     "DATA_LENGTH": 16384,
    //     "MAX_DATA_LENGTH": 0,
    //     "INDEX_LENGTH": 0,
    //     "DATA_FREE": 0,
    //     "AUTO_INCREMENT": 1,
    //     "CREATE_TIME": "2022-10-13 11:42:05",
    //     "UPDATE_TIME": null,
    //     "CHECK_TIME": null,
    //     "TABLE_COLLATION": "utf8_general_ci",
    //     "CHECKSUM": null,
    //     "CREATE_OPTIONS": "row_format=DYNAMIC",
    //     "TABLE_COMMENT": ""
    // }
    
    // const compareAttrs = [
    //     ''
    // ]
    
    // for (let key in table1) {
    //     const table1Value = table1[key]
    //     const table2Value = table2[key]
    //     if (table1Value != table2Value) {
    //         if (!['TABLE_NAME', 'CREATE_TIME', 'CREATE_OPTIONS'].includes(key)) {
    //             console.log('!=', key)
    //             console.log('table1Value', table1Value)
    //             console.log('table2Value', table2Value)
    //         }
    //         // console.log('=', table1Value == table2Value)
    //     }
    // }
    
    const table1ColumnNames = table1Columns.map(col => col.COLUMN_NAME)
    const table2ColumnNames = table2Columns.map(col => col.COLUMN_NAME)
    
    // console.log('table1ColumnNames', table1ColumnNames)
    
    // console.log('_', _)
    const allColumns = _.uniq([...table1ColumnNames, ...table2ColumnNames])
    // console.log('allColumns', allColumns)
    
    const diffColumns: any[] = []
    for (let col of allColumns) {
        const inTable1 = table1ColumnNames.includes(col)
        const inTable2 = table2ColumnNames.includes(col)
        if (inTable1 && inTable2) {
            const table1Row = table1Columns.find(item => item.COLUMN_NAME == col)
            const table2Row = table2Columns.find(item => item.COLUMN_NAME == col)
            const diffColumns: any[] = []
            for (let key in table1Row) {
                if (table1Row[key] != table2Row[key]) {
                    const toDiffColumns = [
                        // 固定的
                        'TABLE_NAME', 
                        'CHARACTER_MAXIMUM_LENGTH',
                        'CHARACTER_OCTET_LENGTH',
                        // 用户可配置的
                        'CHARACTER_SET_NAME',
                        'COLLATION_NAME',
                        'ORDINAL_POSITION',
                        'COLUMN_KEY',
                    ]
                    if (!toDiffColumns.includes(key)) {
                        // console.log('key diff', key, table1Row[key], table2Row[key])
                        diffColumns.push({
                            key,
                            value: [table1Row[key], table2Row[key]],
                        })
                    }
                }
            }
            if (diffColumns.length) {
                // console.log(`${col} ${chalk.yellow('changed')}`)
                console.log(`COLUMN ${col} changed`)
                for (let col of diffColumns) {
                    console.log(`    ATTR ${col.key} ${col.value[0]} ${col.value[1]}`)
                }
                diffColumns.push({
                    name: col,
                    type: 'changed',
                })
            }
            // else {
            //     console.log('    OK')
            // }
        }
        else if (inTable1 && !inTable2) {
            // console.log(`${col} ${chalk.red('deleted')}`)
            console.log(`COLUMN ${col} deleted`)
            diffColumns.push({
                name: col,
                type: 'deleted',
            })
        }
        else if (!inTable1 && inTable2) {
            console.log(`COLUMN ${col} added`)
            diffColumns.push({
                name: col,
                type: 'added',
            })
        }
    }
    if (diffColumns.length == 0) {
        console.log('    OK')
    }

    return diffColumns
}

async function compareDatabaseTables(db1Tables = [], db2Tables = [], db1AllColumns = [], db2AllColumns = [], db1Result = {}, db2Result = {}) {
    // const db1Tables = []
    // const db2Tables = []
    const { ignoreTables: db1IgnoreTables } = db1Result
    const { ignoreTables: db2IgnoreTables } = db2Result
        
    const db1TableNames = db1Tables.map(item => item.TABLE_NAME)
    const db2TableNames = db2Tables.map(item => item.TABLE_NAME)
    const allTableNames = _.uniq([...db1TableNames, ...db2TableNames])
    const results: any[] = []

    function isIgnore(db1IgnoreTables: any[], tableName: string) {
        return db1IgnoreTables.some(item => {
            if (item.name.startsWith('regex:')) {
                console.log('regex:', tableName.match(new RegExp(item.name.substring(6))))
                return tableName.match(new RegExp(item.name.substring(6)))
            }
            return item.name == tableName
        })
    }

    for (let tableName of allTableNames) {
        console.log('--------*--------*--------*--------')
        console.log('TABLE', tableName)

        const inDb1 = db1TableNames.includes(tableName)
        const inDb2 = db2TableNames.includes(tableName)


        // ignore
        // if ((inDb1 && db1IgnoreTables.find(item => item.name == tableName)) 
        if ((inDb1 && isIgnore(db1IgnoreTables, tableName)) 
            || (inDb2 && isIgnore(db2IgnoreTables, tableName))) {
            results.push({
                tableName,
                type: 'ignore',
            })
            continue
        }



        if (inDb1 && inDb2) {
            const db1Row = db1Tables.find(item => item.TABLE_NAME == tableName)
            const db2Row = db2Tables.find(item => item.TABLE_NAME == tableName)
            const diffColumns: string[] = []
            for (let key in db1Row) {
                if (db1Row[key] != db2Row[key]) {
                    const noDiffColumns = [
                        // 固定的
                        'TABLE_ROWS',
                        'AVG_ROW_LENGTH',
                        'DATA_LENGTH',
                        'AUTO_INCREMENT',
                        'CREATE_TIME',
                        'UPDATE_TIME',
                        'INDEX_LENGTH',
                        'DATA_FREE',
                        'CREATE_OPTIONS',
                        
                    ]
                    if (!noDiffColumns.includes(key)) {
                        console.log('    key diff', key, db1Row[key], db2Row[key])
                        diffColumns.push(key)
                    }
                }
            }
            if (diffColumns.length) {
                console.log(`${tableName} changed`)
            }

            const table1Columns = db1AllColumns.filter(col => col.TABLE_NAME == tableName)
            const table2Columns = db2AllColumns.filter(col => col.TABLE_NAME == tableName)
            const columns = await compareColumn(tableName, table1Columns, table2Columns)
            if (columns.length == 0) {
                results.push({
                    tableName,
                    type: 'same',
                })
            }
            else {
                results.push({
                    tableName,
                    type: 'changed',
                    columns,
                })
            }
        }
        else if (inDb1 && !inDb2) {
            console.log(`${tableName} deleted`)
            results.push({
                tableName,
                type: 'deleted',
            })
        }
        else if (!inDb1 && inDb2) {
            console.log(`${tableName} added`)
            results.push({
                tableName,
                type: 'added',
                detail: {
                    db1: inDb1,
                    db2: inDb2,
                },
            })
        }
    }
    return results
}

export function MysqlCompare({ config, connectionId, onSql }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [version, setVersion] = useState('--')
    const [list, setList] = useState([])
    // const [result, setResult] = useState(null)
    const [results, setResults] = useState([])
    const [db1Data, setDb1Data] = useState(null)
    const [db2Data, setDb2Data] = useState(null)
    const [db1Result, setDb1Result] = useState(null)
    const [db2Result, setDb2Result] = useState(null)
    console.log('db1Data', db1Data)

    const stat = getStat(results)

    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/compare`, {
            // dbName,
            // connectionId,
            // sql: 'SELECT VERSION()',
            // pageSize: 10,
        })
        if (res.success) {
            // message.info('连接成功')
            const data = res.data
            setResult(data)
            setResults(data.results.sort((a, b) => {
                function score(item) {
                    const typeScoreMap = {
                        same: 0,
                        added: 2,
                        deleted: 2,
                        changed: 1,
                    }
                    return typeScoreMap[item.type] || 0
                }
                return score(b) - score(a)
            }))
            // setVersion(`v${data[0]['VERSION()']}`)
            // console.log('res', list)
            // setList(data.list)
            // setTotal(data.total)
        }
        setLoading(false)
    }

    async function compare() {
        setLoading(true)
        console.log('db1Data', db1Data, db2Data)
        let res = await request.post(`${config.host}/mysql/connectionCompareData`, {
            db1Data,
            db2Data,
        })
        if (res.success) {
            const { db1Result, db2Result } = res.data
            const results = await compareDatabaseTables(db1Result.tables, db2Result.tables, db1Result.columns, db2Result.columns, db1Result, db2Result)
            setResults(results.sort((a, b) => {
                function score(item) {
                    const typeScoreMap = {
                        added: 2,
                        deleted: 2,
                        changed: 1,
                        same: 0,
                        ignore: -1,
                    }
                    return typeScoreMap[item.type] || 0
                }
                return score(b) - score(a)
            }))
            setDb1Result(db1Result)
            setDb2Result(db2Result)
        }
        setLoading(false)
    }
    
    useEffect(() => {
        // loadData()
    }, [])

    async function getCreateScript(tableName) {
        // const tableName = db1Data.schemaName
        const schemaName = db1Data.schemaName

        // await request.post(`${config.host}/mysql/execSqlSimple`, {
        //     connectionId: db1Result?._connectionId,
        //     sql: `use schemaName;`,
        //     // tableName,
        //     // dbName,
        // })
        
        const createTableSql = `SHOW CREATE TABLE \`${schemaName}\`.\`${tableName}\`;`
        const { success, data } = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId: db2Result?._connectionId,
            sql: createTableSql,
            // tableName,
            // dbName,
        })
        if (!success) {
            return
        }
        if (!data.length) {
            return
        }
        const backupTableName = `${tableName}`
        // const checkSql = `SELECT COUNT(*) FROM \`${tableName}\`;`
        const createSql = (data[0]['Create Table'] + ';').replace(/`[\d\D]+?`/, `\`${backupTableName}\``)
        console.log('createSql', createSql)
        copy(createSql)
        message.success(t('copied'))

    }

    console.log('stat', stat)
    return (
        <div className={styles.resultBox}>
            {/* {results.length == 0 &&
            } */}
            <Space className={styles.formBox} direction="vertical">
                <div className={styles.help}>支持的功能：表的新增/删除检测，字段的新增/删除检测，不支持的功能：字段的类型和空值变化</div>
                <div className={styles.dbSelect}>

                    <div>
                        {/* <div>数据库2：</div> */}
                        <div className={styles.label}>已经做了修改的数据库</div>
                        <DbSelector
                            config={config}
                            onSuccess={data => {
                                setDb2Data(data)
                            }}
                        />
                        <div>{db1Result?._connectionId}</div>
                    </div>
                    <div className={styles.arrow}>
                        <div>{'=>'}</div>
                        <div>同步到</div>
                    </div>
                    <div>
                        <div className={styles.label}>需要同步更新的数据库</div>
                        
                        <DbSelector
                            config={config}
                            onSuccess={data => {
                                setDb1Data(data)
                            }}
                        />
                        <div>{db2Result?._connectionId}</div>
                    </div>
                </div>
                {!!db1Data && !!db2Data &&
                    <div>
                        <Button 
                            type="primary"
                            onClick={() => {
                                compare()
                            }}
                        >Compare</Button>
                    </div>
                }
            </Space>
            {loading ?
                <FullCenterBox
                    height={240}
                >
                    <Spin />
                </FullCenterBox>
            : results.length > 0 ?
                <div className={styles.container}>
                    {/* <div></div> */}
                    {/* <div>结果：</div> */}
                    {!!stat &&
                        <div className={styles.statBox}>
                            {/* <div>统计</div> */}
                            <div className={styles.item}>
                                {stat.added} 
                                <div className={styles.added}>added</div>
                            </div>
                            <div className={styles.item}>
                                {stat.deleted} 
                                <div className={styles.deleted}>deleted</div>
                            </div>
                            <div className={styles.item}>{stat.changed} 
                                <div className={styles.changed}>changed</div>
                            </div>
                            <div className={styles.item}>{stat.ignore} 
                                <div className={styles.ignore}>ignore</div>
                            </div>
                        </div>
                    }
                    {results.length > 0 &&
                        <div className={styles.results}>
                            {results.map(item => {
                                return (
                                    <div 
                                        className={styles.item}
                                    >
                                        <div className={styles.header}>
                                            <div className={styles.tableName}>{item.tableName}</div>
                                            <div className={classNames(styles.type, styles[item.type])}>{item.type}</div>
                                        </div>
                                        {item.type == 'changed' &&
                                            <ColumnTable data={item.columns} />
                                        }
                                        {item.type == 'added' &&
                                            <div>
                                                <table className={styles.table}>
                                                    <tr>
                                                        <th>db1</th>
                                                        <th>db2</th>
                                                    </tr>
                                                    <tr>
                                                        <th>✅</th>
                                                        <th>❌</th>
                                                    </tr>
                                                </table>
                                                <div className={styles.btn}>
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            getCreateScript(item.tableName)
                                                        }}
                                                    >
                                                        get_create_script

                                                    </Button>
                                                </div>
                                            </div>
                                        }
                                        {item.type == 'deleted' &&
                                            <div>
                                                <table className={styles.table}>
                                                    <tr>
                                                        <th>db1</th>
                                                        <th>db2</th>
                                                    </tr>
                                                    <tr>
                                                        <th>❌</th>
                                                        <th>✅</th>
                                                    </tr>
                                                </table>
                                            </div>
                                        }
                                    </div>
                                )
                            })}
                        </div>
                    }
                </div>
            :
                <div></div>
            }
        </div>
    )
}
