import { Button, message, Select, Space, Spin, Checkbox } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './table-diff.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/views/db-manager/icon-button';
import { ReloadOutlined } from '@ant-design/icons';
import { request } from '@/views/db-manager/utils/http';
import copy from 'copy-to-clipboard';

function formatStringOrNull(value) {
    if (value === null) {
        return 'NULL'
    }
    if (value === 'CURRENT_TIMESTAMP') {
        return 'CURRENT_TIMESTAMP'
    }
    return `'${value}'`
}

function ChangedFields({ list = [] }) {
    const fieldMap = {
        'COLUMN_DEFAULT': 'default',
        'COLUMN_NAME': 'column name',
        'COLUMN_TYPE': 'type',
        'IS_NULLABLE': 'nullable',
        'COLUMN_COMMENT': 'comment',
        'CHARACTER_SET_NAME': 'character set',
        'COLLATION_NAME': 'collation',
    }
    return (
        <div className={styles.changedFields}>
            <table>
                <tr>
                    <th>field name</th>
                    <th>oldValue</th>
                    <th>newValue</th>
                </tr>
                {list.map(item => {
                    return (
                        <tr>
                            <td>
                                {fieldMap[item.name] || item.name}
                            </td>
                            <td>
                                {formatStringOrNull(item.oldValue)}
                            </td>
                            <td>
                                {formatStringOrNull(item.newValue)}
                            </td>
                        </tr>
                    )
                })}
            </table>
        </div>
    )
}

const attrLabelMap = {
    'TABLE_COMMENT': 'comment',
    'ENGINE': 'sql.engine',
    'TABLE_COLLATION': 'collation',
}

function compareColumns(diffData, diffField = true, diffColumn = true, diffIndex = true, chartsets = []) {
    const [data1, data2] = diffData
    const { table: table1, columns: table1Columns, indexes: table1Indexes = [] } = data1
    const { table: table2, columns: table2Columns, indexes: table2Indexes = [] } = data2

    const columnNames = _.uniq([
        ...table1Columns.map(item => item.COLUMN_NAME),
        ...table2Columns.map(item => item.COLUMN_NAME),
    ])

    const tableNameSql = `\`${table1.TABLE_SCHEMA}\`.\`${table1.TABLE_NAME}\``
    const sqls = [
        `ALTER TABLE ${tableNameSql}`,
    ]
    const rowSqls = []
    const diffColumns = []
    for (let columnName of columnNames) {
        const table1Column = table1Columns.find(item => item.COLUMN_NAME == columnName)
        const table2Column = table2Columns.find(item => item.COLUMN_NAME == columnName)

        let diffColumn = {
            name: columnName,
        }
        
        let rowChanged = false
        const changedFields = []

        if (table1Column && table2Column) {
            const checkFields = [
                'COLUMN_NAME',
                'COLUMN_TYPE',
                'IS_NULLABLE',
                // 'COLUMN_KEY',
                'COLUMN_DEFAULT',
                'COLUMN_COMMENT',
                'CHARACTER_SET_NAME',
                'COLLATION_NAME',
            ]
            for (let field of checkFields) {
                if (table1Column[field] != table2Column[field]) {
                    rowChanged = true
                    changedFields.push({
                        name: field,
                        oldValue: table1Column[field],
                        newValue: table2Column[field],
                    })
                }
            }
        }
        const isNew = !table1Column && table2Column
        const isDeleted = table1Column && !table2Column
        if (rowChanged || isNew) {
            let changeType = isNew ? 'ADD COLUMN' : 'MODIFY COLUMN'

            let nameSql = `\`${columnName}\``

            let typeSql = table2Column.COLUMN_TYPE

            let codeSql = ``
            if (['varchar'].includes(table2Column.COLUMN_TYPE) && (table2Column.CHARACTER_SET_NAME)) {
                codeSql = `CHARACTER SET ${table2Column.CHARACTER_SET_NAME}`
                const collation = table2Column.COLLATION_NAME
                if (collation) {
                    codeSql += ` COLLATE ${collation}`
                }
            }

            let commentSql = ''
            if (table2Column.COLUMN_COMMENT) {
                commentSql = `COMMENT '${table2Column.COLUMN_COMMENT}'`
            }

            let isAI = false
            let autoIncrementSql = ''
            isAI = table2Column.EXTRA == 'auto_increment'
            autoIncrementSql = isAI ? 'AUTO_INCREMENT' : ''

            let defaultSql = ''
            if (table2Column.COLUMN_DEFAULT) {
                defaultSql = `DEFAULT ${formatStringOrNull(table2Column.COLUMN_DEFAULT)}`
            }

            const nullSql = table2Column.IS_NULLABLE == 'YES' ? 'NULL' : 'NOT NULL'

            let positionSql = ''
            if (table2Column.ORDINAL_POSITION) {
            }
            if (table2Column.ORDINAL_POSITION == '1') {
                positionSql = 'FIRST'
            }
            else {
                const columnIndex = table2Columns.findIndex(item => item.COLUMN_NAME == columnName)
                const prevIdx = columnIndex - 1
                const prevItemName = table2Columns[prevIdx].COLUMN_NAME
                positionSql = `AFTER \`${prevItemName}\``
            }
            
            const rowSql = [
                changeType,
                nameSql,
                typeSql,
                codeSql,
                nullSql,
                autoIncrementSql,
                defaultSql,
                commentSql,
                positionSql,
            ].filter(item => item).join(' ')
            
            rowSqls.push(rowSql)
        }
        // 删除列
        else if (isDeleted) {
            rowSqls.push(`DROP COLUMN \`${columnName}\``)
        }
        if (isNew) {
            diffColumn.type = 'added'
        }
        else if (rowChanged) {
            diffColumn.type = 'changed'
            diffColumn.changedFields = changedFields
        }
        else if (isDeleted) {
            diffColumn.type = 'deleted'
        }
        else {
            diffColumn.type = 'same'
        }
        diffColumns.push(diffColumn)
    }

    const indexSqls = []
    const diffIndexes = []
    const indexNames = _.uniq([
        ...table1Indexes.map(item => item.INDEX_NAME),
        ...table2Indexes.map(item => item.INDEX_NAME),
    ])
    for (let indexName of indexNames) {
        const table1Index = table1Indexes.filter(item => item.INDEX_NAME == indexName)
        const table2Index = table2Indexes.filter(item => item.INDEX_NAME == indexName)
        const isDeleted = table1Index.length > 0 && table2Index.length == 0
        const isAdded = table1Index.length == 0 && table2Index.length > 0
        const table1IndexContent = table1Index.map(item => item.COLUMN_NAME).join(',')
        const table2IndexContent = table2Index.map(item => item.COLUMN_NAME).join(',')
        const isUpdated = table1Index.length > 0 && table2Index.length > 0 && table1IndexContent != table2IndexContent
        
        if (isDeleted || isUpdated) {
            const isPrimary = indexName == 'PRIMARY'
            if (isPrimary) {
                indexSqls.push(`DROP PRIMARY KEY`)
            }
            else {
                indexSqls.push(`DROP INDEX \`${indexName}\``)
            }
        }
        if (isAdded || isUpdated) {
            const isUnique = table2Index[0].NON_UNIQUE != 1
            const isPrimary = indexName == 'PRIMARY'
            if (isPrimary) {
                indexSqls.push(`PRIMARY KEY (${table2Index.map(item => `\`${item.COLUMN_NAME}\``).join(', ')})`)
            }
            else {
                indexSqls.push(`ADD ${isUnique ? 'UNIQUE ' : ''}INDEX \`${indexName}\` (${table2Index.map(item => `\`${item.COLUMN_NAME}\``).join(', ')})`)
            }
        }

        const diffIndex = {
            name: indexName,
        }
        if (isAdded) {
            diffIndex.type = 'added'
        }
        else if (isUpdated) {
            diffIndex.type = 'changed'
            diffIndex.oldValue = table1IndexContent
            diffIndex.newValue = table2IndexContent
        }
        else if (isDeleted) {
            diffIndex.type = 'deleted'
        }
        else {
            diffIndex.type = 'same'
        }
        diffIndexes.push(diffIndex)
    }

    const attrSqls = []
    const diffAttrs = []
    const compareAttrs = [
        'TABLE_COMMENT',
        'ENGINE',
        'TABLE_COLLATION',
    ]
    for (let attr of compareAttrs) {
        if (table1[attr] != table2[attr]) {
            diffAttrs.push({
                name: attr,
                oldValue: table1[attr],
                newValue: table2[attr],
                type: 'changed',
            })
            if (attr == 'TABLE_COMMENT') {
                attrSqls.push(`COMMENT='${table2[attr]}'`)
            }
            if (attr == 'ENGINE') {
                attrSqls.push(`ENGINE='${table2[attr]}'`)
            }
            if (attr == 'TABLE_COLLATION') {
                const fItem = chartsets.find(item => item.COLLATION_NAME == table2[attr])
                if (fItem) {
                    attrSqls.push(`DEFAULT CHARACTER SET='${fItem.CHARACTER_SET_NAME}' COLLATE=${fItem.COLLATION_NAME}`)
                }
            }
        }
        else {
            diffAttrs.push({
                name: attr,
                type: 'same',
            })
        }
    }

    const attrRealSame = attrSqls.length == 0
    const attrSame = attrRealSame || !diffField
    console.log('attrSame', diffField)
    const columnRealSame = diffColumns.filter(item => item.type != 'same').length == 0
    const columnSame = columnRealSame || !diffColumn
    const indexRealSame = diffIndexes.filter(item => item.type != 'same').length == 0
    const indexSame = indexRealSame || !diffIndex
    
    const diffSqls = []
    if (!attrSame) {
        diffSqls.push(...attrSqls)
    }
    if (!columnSame) {
        diffSqls.push(...rowSqls)
    }
    if (!indexSame) {
        diffSqls.push(...indexSqls)
    }
    sqls.push(diffSqls.join(',\n'))
        // + `${diffField ? 'dd' : 'bb'}`
    const sql = sqls.join('\n') + ';'

    return {
        sql,
        same: columnSame && indexSame && attrSame,
        columnRealSame,
        columnSame,
        indexRealSame,
        indexSame,
        attrRealSame,
        attrSame,
        diffAttrs,
        diffColumns,
        diffIndexes,
        // diffField,
        // diffIndex,
    }
}

export function DiffResult({ diffData, chartsets = [] }) {
    const { t } = useTranslation()

    const [diffField, setDiffField] = useState(true)
    const [diffColumn, setDiffColumn] = useState(true)
    const [diffIndex, setDiffIndex] = useState(true)

    const result = useMemo(() => {
        return compareColumns(diffData, diffField, diffColumn, diffIndex, chartsets)
    }, [diffData, diffField, diffColumn, diffIndex])

    console.log('result', result)

    return (
        <div>
            {!!result &&
                <div className={styles.resultBox}>
                    {/* {result.same ?
                        <div>same</div>
                    :
                    } */}
                    <>
                        {result.same ?
                            <div className={styles.codeBox}>
                                <code className={styles.code}>
                                    <pre>no code</pre>
                                </code>
                            </div>
                        :
                            <div className={styles.codeBox}>
                                <code className={styles.code}>
                                    <pre>{result.sql}</pre>
                                </code>
                                <div>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            copy(result.sql)
                                            message.info(t('copied'))
                                        }}
                                    >
                                        {t('copy')}
                                    </Button>
                                </div>
                            </div>
                        }
                        <div className={styles.diffBox}>
                            <div>
                                <div className={styles.header}>
                                    <div className={styles.checkboxWrap}>
                                        <Checkbox
                                            checked={diffField}
                                            onChange={e => {
                                                setDiffField(e.target.checked)
                                            }}
                                            />
                                    </div>
                                    <div>
                                        {t('sql.diff.field_diff')}: {result.attrRealSame ? '✅' : '❌'}
                                    </div>
                                </div>
                                <table className={styles.table}>
                                    <tr>
                                        <th>
                                            {t('sql.diff.field_name')}
                                        </th>
                                        <th>
                                            {t('type')}
                                        </th>
                                        <th>
                                            {t('sql.diff')}
                                        </th>
                                    </tr>
                                    {result.diffAttrs.map(item => {
                                        return (
                                            <tr>
                                                <th>
                                                    {t(attrLabelMap[item.name])}
                                                </th>
                                                <th>
                                                    {item.type}
                                                </th>
                                                <th>
                                                    {item.type == 'same' &&
                                                        <div>✅</div>
                                                    }
                                                    {item.type == 'added' &&
                                                        <div>❌ {'=>'} ✅</div>
                                                    }
                                                    {item.type == 'deleted' &&
                                                        <div>✅ {'=>'} ❌</div>
                                                    }
                                                    {item.type == 'changed' &&
                                                        <div>
                                                            changed
                                                            <div>
                                                                {item.oldValue}
                                                                {'=>'}
                                                                {item.newValue}
                                                            </div>
                                                            {/* <ChangedFields list={item.changedFields} /> */}
                                                        </div>
                                                    }
                                                </th>
                                            </tr>
                                        )
                                    })}
                                </table>
                            </div>
                            <div>
                                <div className={styles.header}>
                                    <div className={styles.checkboxWrap}>
                                        <Checkbox
                                            checked={diffColumn}
                                            onChange={e => {
                                                setDiffColumn(e.target.checked)
                                            }}
                                        />
                                    </div>
                                    {t('sql.diff.column_diff')}: {result.columnRealSame ? '✅' : '❌'}
                                </div>
                                <div>
                                    <table className={styles.table}>
                                        <tr>
                                            <th>
                                                {t('sql.diff.column_name')}
                                            </th>
                                            <th>
                                                {t('type')}
                                            </th>
                                            <th>
                                                {t('sql.diff')}
                                            </th>
                                        </tr>
                                        {result.diffColumns.map(item => {
                                            return (
                                                <tr>
                                                    <th>
                                                        {item.name}
                                                    </th>
                                                    <th>
                                                        {item.type}
                                                    </th>
                                                    <th>
                                                        {item.type == 'same' &&
                                                            <div>✅</div>
                                                        }
                                                        {item.type == 'added' &&
                                                            <div>❌ {'=>'} ✅</div>
                                                        }
                                                        {item.type == 'deleted' &&
                                                            <div>✅ {'=>'} ❌</div>
                                                        }
                                                        {item.type == 'changed' &&
                                                            <div>
                                                                changed
                                                                <ChangedFields list={item.changedFields} />
                                                            </div>
                                                        }
                                                    </th>
                                                </tr>
                                            )
                                        })}
                                    </table>
                                </div>
                            </div>
                            <div>
                                <div className={styles.header}>
                                    <div className={styles.checkboxWrap}>
                                        <Checkbox
                                            checked={diffIndex}
                                            onChange={e => {
                                                setDiffIndex(e.target.checked)
                                            }}
                                        />
                                    </div>
                                    {t('sql.diff.index_diff')}:
                                    {result.indexRealSame ? '✅' : '❌'}
                                </div>
                                <table className={styles.table}>
                                    <tr>
                                        <th>
                                            {t('sql.diff.index_name')}
                                        </th>
                                        <th>
                                            {t('type')}
                                        </th>
                                        <th>
                                            {t('sql.diff')}
                                        </th>
                                    </tr>
                                    {result.diffIndexes.map(item => {
                                        return (
                                            <tr>
                                                <th>
                                                    {item.name}
                                                </th>
                                                <th>
                                                    {item.type}
                                                </th>
                                                <th>
                                                    {item.type == 'same' &&
                                                        <div>✅</div>
                                                    }
                                                    {item.type == 'added' &&
                                                        <div>❌ {'=>'} ✅</div>
                                                    }
                                                    {item.type == 'deleted' &&
                                                        <div>✅ {'=>'} ❌</div>
                                                    }
                                                    {item.type == 'changed' &&
                                                        <div>
                                                            changed
                                                            <div>
                                                                {item.oldValue}
                                                                {'=>'}
                                                                {item.newValue}
                                                            </div>
                                                        </div>
                                                    }
                                                </th>
                                            </tr>
                                        )
                                    })}
                                </table>

                            </div>
                        </div>
                    </>
                </div>
            }
        </div>
    )
}

export function TableDiff({ config, connectionId, dbName }: any) {
    
    const { t } = useTranslation()
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [diffing, setDiffing] = useState(false)
    const [chartsets, setChartsets] = useState([])
    const [table1Name, setTable1Name] = useState('')
    const [table2Name, setTable2Name] = useState('')
    // const [table1Name, setTable1Name] = useState('address_node_4')
    // const [table2Name, setTable2Name] = useState('address_node_5')
    const [tables, setTables] = useState([])
    const [diffData, setDiffData] = useState([])

    useEffect(() => {
        loadData()
        loadCharData()
    }, [])

    function handleData(tables, columns, indexes) {
        const table1Columns = columns.filter(item => item.TABLE_NAME == table1Name)
        const table2Columns = columns.filter(item => item.TABLE_NAME == table2Name)
        const table1 = tables.find(item => item.TABLE_NAME == table1Name)
        const table2 = tables.find(item => item.TABLE_NAME == table2Name)
        const table1Indexes = indexes.filter(item => item.TABLE_NAME == table1Name)
        const table2Indexes = indexes.filter(item => item.TABLE_NAME == table2Name)
        console.log('table1', table1, table1Name)
        // compareColumns(table1, table2, table1Columns, table2Columns, table1Indexes, table2Indexes)
        setDiffData([
            {
                table: table1,
                columns: table1Columns,
                indexes: table1Indexes,
            },
            {
                table: table2,
                columns: table2Columns,
                indexes: table2Indexes,
            },
        ])
    }

    async function loadCharData() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT *
    FROM \`information_schema\`.\`COLLATION_CHARACTER_SET_APPLICABILITY\``,
        })
        if (res.success) {
            const charData = res.data
            setChartsets(charData)
        }
    }

    async function loadData() {
        setLoading(true)
        setResult(null)
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `select * from \`information_schema\`.\`TABLES\` 
where TABLE_SCHEMA = '${dbName}'
and \`TABLE_TYPE\` = 'BASE TABLE';`,
        })
        if (res.success) {
            const tables = res.data
            setTables(tables)
        } else {
            message.error('连接失败')
        }
        setLoading(false)
    }

    async function compare() {
        setDiffing(true)
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `select * from \`information_schema\`.\`TABLES\` 
where TABLE_SCHEMA = '${dbName}'
and \`TABLE_TYPE\` = 'BASE TABLE';`,
        })
        if (res.success) {
            const tables = res.data
            let colRes = await request.post(`${config.host}/mysql/execSqlSimple`, {
                connectionId,
                sql: `select * from \`information_schema\`.\`COLUMNS\`
    where TABLE_SCHEMA = '${dbName}'
    AND TABLE_NAME in ('${table1Name}', '${table2Name}');`,
            })
            if (colRes.success) {
                const columns = colRes.data
                let indexSql = `SELECT * FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = '${dbName}'
    AND TABLE_NAME in ('${table1Name}', '${table2Name}')
    ORDER BY SEQ_IN_INDEX ASC`
                let idxRes = await request.post(`${config.host}/mysql/execSqlSimple`, {
                    connectionId,
                    sql: indexSql,
                })
                if (idxRes.success) {
                    const indexes = idxRes.data
                    handleData(tables, columns, indexes)
                    setDiffing(false)
                }
            }
        }
    }

    return (
        <div className={styles.docBox}>
            <div className={styles.header}>
                <Space>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            setDiffing(false)
                            setDiffData([])
                            loadData()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                </Space>
                <div>
                </div>
            </div>
            <div className={styles.body}>
                {loading ?
                    <Spin />
                :
                    <div>
                        <div className={styles.toolBox}>
                            <div className={styles.item}>
                                <div>
                                    {t('sql.diff.table1')}
                                </div>
                                <div>
                                    <Select
                                        className={styles.select}
                                        value={table1Name}
                                        options={tables.map(item => {
                                            return {
                                                label: item.TABLE_NAME,
                                                value: item.TABLE_NAME,
                                            }
                                        })}
                                        onChange={value => {
                                            setTable1Name(value)
                                        }}
                                        showSearch={true}
                                        optionFilterProp="label"
                                    />
                                </div>
                            </div>
                            <div className={styles.exchange}>
                                <div>{'=>'}</div>
                                <div>{t('sql.diff.sync_to')}</div>
                                <div>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            const tmp = table1Name
                                            setTable1Name(table2Name)
                                            setTable2Name(tmp)
                                            setResult(null)
                                        }}
                                    >
                                        {t('sql.diff.swap')}
                                    </Button>
                                </div>
                            </div>
                            <div className={styles.item}>
                                <div>
                                    {t('sql.diff.table2')}
                                </div>
                                <div>
                                    <Select
                                        className={styles.select}
                                        value={table2Name}
                                        options={tables.map(item => {
                                            return {
                                                label: item.TABLE_NAME,
                                                value: item.TABLE_NAME,
                                            }
                                        })}
                                        showSearch={true}
                                        optionFilterProp="label"
                                        onChange={value => {
                                            setTable2Name(value)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* <div className={styles.compareBtn}>
                        </div> */}
                        <Button
                            type="primary"
                            size="small"
                            disabled={!(table1Name && table2Name && !diffing)}
                            loading={diffing}
                            onClick={() => {
                                compare()
                            }}
                        >
                            {t('sql.diff.compare')}
                        </Button>
                        {diffData.length > 0 &&
                            <div className={styles.diffResultBox}>
                                <DiffResult
                                    diffData={diffData}
                                    chartsets={chartsets}
                                />
                            </div>
                        }
                    </div>
                }
            </div>
        </div>
    )
}
