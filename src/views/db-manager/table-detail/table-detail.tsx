import { Button, Checkbox, Descriptions, Divider, Form, Input, InputNumber, message, Modal, Popover, Select, Space, Table, Tabs, Tag, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './table-detail.module.less';
import _ from 'lodash';
import { ExecModal } from '../exec-modal/exec-modal';
import { uid } from 'uid';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/views/db-manager/icon-button';
import { ArrowDownOutlined, ArrowUpOutlined, InsertRowAboveOutlined, InsertRowBelowOutlined, PlusOutlined, QuestionOutlined, ReloadOutlined } from '@ant-design/icons';
import filesize from 'file-size';
import { CodeDebuger } from '../code-debug';
import moment from 'moment';
import classNames from 'classnames';
import { dbFunConfigMap } from '../utils/database';
import { _if } from '../utils/helper';
// console.log('lodash', _)
const { TabPane } = Tabs

export const ItemHelper = {
    mixValue(item, key) {
        // console.log('mixValue', item, key)
        const value = item[key]
        let _value = value.value
        if (value.newValue !== undefined) {
            _value = value.newValue
        }
        return _value
    },
    newValue(item, key) {
        return item[key].newValue
    },
    oldValue(item, key) {
        return item[key].value
    },
    isKeyValueChanged(item, key) {
        if (item[key] === undefined) {
            return false
        }
        return item[key].newValue !== undefined && item[key].newValue !== item[key].value
            || item[key].__new
    },
    isValueChanged(value) {
        return (value.newValue !== undefined && value.newValue !== value.value)
            || value.__new
    },
    calcValue(item) {
        return item.newValue === undefined ? item.value : item.newValue
    },
    hasNewValue(item) {
        return item.newValue !== undefined
    }
}

function hasValue(value) {
    return !!value || value === 0
}

function hasValueOrNullOrEmpty(value) {
    return !!value || value === 0 || value === null || value === ''
}

function formatStringOrNull(value) {
    if (value === null) {
        return 'NULL'
    }
    if (value === 'CURRENT_TIMESTAMP') {
        return 'CURRENT_TIMESTAMP'
    }
    return `'${value}'`
}

function computeValue(value) {
    let _value = value.value
    if (value.newValue !== undefined) {
        _value = value.newValue
    }
    return _value
}

function computeNewOldValue(newValue, oldValue) {

    if (newValue !== undefined) {
        return newValue
    }
    return oldValue
}

function parseColumns(item) {
    const { sql } = item
    console.log('parseColumns/sql', sql)
    if (!sql) {
        return []
    }
    const m = sql.match(/\(([\d\D]+)\)/)
    console.log('parseColumns/m', m)
    if (!m) {
        return []
    }
    const cols = m[1].split(',')
        .map(item => item.replace(/\s/g, ''))
        .map(item => item.substring(1, item.length - 1))
    console.log('parseColumns/cols', cols)
    return cols

}
const idxTest = [
    {
        "type": "index",
        "name": "sqlite_autoindex_redis_history_1",
        "tbl_name": "redis_history",
        "rootpage": 5,
        "sql": null
    },
    {
        "type": "index",
        "name": "idx_db",
        "tbl_name": "redis_history",
        "rootpage": 6,
        "sql": "CREATE INDEX \"idx_db\"\nON \"redis_history\" (\n  \"db\"\n)"
    },
    {
        "type": "index",
        "name": "idx_db_time",
        "tbl_name": "redis_history",
        "rootpage": 7,
        "sql": "CREATE INDEX \"idx_db_time\"\nON \"redis_history\" (\n  \"db\",\n  \"create_time\"\n)"
    }
]

// parseColumns(idxTest[1])
// parseColumns(idxTest[2])

function parseColumnType(value: string) {
    if (!value) {
        return {
            type: '',
            length: '',
        }
    }
    if (!value.includes('(')) {
        return {
            type: value,
            length: '',
        }
    }
    const idx = value.indexOf('(')
    const type = value.substring(0, idx)
    const m = value.match(/\(([\d\D]+)\)/)
    if (!m) {
        return {
            type,
            length: '',
        }    
    }
    return {
        type,
        length: m[1],
    }
}

function CheckboxInput({ value, onChange }) {
    return (
        <Checkbox
            checked={value === true}
            onChange={e => {
                onChange && onChange(e.target.checked)
            }}
        />
    )
}

function TypeInput({ value, onChange }) {
    const { t } = useTranslation()
    // console.log('TypeInput/value', value)
    // const [lentg]

    const { type, length } = parseColumnType(value)

    return (
        <Space>
            {/* <Input
                style={{ width: 240}}
                value={value}
                onChange={onChange}
                // addonAfter={
                //     <Popover
                //         title="设置类型"
                //         content={
                //             <div>
                //                 1212
                //             </div>
                //         }
                //     >
                //         <Button 
                //             size="small"
                //             style={{ width: 80 }} 
                //             onClick={() => {
                //                 form.setFieldsValue({
                //                     COLUMN_DEFAULT: null,
                //                 })
                //             }}
                //         >
                //             设置
                //         </Button>
                //     </Popover>
                // }
            /> */}
            <Select
                showSearch={true}
                value={type}
                options={[
                    {
                        label: 'tinyint',
                        value: 'tinyint',
                    },
                    {
                        label: 'smallint',
                        value: 'smallint',
                    },
                    {
                        label: 'mediumint',
                        value: 'mediumint',
                    },
                    {
                        label: 'integer',
                        value: 'integer',
                    },
                    {
                        label: 'int',
                        value: 'int',
                    },
                    {
                        label: 'bigint',
                        value: 'bigint',
                    },
                    {
                        label: 'float',
                        value: 'float',
                    },
                    {
                        label: 'double',
                        value: 'double',
                    },
                    {
                        label: 'decimal',
                        value: 'decimal',
                    },
                    {
                        label: 'date',
                        value: 'date',
                    },
                    {
                        label: 'time',
                        value: 'time',
                    },
                    {
                        label: 'year',
                        value: 'year',
                    },
                    {
                        label: 'datetime',
                        value: 'datetime',
                    },
                    {
                        label: 'timestamp',
                        value: 'timestamp',
                    },
                    {
                        label: 'char',
                        value: 'char',
                    },
                    {
                        label: 'varchar',
                        value: 'varchar',
                    },
                    {
                        label: 'tinyblob',
                        value: 'tinyblob',
                    },
                    {
                        label: 'tinytext',
                        value: 'tinytext',
                    },
                    {
                        label: 'blob',
                        value: 'blob',
                    },
                    {
                        label: 'text',
                        value: 'text',
                    },
                    {
                        label: 'mediumblob',
                        value: 'mediumblob',
                    },
                    {
                        label: 'mediumtext',
                        value: 'mediumtext',
                    },
                    {
                        label: 'longblob',
                        value: 'longblob',
                    },
                    {
                        label: 'longtext',
                        value: 'longtext',
                    },
                ]}
                onChange={value => {
                    onChange && onChange(value.toLocaleLowerCase())
                }}
                style={{ width: 130}}
            />
            <Input
                placeholder="length"
                value={length}
                onChange={e => {
                    const { value } = e.target
                    if (value) {
                        onChange && onChange(`${type}(${value})`)
                    }
                    else {
                        onChange && onChange(`${type}`)
                    }
                }}
                style={{ width: 80}}
            />
            {value}
            <IconButton
                tabindex={-1}
                size="small"
                tooltip={t('help')}
                onClick={() => {
                    window.open('https://www.runoob.com/mysql/mysql-data-types.html', '_blank')
                }}
            >
                <QuestionOutlined />
            </IconButton>
        </Space>
    )
}

function ColumnModal({ item, onCancel, onOk, characterSets, characterSetMap }) {
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const generationType = Form.useWatch('generationType', form)
    console.log('ColumnModal/item', item)
    const columnDefault = Form.useWatch('COLUMN_DEFAULT', form)

    const characterSet = Form.useWatch('CHARACTER_SET_NAME', form)
    const collations = useMemo(() => {
        if (!characterSet) {
            return []
        }
        if (!characterSetMap[characterSet]) {
            return []
        }
        return characterSetMap[characterSet].map(item => {
            return {
                label: item,
                value: item,
            }
        })
    }, [characterSet, characterSetMap])

    useEffect(() => {
        const values = {}
        for (let key in item) {
            const value = ItemHelper.mixValue(item, key)
            values[key] = value
        }
        // console.log('values', values)
        form.setFieldsValue(values)
    }, [item])

    return (
        <Modal
            width={720}
            open={true}
            title={t('column_edit')}
            onCancel={onCancel}
            onOk={async () => {
                const values = await form.validateFields()
                console.log('values', values)
                onOk && onOk(values)
            }}
        >
            <Form
                form={form}
                size="small"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
                    position: 'last',
                    // port: 6379,
                    // db: 0,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="COLUMN_NAME"
                    label={t('column_name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="COLUMN_TYPE"
                    label={t('type')}
                    rules={[ { required: true, }, ]}
                >
                    <TypeInput />   
                </Form.Item>
                <Form.Item
                    name="IS_NULLABLE"
                    label={t('nullable')}
                    // rules={[ { required: true, }, ]}
                >
                    <Select
                        options={[
                            {
                                label: 'no',
                                value: 'NO',
                            },
                            {
                                label: 'yes',
                                value: 'YES',
                            },
                        ]}
                    />
                </Form.Item>
                <Form.Item
                    name="COLUMN_KEY"
                    label={t('primary_key')}
                >
                    <Select
                        options={[
                            {
                                label: 'no',
                                value: '',
                            },
                            {
                                label: 'yes',
                                value: 'PRI',
                            },
                        ]}
                    />
                </Form.Item>
                <Form.Item
                    name="isAuto"
                    label={t('auto_increment')}
                >
                    {/* <CheckboxInput /> */}
                    <Select
                        options={[
                            {
                                label: 'no',
                                value: false,
                            },
                            {
                                label: 'yes',
                                value: true,
                            },
                        ]}
                    />
                </Form.Item>
                <Form.Item
                    name="COLUMN_DEFAULT"
                    label={t('default')}
                    // rules={[ { required: true, }, ]}
                >
                    <Input
                        placeholder={columnDefault == null ? 'NULL' : ''}
                        addonAfter={
                            // <Button 
                            //     style={{ width: 80 }} 
                            //     onClick={() => {
                            //         form.setFieldsValue({
                            //             COLUMN_DEFAULT: null,
                            //         })
                            //     }}
                            // >
                            //     NULL
                            // </Button>
                            <Select
                                value={''}
                                style={{ width: 180 }} 
                                options={[
                                    {
                                        label: 'NULL',
                                        value: 'null',
                                    },
                                    {
                                        label: 'EMPTY TEXT',
                                        value: 'empty',
                                    },
                                    {
                                        label: 'CURRENT_TIMESTAMP',
                                        value: 'now',
                                    },
                                ]}
                                onChange={value => {
                                    if (value == 'null') {
                                        form.setFieldsValue({
                                            COLUMN_DEFAULT: null,
                                        })
                                    }
                                    else if (value == 'empty') {
                                        form.setFieldsValue({
                                            COLUMN_DEFAULT: '',
                                        })
                                    }
                                    else if (value == 'now') {
                                        form.setFieldsValue({
                                            COLUMN_DEFAULT: 'CURRENT_TIMESTAMP',
                                        })
                                    }
                                }}
                            />
                        }
                    />
                </Form.Item>
                <Form.Item
                    name="COLUMN_COMMENT"
                    label={t('comment')}
                >
                    <Input.TextArea rows={4} />
                </Form.Item>
                <Form.Item
                    name="CHARACTER_SET_NAME"
                    label={t('character_set')}
                >
                    <Select
                        options={characterSets}
                        onChange={() => {
                            console.log('change')
                            form.setFieldsValue({
                                COLLATION_NAME: null,
                            })
                        }}
                    />
                </Form.Item>
                <Form.Item
                    name="COLLATION_NAME"
                    label={t('collation')}
                >
                    <Select
                        options={collations}
                    />
                </Form.Item>
                <Form.Item
                    name="generationType"
                    label={t('sql.generation_type')}
                >
                    <Select
                        options={[
                            {
                                label: 'None',
                                value: '',
                            },
                            {
                                label: 'STORED',
                                value: 'STORED',
                            },
                            {
                                label: 'VIRTUAL',
                                value: 'VIRTUAL',
                            },
                        ]}
                    />
                </Form.Item>
                {generationType != '' &&
                    <Form.Item
                        name="GENERATION_EXPRESSION"
                        label={t('sql.expression')}
                    >
                        <Input />
                    </Form.Item>
                }
            </Form>
        </Modal>
    )
}

function PartitionModal({ item, onCancel, onOk }) {
    const { t } = useTranslation()
    const [form] = Form.useForm()

    useEffect(() => {
        form.setFieldsValue(item ? {
            name: item.PARTITION_NAME,
            value: item.PARTITION_DESCRIPTION,
        } : {
            name: '',
            value: '',
        })
    }, [item])

    return (
        <Modal
            open={true}
            title={t('sql.partition.create')}
            onCancel={onCancel}
            onOk={async () => {
                const values = await form.validateFields()
                onOk && onOk(values)
            }}
        >
            <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="value"
                    label={t('value')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
            <Button
                size="small"
                onClick={() => {
                    const now = moment()
                    form.setFieldsValue({
                        name: `p${now.format('YYYYMM')}`,
                        value: `TO_DAYS('${now.clone().startOf('month').add(1, 'months').format('YYYY-MM-DD')}')`,
                    })
                }}
            >
                pyyyymm
            </Button>
        </Modal>
    )
}

function ColumnSelector({ value: _value, onChange, options }) {
    const { t } = useTranslation()
    const [modalVisible, setModalVisible] = useState(false)
    const [value, setValue] = useState([])

    const [keyword, setKeyword] = useState('')
    

    // const [columns] = useState
    const columns = [
        {
            title: t('index_column'),
            dataIndex: 'label',
        },
        {
            title: t('position'),
            dataIndex: 'position',
            render(_value, item) {
                const idx = value.findIndex(v => v == item.value)
                // if (idx)
                return (
                    <div className={styles.cellWrap}>
                        <div className={styles.ColumnSelectorCheck}>
                            <Checkbox
                                className={styles.checkbox}
                                checked={idx != -1}
                                onClick={() => {
                                    let newValue
                                    if (value.includes(item.value)) {
                                        newValue = value.filter(v => v != item.value)
                                    }
                                    else {
                                        newValue = [
                                            ...value,
                                            item.value
                                        ]
                                    }
                                    setValue(newValue)
                                }}
                            />
                            <div className={styles.index}>{idx == -1 ? '' : (idx + 1)}</div>
                        </div>
                    </div>
                )
            }
        },
    ]
    const filteredOptions = useMemo(() => {
        if (!keyword) {
            return options
        }
        return options.filter(item => {
            return item.label.toLowerCase().includes(keyword.toLowerCase())
        })
    }, [options, keyword])
    
    useEffect(() => {
        setValue([..._value])
    }, [_value, modalVisible])

    return (
        <>
            <div className={styles.ColumnSelector}
                onClick={() => {
                    setModalVisible(true)
                }}
            >
                {_value.join(', ')}
            </div>
            <Modal
                open={modalVisible}
                title={t('column_select')}
                onCancel={() => {
                    setModalVisible(false)
                }}
                // footer={null}
                onOk={() => {
                    setModalVisible(false)
                    onChange && onChange(value)
                }}
            >
                <div
                    className={styles.columnSelectorModal}
                    onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                    }}
                >
                    <Input
                        className={styles.filter}
                        placeholder={t('filter')}
                        value={keyword}
                        allowClear
                        size="small"
                        onChange={e => {
                            setKeyword(e.target.value)
                        }}
                    />

                    <Table
                        dataSource={filteredOptions}
                        columns={columns}
                        size="small"
                        bordered
                        pagination={false}
                        scroll={{
                            y: 480,
                        }}
                        // rowSelection={{
                        //     selectedRowKeys: value,
                        //     onChange(selectedRowKeys) {
                        //         onChange && onChange(selectedRowKeys)
                        //     }
                        // }}
                        rowKey="value"
                    />
                </div>
            </Modal>
        </>
    )
}


function Cell({ value, selectOptions, item, index, dataIndex, onChange }) {
    // console.log('Cell/value', value)
    // const inputRef = useRef(null)
    const id = useMemo(() => {
        return uid(32)
    }, [])

    if (!value) {
        // Collation 可能为空
        if (dataIndex == 'COLLATION_NAME') {
            return <div></div>
        }
        return <div data-empty-cell="1">?</div>
    }
    const [isEdit, setIsEdit] = useState(false)
    const [inputValue, setInputValue] = useState(value.value)
    useEffect(() => {
        setInputValue(computeValue(value))
    }, [value.value, value.newValue])
    
    
    

    // useEffect(() => {
    //     const clickHandler = () => {
    //         // console.log('document click', )
    //         // setIsEdit(false)
    //         if (isEdit) {
    //             const notInput = index == 'type2'
    //             if (notInput) {
    //                 return
    //             }
    //             console.log('document click isEdit')
    //             onChange && onChange({
    //                 ...value,
    //                 newValue: inputValue,
    //             })
    //             setIsEdit(false)

    //         }
    //     }
    //     document.addEventListener('click', clickHandler)
    //     return () => {
    //         document.removeEventListener('click', clickHandler)
    //     }
    // }, [isEdit, value, inputValue, dataIndex])

    const displayValue = computeNewOldValue(inputValue, value.value)
    return (
        <div
            className={classNames(styles.cell, {
                // [styles.changed]: value.newValue !== undefined && value.value !== value.newValue,
                [styles.changed]: ItemHelper.isValueChanged(value),
            })}
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            
            {isEdit ?
                <SimpleInput
                    inputId={id}
                    // ref={inputRef}
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value)
                    }}
                    onBlur={() => {
                        console.log('onBlur', value)
                        // console.log('change', index, dataIndex, inputValue)
                        if (value.__new) {
                            onChange && onChange({
                                ...value,
                                newValue: inputValue,
                            })
                        }
                        else {
                            onChange && onChange({
                                ...value,
                                newValue: inputValue === value.value ? undefined : inputValue,
                            })
                        }
                        setIsEdit(false)    
                    }}
                />
            :
                <>
                    {dataIndex == 'IS_NULLABLE' ?
                        <div className={styles.cellCheckboxWrap}>
                            <Checkbox
                                checked={inputValue == 'YES'}
                                onChange={(e) => {
                                    const newValue = e.target.checked ? 'YES' : 'NO'
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        ...value,
                                        newValue,
                                    })

                                }}
                            />
                        </div>
                    : dataIndex == 'isAuto' ?
                        <div className={styles.cellCheckboxWrap}>
                            <Checkbox
                                checked={inputValue === true}
                                onChange={(e) => {
                                    // const newValue = e.target.checked ? 'auto_increment' : ''
                                    const newValue = e.target.checked
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        ...value,
                                        newValue,
                                    })

                                }}
                            />
                        </div>
                    : dataIndex == 'COLLATION_NAME' ?
                        <div className={styles.cellCheckboxWrap}>
                            {!!ItemHelper.mixValue(item, 'CHARACTER_SET_NAME') &&
                                <div>
                                    <Tag>{ItemHelper.mixValue(item, 'COLLATION_NAME') || ItemHelper.mixValue(item, 'CHARACTER_SET_NAME')}</Tag>
                                </div>
                            }
                        </div>
                    : dataIndex == 'COLUMN_KEY' ?
                        <div className={styles.cellPrimaryKey}>
                            <Checkbox
                                checked={inputValue == 'PRI'}
                                onChange={(e) => {
                                    const { checked } = e.target
                                    const newValue = checked ? 'PRI' : ''
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        ...value,
                                        newValue,
                                    }, {
                                        primaryKeyChanged: {
                                            isAdd: checked,
                                        },
                                    })

                                }}
                            />
                            {inputValue == 'PRI' &&
                                <div className={styles.index}>
                                    {item['COLUMN_KEY']['primaryKeyIndex'] + 1}
                                </div>
                            }
                        </div>
                        // TODO type2 是什么？
                    : dataIndex == 'type2' ?
                        <div>
                            {/* {inputValue} */}
                            <Select
                                size="small"
                                // key={value}
                                value={inputValue}
                                onChange={v => {
                                    console.log('Select.value', v)
                                    const newValue = v
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        value: value.value,
                                        newValue,
                                    })
                                }}
                                options={[
                                    {
                                        label: 'Normal',
                                        value: 'Normal',
                                    },
                                    {
                                        label: 'Unique',
                                        value: 'Unique',
                                    },
                                ]}
                                style={{
                                    width: 96,
                                }}
                            />
                        </div>
                    : dataIndex == 'columns' ?
                        <div>
                            {/* {inputValue} */}
                            <ColumnSelector
                                // size="small"
                                // mode="multiple"
                                // maxTagCount="responsive"
                                value={inputValue}
                                onChange={v => {
                                    console.log('Select.value', v)
                                    const newValue = v
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        value: value.value,
                                        newValue,
                                    })
                                }}
                                options={selectOptions}
                                // style={{
                                //     width: 400,
                                // }}
                            />
                        </div>
                    :
                        <div
                            className={styles.text}
                            onClick={() => {
                                setIsEdit(true)
                                setTimeout(() => {
                                    document.getElementById(id)?.focus()
                                }, 0)
                            }}
                        >
                            {displayValue == null ?
                                <div className={styles.null}>NULL</div>
                            : displayValue == 'CURRENT_TIMESTAMP' ?
                                <div className={styles.null}>CURRENT_TIMESTAMP</div>
                            :
                                <div>{displayValue}</div>
                            }
                            {/* （->{value.newValue}） */}
                            </div>
                    }
                </>
            }
        </div>
    )
}

function SimpleInput({ inputId, value, onChange, onBlur }) {
    return (
        <input
            id={inputId}
            className={styles.simpleInput}
            value={value}
            onChange={e => {
                onChange && onChange(e)
            }}
            // onFocus(())
            onBlur={onBlur}
        />
    )
}

function EditableCellRender({ dataIndex, onChange } = {}) {
    return (value, _item, index) => {
        return (
            <Cell
                value={value}
                item={_item}
                dataIndex={dataIndex}
                index={index}
                onChange={(value, opts) => {
                    onChange && onChange({
                        index,
                        dataIndex,
                        value,
                    }, opts)
                }}
            />
        )
    }
}

export function TableDetail({ config, databaseType = 'mysql', connectionId, event$, dbName, 
    tableName: oldTableName, onTab }) {

    const { t } = useTranslation()
    const [tableName,setTableName] = useState(oldTableName)
    const [editType,setEditType] = useState(oldTableName ? 'update' : 'create')
    const isCreateMode = editType == 'create' || databaseType == 'sqlite'
    // Sqlite是不能像其他数据库那样对列进行修改的，包括队列的重命名，删除列，修改列属性等操作
    // 当然，Sqlite是直接可以新增列的
    const isForceCreate = editType == 'update' && databaseType == 'sqlite'
    // const editType = 
    const newNameRef = useRef(null)
    
    const [columnModalItem, setColumnModalItem] = useState(null)
    const [columnModalVisible, setColumnModalVisible] = useState(false)
    const [columnKeyword, setColumnKeyword] = useState('')
    const [tableColumns, setTableColumns] = useState([])

    const filteredTableColumns = useMemo(() => {
        if (!columnKeyword) {
            return tableColumns
        }
        return tableColumns.filter(item => {
            return (ItemHelper.mixValue(item, 'COLUMN_NAME') || '').toLowerCase().includes(columnKeyword.toLowerCase())
        })
    }, [tableColumns, columnKeyword])
    
    const [loading, setLoading] = useState(false)
    const [indexes, setIndexes] = useState([])
    const [removedRows, setRemovedRows] = useState([])
    const [removedIndexes, setRemovedIndexes] = useState([])
    const [partitions, setPartitions] = useState([])
    const [partitionModalItem, setPartitionModalItem] = useState(null)
    const [partitionModalIndex, setPartitionModalIndex] = useState(-1)
    const [partitionModalVisible, setPartitionModalVisible] = useState(false)
    const [triggers, setTriggers] = useState([])
    const [tableInfo, setTableInfo] = useState({})
    const [execSql, setExecSql] = useState('')
    const [curTab, setCurTab] = useState('basic')
    const [form] = Form.useForm()
    
    const [nginxs, setNginxs] = useState([])
    const [colSelectedRowKeys, setColSelectedRowKeys] = useState([])
    const [partionSelectedRowKeys, setPartitionSelectedRowKeys] = useState([])
    const [characterSets, setCharacterSets] = useState([])
    const [characterSetMap, setCharacterSetMap] = useState({})
    const characterSet = Form.useWatch('characterSet', form)
    const _old_characterSet_ref = useRef(null)
    const collations = useMemo(() => {
        if (!characterSet) {
            return []
        }
        if (!characterSetMap[characterSet]) {
            return []
        }
        return characterSetMap[characterSet].map(item => {
            return {
                label: item,
                value: item,
            }
        })
    }, [characterSet, characterSetMap])

    async function emitRefresh() {
        if (execSql.toLowerCase().includes('rename to') || execSql.toLowerCase().includes('create table')) {
            event$.emit({
                type: 'ev_refresh_table',
                data: {
                    connectionId,
                    schemaName: dbName,
                }
            })
        }
    }

    async function debug() {
        event$.emit({
            type: 'ev_refresh_table',
            data: {
                connectionId,
                schemaName: dbName,
            }
        })
    }

    function initForm(charData = []) {
        const characterSetMap: any = {}
        const characterSets = []
        for (let item of charData) {
            if (!characterSetMap[item.CHARACTER_SET_NAME]) {
                characterSetMap[item.CHARACTER_SET_NAME] = []
                characterSets.push({
                    label: item.CHARACTER_SET_NAME,
                    value: item.CHARACTER_SET_NAME
                })
            }
            characterSetMap[item.CHARACTER_SET_NAME].push(item.COLLATION_NAME)
        }
        characterSets.sort((a, b) => a.label.localeCompare(b.label))
        setCharacterSets(characterSets)
        setCharacterSetMap(characterSetMap)
        // CHARACTER_SET_NAME: "ucs2"
        // COLLATION_NAME: "ucs2_esperanto_ci"
        let tableColl = charData.find(item => item.COLLATION_NAME == tableInfo.TABLE_COLLATION)
        let values = {
            characterSet: null,
            collation: null,
        }
        if (tableColl) {
            _old_characterSet_ref.current = tableColl.CHARACTER_SET_NAME
            values = {
                characterSet: tableColl.CHARACTER_SET_NAME,
                collation: tableColl.COLLATION_NAME,
            }
        }
        form.setFieldsValue({
            ...tableInfo,
            ...values,
        })
    }

    async function loadCharData() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT *
    FROM \`information_schema\`.\`COLLATION_CHARACTER_SET_APPLICABILITY\``,
        })
        if (res.success) {
            const charData = res.data
            initForm(charData)
        }
    }
    // tableInfo

    useEffect(() => {
        if (!tableInfo) {
            return
        }
        if (editType == 'update' && !tableInfo.TABLE_NAME) {
            return
        }
        if (databaseType == 'mysql') {
            loadCharData()
        }
        else {
            initForm([])
        }
    }, [tableInfo])


    async function loadNginx() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT *
    FROM \`information_schema\`.\`ENGINES\``,
        })
        if (res.success) {
            const nginxs = res.data
                .filter(item => item.SUPPORT != 'NO')
                .map(item => {
                    return {
                        label: item.ENGINE,
                        value: item.ENGINE,
                    }
                })
            setNginxs(nginxs)

            // const characterSetMap = {}
            // const characterSets = []
            // for (let item of res.data) {
            //     if (!characterSetMap[item.CHARACTER_SET_NAME]) {
            //         characterSetMap[item.CHARACTER_SET_NAME] = []
            //         characterSets.push({
            //             label: item.CHARACTER_SET_NAME,
            //             value: item.CHARACTER_SET_NAME
            //         })
            //     }
            //     characterSetMap[item.CHARACTER_SET_NAME].push(item.COLLATION_NAME)
            // }
            // console.log('set', characterSetMap)
            // characterSets.sort((a, b) => a.label.localeCompare(b.label))
            // setCharacterSets(characterSets)
            // setCharacterSetMap(characterSetMap)
            // CHARACTER_SET_NAME: "ucs2"
            // COLLATION_NAME: "ucs2_esperanto_ci"
        }
    }

    useEffect(() => {
        if (databaseType == 'mysql') {
            loadNginx()
        }
    }, [])


    async function update() {
        // setLoading(true)
        const values = await form.validateFields()
        const attrSqls = []
        newNameRef.current = null
        if (editType == 'update' && values.TABLE_NAME != tableInfo.TABLE_NAME) {
            newNameRef.current = values.TABLE_NAME
            attrSqls.push(`RENAME TO \`${values.TABLE_NAME}\``)
        }
        if (values.TABLE_COMMENT != tableInfo.TABLE_COMMENT) {
            attrSqls.push(`COMMENT='${values.TABLE_COMMENT}'`)
        }
        if (values.ENGINE != tableInfo.ENGINE) {
            attrSqls.push(`ENGINE=${values.ENGINE}`)
        }
        if (values.AUTO_INCREMENT != tableInfo.AUTO_INCREMENT) {
            attrSqls.push(`AUTO_INCREMENT=${values.AUTO_INCREMENT}`)
        }
        if (values.collation != tableInfo.TABLE_COLLATION) {
            if (values.characterSet != _old_characterSet_ref.current) {
                attrSqls.push(`DEFAULT CHARACTER SET=${values.characterSet}`)
            }
            if (values.collation != tableInfo.TABLE_COLLATION && values.collation) {
                attrSqls.push(`COLLATE=${values.collation}`)
            }
        }

        // let changed = false
        // const idxChangedCols = []
        // console.log('idxChangedCols', idxChangedCols)
        const rowSqls = []
        const sqliteOldCols: string[] = []
        const sqliteNewCols: string[] = []
        tableColumns.forEach((row, rowIdx) => {
            // console.log('row', row)
            let rowChanged = false
            for (let field in row) {
                // console.log('field', field)
                const checkFields = [
                    'COLUMN_NAME',
                    'COLUMN_TYPE',
                    'IS_NULLABLE',
                    'COLUMN_KEY',
                    'COLUMN_DEFAULT',
                    'COLUMN_COMMENT',
                    'CHARACTER_SET_NAME',
                    'COLLATION_NAME',
                    'GENERATION_EXPRESSION',
                    'generationType',
                ]
                if (dbFunConfigMap[databaseType].autoIncrement) {
                    checkFields.push('isAuto')
                }
                // if (checkFields.includes(field) && hasValue(row[field].newValue)) {
                if (checkFields.includes(field) && ItemHelper.isValueChanged(row[field])) {
                    rowChanged = true
                }
            }
            // const isIdxChanged = !idxRow.__new && idxRow.__oldIndex != index
            // if (isIdxChanged) {
            //     idxChangedCols.push(idxRow)
            // }
            if (row.__idxChanged) {
                rowChanged = true
                // idxChangedCols.push(idxRow)
            }
            if (!rowChanged && !isForceCreate) {
                return
            }
            // changed = true
            const changeType = isCreateMode ? '' : row.__new ? 'ADD COLUMN' : ItemHelper.newValue(row, 'COLUMN_NAME') ? 'CHANGE COLUMN' : 'MODIFY COLUMN'
            let nameSql
            if (row.__new) {
                nameSql = `\`${ItemHelper.mixValue(row, 'COLUMN_NAME')}\``
            }
            else {
                if (isForceCreate) {
                    nameSql = `\`${ItemHelper.mixValue(row, 'COLUMN_NAME')}\``
                    sqliteOldCols.push(ItemHelper.oldValue(row, 'COLUMN_NAME'))
                    sqliteNewCols.push(ItemHelper.mixValue(row, 'COLUMN_NAME'))
                }
                else {
                    // TODO
                    let _nameSql = hasValue(ItemHelper.newValue(row, 'COLUMN_NAME')) ? `\`${ItemHelper.newValue(row, 'COLUMN_NAME')}\`` : ''
                    // 修改列名时有两个名（新旧）
                    nameSql = `\`${row.COLUMN_NAME.value}\`${_nameSql ? ` ${_nameSql}` : ''}`
                }
            }

            let codeSql = ``
            if (ItemHelper.mixValue(row, 'COLUMN_TYPE').includes('varchar') 
                && (ItemHelper.isKeyValueChanged(row, 'CHARACTER_SET_NAME') || ItemHelper.isKeyValueChanged(row, 'COLLATION_NAME'))) {

                const characterSet = ItemHelper.mixValue(row, 'CHARACTER_SET_NAME')
                // empty where new
                if (characterSet) {
                    codeSql = `CHARACTER SET ${characterSet}`
                    const collation = ItemHelper.mixValue(row, 'COLLATION_NAME')
                    if (collation) {
                        codeSql += ` COLLATE ${collation}`
                    }
                }
            }
            
            const typeSql = ItemHelper.mixValue(row, 'COLUMN_TYPE')
            const nullSql = ItemHelper.mixValue(row, 'IS_NULLABLE') == 'YES' ? 'NULL' : 'NOT NULL'

            let isAI = false
            let autoIncrementSql = ''
            if (dbFunConfigMap[databaseType].autoIncrement) {
                isAI = !!ItemHelper.mixValue(row, 'isAuto')
                autoIncrementSql = isAI ? 'AUTO_INCREMENT' : ''
            }

            let defaultSql = ''
            {
                const defaultValue = ItemHelper.mixValue(row, 'COLUMN_DEFAULT')
                if (ItemHelper.mixValue(row, 'IS_NULLABLE') != 'YES' && defaultValue === null) {
                    // 避免出现 NOT NULL DEFAULT NULL 的错误
                }
                else if (ItemHelper.mixValue(row, 'IS_NULLABLE') == 'YES' && defaultValue === null) {
                    // 避免出现 NULL DEFAULT NULL 的情况（没问题，不够简洁）
                }
                else if (isAI) {
                    // 避免出现 AUTO_INCREMENT DEFAULT '9' 的错误
                }
                else {
                    defaultSql = hasValueOrNullOrEmpty(defaultValue) ? `DEFAULT ${formatStringOrNull(defaultValue)}` : ''
                }
            }
            const commentSql = hasValue(ItemHelper.mixValue(row, 'COLUMN_COMMENT')) ? `COMMENT '${ItemHelper.mixValue(row, 'COLUMN_COMMENT')}'` : ''

            let positionSql = ''
            if (row.__idxChanged) {
                if (rowIdx == 0) {
                    positionSql = 'FIRST'
                }
                else {
                    const prevItem = tableColumns[rowIdx - 1]
                    const prevItemName = ItemHelper.mixValue(prevItem, 'COLUMN_NAME')
                    positionSql = `AFTER \`${prevItemName}\``
                }
            }

            let genSql = ''
            const genType = ItemHelper.mixValue(row, 'generationType')
            const genExp = ItemHelper.mixValue(row, 'GENERATION_EXPRESSION')
            if (genType) {
                genSql = `AS (${genExp}) ${genType}`
            }

            const rowSql = [
                changeType,
                nameSql,
                typeSql,
                codeSql,
                genSql,
                nullSql,
                autoIncrementSql,
                defaultSql,
                commentSql,
                positionSql,
            ].filter(item => item).join(' ')
            
            rowSqls.push(rowSql)
        })
        // 列删除逻辑
        if (removedRows.length) {
            for (let removedRow of removedRows) {
                rowSqls.push(`DROP COLUMN \`${removedRow.COLUMN_NAME.value}\``)
            }
        }
        // 主键逻辑
        function primaryKeySorter(a, b) {
            const aIdx = a['COLUMN_KEY'].primaryKeyIndex || 0
            const bIdx = b['COLUMN_KEY'].primaryKeyIndex || 0
            return aIdx - bIdx
        }
        function primaryKeySorterOld(a, b) {
            const aIdx = a['COLUMN_KEY'].primaryKeyIndexOld || 0
            const bIdx = b['COLUMN_KEY'].primaryKeyIndexOld || 0
            return aIdx - bIdx
        }
        const oldKeyColumns = tableColumns.filter(item => item.COLUMN_KEY.value == 'PRI' && !item.__new)
        const newKeyColumns = tableColumns.filter(item => ItemHelper.mixValue(item, 'COLUMN_KEY') == 'PRI')
        const oldKeys = oldKeyColumns.sort(primaryKeySorterOld).map(item => item.COLUMN_NAME.value).join(',')
        const newKeys = newKeyColumns.sort(primaryKeySorter).map(item => ItemHelper.mixValue(item, 'COLUMN_NAME')).join(',')

        const isKeyChanged = oldKeys != newKeys

        if (isKeyChanged && oldKeyColumns.length) {
            rowSqls.push(`DROP PRIMARY KEY`)
        }
        if (isKeyChanged && newKeyColumns.length) {
            let keySql = newKeyColumns.sort(primaryKeySorter).map(item => ItemHelper.mixValue(item, 'COLUMN_NAME'))
                .map(item => `\`${item}\``)
                .join(',')
            rowSqls.push(`${editType == 'create' ? '' : 'ADD '}PRIMARY KEY(${keySql})`)
        }

        // 索引删除逻辑
        const idxSqls = []
        if (removedIndexes.length) {
            for (let removedIndex of removedIndexes) {
                idxSqls.push(`DROP INDEX \`${removedIndex.name.value}\``)
            }
        }
        
        // 新增索引逻辑
        indexes.forEach((idxRow) => {
            const checkFields = [
                'name',
                'type2',
                'columns',
                'comment',
            ]
            let rowChanged = false
            for (let field in idxRow) {
                if (hasValue(idxRow[field].newValue) && checkFields.includes(field)) {
                    rowChanged = true
                }
            }
            // if (rowChanged) {
            function addIndex() {
                const columnsSql = ItemHelper.mixValue(idxRow, 'columns')
                    // .trim()
                    // .split(', ')
                    .map(item => `\`${item}\``)
                    .join(', ')
                const commentSql = hasValue(ItemHelper.mixValue(idxRow, 'comment')) ? `COMMENT '${ItemHelper.mixValue(idxRow, 'comment')}'` : ''
                const idxSql = ItemHelper.mixValue(idxRow, 'type2') == 'Unique' ? 'UNIQUE INDEX' : 'INDEX'
                console.log('idxRow.type2', idxRow.type2)
                if (editType == 'create') {
                    idxSqls.push(`${idxSql} \`${ItemHelper.mixValue(idxRow, 'name')}\` (${columnsSql}) ${commentSql}`)
                }
                else {
                    idxSqls.push(`ADD ${idxSql} \`${ItemHelper.mixValue(idxRow, 'name')}\` (${columnsSql}) ${commentSql}`)
                }
            }
            if (idxRow.__new) {
                addIndex()
            }
            else if (rowChanged) {
                idxSqls.push(`DROP INDEX \`${idxRow['name'].value}\``)
                addIndex()
            }
        })
        // for (let idxRow of indexes) {
        // }

        // 分区逻辑
        const partSqls = []
        for (let item of partitions) {
            const newItems = []
            if (item.__p_item_new) {
                newItems.push(item)
            }
            if (newItems.length) {
                const partListSql = newItems.map(item => {
                    return `partition ${item.PARTITION_NAME} values less than (${item.PARTITION_DESCRIPTION})`
                }).join(',\n')
                let partSql = `add partition (${partListSql})`
                partSqls.push(partSql)
            }
        }

        // must before 「No changed」check
        if (editType == 'create' && !rowSqls.length) {
            message.info('No columns')
            return
        }
        const allSqls = [
            ...attrSqls,
            ...rowSqls,
            ...idxSqls,
            ...partSqls,
        ]
        
        if (!allSqls.length) {
            message.info('No changed')
            return
        }
        let sqlList = []
        if (editType == 'create' || isForceCreate) {
            newNameRef.current = values.TABLE_NAME
            let bkTableName
            if (isForceCreate) {
                bkTableName = `_${oldTableName}_old_${moment().format('YYYYMMDD_HHmmss')}`
                sqlList.push(`ALTER TABLE "${dbName}"."${oldTableName}" RENAME TO "${bkTableName}";`)
            }
            sqlList.push(`CREATE TABLE \`${dbName}\`.\`${values.TABLE_NAME}\` (
${[...rowSqls, ...idxSqls].join(' ,\n')}
    ) ${attrSqls.join(' ,\n')};`)

            if (isForceCreate) {
                const oldColSql = sqliteOldCols.map(col => `"${col}"`).join(', ')
                const newColSql = sqliteNewCols.map(col => `"${col}"`).join(', ')
                sqlList.push(`INSERT INTO "${dbName}"."${values.TABLE_NAME}" (${newColSql}) SELECT ${oldColSql} FROM "${dbName}"."${bkTableName}";`)
            }
        }
        else {
            sqlList.push(`ALTER TABLE \`${dbName}\`.\`${tableInfo.TABLE_NAME}\`
${[...attrSqls, ...rowSqls, ...idxSqls, ...partSqls].join(' ,\n')};`)
        }
        
        console.log('sql', sqlList)
        // setSql(sql)
        setExecSql(sqlList.join('\n\n'))
    }

    function truncatePartition(items) {
        console.log('items', items)
        const sql = items.map(item => {
            return `ALTER TABLE \`${item.TABLE_SCHEMA}\`.\`${item.TABLE_NAME}\` TRUNCATE PARTITION ${item.PARTITION_NAME};`
        }).join('\n')
        event$.emit({
            type: 'event_open_sql',
            data: {
                connectionId,
                sql,
            }
        })
    }

    function createPartition() {
        setPartitionModalItem(null)
        setPartitionModalVisible(true)
    }

    function dropPartition(items) {
        console.log('items', items)
        const sql = items.map(item => {
            return `ALTER TABLE \`${item.TABLE_SCHEMA}\`.\`${item.TABLE_NAME}\` DROP PARTITION ${item.PARTITION_NAME};`
        }).join('\n')
        event$.emit({
            type: 'event_open_sql',
            data: {
                connectionId,
                sql,
            }
        })
    }

    function removePartition() {
        const sql = `ALTER TABLE \`${dbName}\`.\`${tableName}\` REMOVE PARTITIONING;`
        event$.emit({
            type: 'event_open_sql',
            data: {
                connectionId,
                sql,
            }
        })
    }

    function removePartitionItem(index) {
        partitions.splice(index, 1)
        setPartitions([
            ...partitions,
        ])
    }

    // async function submitChange() {
    //     let sql = `ALTER TABLE \`${tableName}\``
        
        
    //     sql += '\n' + rowSqls.join(' ,\n')
    //     console.log('sql', sql)
    //     setExecSql(sql)
    // }

    const triggerColumns = [
        {
            title: t('name'),
            dataIndex: 'TRIGGER_NAME',
            width: 160,
            ellipsis: true,
        },
        {
            title: t('type'),
            dataIndex: 'EVENT_MANIPULATION',
            width: 160,
            ellipsis: true,
        },
        {
            title: t('statement'),
            dataIndex: 'ACTION_STATEMENT',
            // width: 200,
            ellipsis: true,
        },
        // {
        //     title: '',
        //     dataIndex: '__empty',
        // },
    ]

    const partitionColumns = [
        {
            title: t('name'),
            dataIndex: 'PARTITION_NAME',
            width: 160,
            ellipsis: true,
        },
        {
            title: t('description'),
            dataIndex: 'PARTITION_DESCRIPTION',
            width: 240,
            ellipsis: true,
        },
        {
            title: t('expression'),
            dataIndex: 'PARTITION_EXPRESSION',
            width: 200,
            ellipsis: true,
        },
        {
            title: t('rows'),
            dataIndex: 'TABLE_ROWS',
            width: 110,
            ellipsis: true,
        },
        {
            title: t('data_length'),
            dataIndex: 'DATA_LENGTH',
            width: 120,
            ellipsis: true,
            render(value) {
                return filesize(parseFloat(value), { fixed: 1, }).human()
                // return (
                //     <div>{filesize(value, { fixed: 1, }).human()}</div>
                // )
            },
        },
        {
            title: t('actions'),
            dataIndex: 'actions',
            // fixed: 'right',
            width: 320,
            render(value, item, index) {
                return (
                    <Space>
                        {item.__p_item_new &&
                            <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                    setPartitionModalItem(item)
                                    setPartitionModalIndex(index)
                                    setPartitionModalVisible(true)
                                }}
                            >{t('edit')}</Button>
                        }
                        {item.__p_item_new ?
                            <Button
                                type="link"
                                size="small"
                                danger
                                onClick={() => {
                                    removePartitionItem(index)
                                }}
                            >{t('delete')}</Button>
                        :
                        <>
                            <Button
                                type="link"
                                size="small"
                                danger
                                onClick={() => {
                                    truncatePartition([item])
                                }}
                            >{t('truncate')}</Button>
                            <Button
                                type="link"
                                size="small"
                                danger
                                onClick={() => {
                                    dropPartition([item])
                                }}
                            >{t('drop')}</Button>
                        </>
                        }
                    </Space>
                )
            }
        },
        {
            title: '',
            dataIndex: '_empty',
        },
    ]

    function onColumnCellChange({ index, dataIndex, value,}, primaryKeyChanged) {
        console.log('onColumnCellChange', index, dataIndex, value)
        // onColumnCellChange 8 COLUMN_COMMENT {value: '节点名字', newValue: '节点名字3'}
        tableColumns[index][dataIndex] = value
        if (primaryKeyChanged) {
            if (primaryKeyChanged.isAdd) {
                let primaryCount = 0
                for (let column of tableColumns) {
                    const key = ItemHelper.mixValue(column, 'COLUMN_KEY')
                    if (key == 'PRI') {
                        primaryCount++
                    }
                }
                value.primaryKeyIndex = primaryCount - 1
            }
            else {
                // remove
                const removedPrimaryKeyIndex = tableColumns[index]['COLUMN_KEY'].primaryKeyIndex
                // 删除主键索引，后面的索引全部减 1
                for (let column of tableColumns) {
                    const key = ItemHelper.mixValue(column, 'COLUMN_KEY')
                    if (key == 'PRI') {
                        const { primaryKeyIndex } = column['COLUMN_KEY']
                        if (primaryKeyIndex > removedPrimaryKeyIndex) {
                            column['COLUMN_KEY'].primaryKeyIndex -= 1
                        }
                    }
                }
            }
        }
        setTableColumns([...tableColumns])
    }

    function onIndexCellChange({ index, dataIndex, value,}) {
        console.log('onColumnCellChange', index, dataIndex, value)
        indexes[index][dataIndex] = value
        setIndexes([...indexes])
    }

    

    const columnColumns = [
        {
            title: '',
            dataIndex: '__oldIndex',
            width: 48,
            render(value, _item, index) {
                return (
                    <div className={classNames(styles.cellWrap, styles.cellIndex)}>{index + 1}</div>
                )
            }
            // render: EditableCellRender({
            //     dataIndex: 'COLUMN_NAME',
            //     onChange: onColumnCellChange,
            // }),
        },
        {
            title: t('column_name'),
            dataIndex: 'COLUMN_NAME',
            width: 320,
            render: EditableCellRender({
                dataIndex: 'COLUMN_NAME',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('type'),
            dataIndex: 'COLUMN_TYPE',
            render: EditableCellRender({
                dataIndex: 'COLUMN_TYPE',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('length'),
            dataIndex: 'DATA_LENGTH',
            render: EditableCellRender({
                dataIndex: 'DATA_LENGTH',
                onChange: onColumnCellChange,
            }),
            visible: databaseType == 'oracle',
        },
        {
            // title: t('nullable'),
            title: (
                <Tooltip title={t('nullable')}>
                    <div>NU</div>
                </Tooltip>
            ),
            dataIndex: 'IS_NULLABLE',
            render: EditableCellRender({
                dataIndex: 'IS_NULLABLE',
                onChange: onColumnCellChange,
            }),
        },
        {
            // title: t('primary_key'),
            title: (
                <Tooltip title={t('primary_key')}>
                    <div>PK</div>
                </Tooltip>
            ),
            dataIndex: 'COLUMN_KEY',
            // render(value) {
            //     return (
            //         <div>{value.value}</div>
            //     )
            // }
            render: EditableCellRender({
                dataIndex: 'COLUMN_KEY',
                onChange(values, { primaryKeyChanged } = {}) {
                    onColumnCellChange(values, primaryKeyChanged)
                },
            }),
        },
        ..._if(dbFunConfigMap[databaseType].autoIncrement, {
            // title: t('auto_increment'),
            title: (
                <Tooltip title={t('auto_increment')}>
                    <div>AI</div>
                </Tooltip>
            ),
            dataIndex: 'isAuto',
            render: EditableCellRender({
                dataIndex: 'isAuto',
                onChange: onColumnCellChange,
            }),
        }),
        {
            title: t('default'),
            dataIndex: 'COLUMN_DEFAULT',
            width: 240,
            render: EditableCellRender({
                dataIndex: 'COLUMN_DEFAULT',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('comment'),
            dataIndex: 'COLUMN_COMMENT',
            render: EditableCellRender({
                dataIndex: 'COLUMN_COMMENT',
                onChange: onColumnCellChange,
            }),
            // render(value) {
            //     return (
            //         <div>?{JSON.stringify(value)}</div>
            //     )
            // }
        },
        // {
        //     title: t('character_set'),
        //     dataIndex: 'CHARACTER_SET_NAME',
        //     render: EditableCellRender({
        //         dataIndex: 'COLLATION_NAME',
        //         onChange: onColumnCellChange,
        //     }),
        // },
        {
            title: t('collation'),
            dataIndex: 'COLLATION_NAME',
            render: EditableCellRender({
                dataIndex: 'COLLATION_NAME',
                onChange: onColumnCellChange,
            }),
        },
        // {
        //     title: t('generationType'),
        //     dataIndex: 'generationType',
        //     render: EditableCellRender({
        //         dataIndex: 'generationType',
        //         onChange: onColumnCellChange,
        //     }),
        // },
        // {
        //     title: t('GENERATION_EXPRESSION'),
        //     dataIndex: 'GENERATION_EXPRESSION',
        //     render: EditableCellRender({
        //         dataIndex: 'GENERATION_EXPRESSION',
        //         onChange: onColumnCellChange,
        //     }),
        // },
        {
            title: t('actions'),
            dataIndex: 'op',
            render(_value, item, index) {
                return (
                    <div className={styles.cellWrap}>
                        <Space 
                            split={<Divider type="vertical" />}
                        >
                            <a
                                onClick={() => {
                                    setColumnModalItem(item)
                                    setColumnModalVisible(true)
                                }}
                            >{t('edit')}</a>
                            <a
                                className={styles.danger}
                                onClick={() => {
                                    setTableColumns(tableColumns.filter(_item => _item.__id != item.__id))
                                    if (!item.__new) {
                                        setRemovedRows([
                                            ...removedRows,
                                            item,
                                        ])
                                    }
                                }}
                            >{t('delete')}</a>
                        </Space>
                    </div>
                )
            }
        },
        {
            title: '',
            dataIndex: '__empty',
        },
    ]
    .filter(item => item.visible !== false)

    const indexColumns = [
        {
            title: t('index_name'),
            dataIndex: 'name',
            width: 240,
            render(value, _item, index) {
                return (
                    <Cell
                        value={value}
                        item={_item}
                        dataIndex="name"
                        index={index}
                        onChange={value => {
                            onIndexCellChange && onIndexCellChange({
                                index,
                                dataIndex: 'name',
                                value,
                            })
                        }}
                    />
                )
            }
        },
        {
            title: t('type'),
            dataIndex: 'type2',
            width: 120,
            // render: EditableCellRender({
            //     dataIndex: 'type2',
            //     onChange: onIndexCellChange,
            // }),
            render(value, _item, index) {
                return (
                    <Cell
                        value={value}
                        item={_item}
                        dataIndex="type2"
                        index={index}
                        onChange={value2 => {
                            console.log('type2.change', value2)
                            onIndexCellChange && onIndexCellChange({
                                index,
                                dataIndex: 'type2',
                                value: value2,
                            })
                        }}
                    />
                )
            }
        },
        // {
        //     title: '类型',
        //     dataIndex: 'type',
        // },
        {
            title: t('index_columns'),
            dataIndex: 'columns',
            width: 400,
            // render: EditableCellRender({
            //     dataIndex: 'columns',
            //     onChange: onIndexCellChange,
            // }),
            render(value, _item, index) {
                return (
                    <Cell
                        value={value}
                        item={_item}
                        dataIndex="columns"
                        selectOptions={tableColumns.map(item => {
                            const value = ItemHelper.mixValue(item, 'COLUMN_NAME')
                            return {
                                label: value,
                                value,
                            }
                        })}
                        index={index}
                        onChange={value2 => {
                            // console.log('type2.change', value2)
                            onIndexCellChange && onIndexCellChange({
                                index,
                                dataIndex: 'columns',
                                value: value2,
                            })
                        }}
                    />
                )
            }
        },
        // {
        //     title: 'COLUMN_NAME',
        //     dataIndex: 'COLUMN_NAME',
        // },
        {
            title: t('comment'),
            dataIndex: 'comment',
            width: 320,
            render: EditableCellRender({
                dataIndex: 'comment',
                onChange: onIndexCellChange,
            }),
        },
        // {
        //     title: '不唯一',
        //     dataIndex: 'NON_UNIQUE',
        // },
        {
            title: t('actions'),
            dataIndex: 'op',
            render(_value, item) {
                return (
                    <a
                        onClick={() => {
                            setIndexes(indexes.filter(_item => _item.__id != item.__id))
                            if (!item.__new) {
                                setRemovedIndexes([
                                    ...removedIndexes,
                                    item,
                                ])
                            }
                        }}
                    >
                        {t('delete')}
                    </a>
                )
            }
        },
        {
            title: '',
            dataIndex: '__empty',
        },
        
    ]
    async function loadTableInfo() {
        console.log('loadTableInfo', dbName, tableName)
        
        setRemovedRows([])
        setRemovedIndexes([])
        setPartitionSelectedRowKeys([])
        setColSelectedRowKeys([])
        if (dbName && tableName) {
            setLoading(true)
            let res = await request.post(`${config.host}/mysql/tableDetail`, {
                connectionId,
                dbName,
                tableName,
            }, {
                noMessage: true,
            })
            if (res.success) {
                if (!res.data.table) {
                    setTableInfo(null)
                    setLoading(false)
                    return
                }
                const rawIndexes = res.data.indexes
                setTableColumns(res.data.columns.map((col, idx) => {
                    const newCol = {}
                    newCol.__id = uid(32)
                    newCol.__oldIndex = idx
                    for (let key in col) {
                        newCol[key] = {
                            value: col[key],
                            newValue: undefined,
                        }
                        if (key == 'COLUMN_KEY' && col[key] == 'PRI') {
                            const fIndex = rawIndexes.find(item => item.INDEX_NAME == 'PRIMARY' && item.COLUMN_NAME == col['COLUMN_NAME'])
                            newCol[key].primaryKeyIndex = parseInt(fIndex['SEQ_IN_INDEX']) - 1
                            newCol[key].primaryKeyIndexOld = parseInt(fIndex['SEQ_IN_INDEX']) - 1
                        }
                    }
                    let generationType = ''
                    if (col['EXTRA'] == 'STORED GENERATED') {
                        generationType = 'STORED'
                    }
                    else if (col['EXTRA'] == 'VIRTUAL GENERATED') {
                        generationType = 'VIRTUAL'
                    }
                    newCol['generationType'] = {
                        value: generationType,
                        newValue: undefined,
                    }

                    let isAuto = col['EXTRA'] == 'auto_increment'
                    newCol['isAuto'] = {
                        value: isAuto,
                        newValue: undefined,
                    }

                    return newCol
                }))
                setTriggers(res.data.triggers)
                setPartitions(res.data.partitions
                    .filter(item => item.PARTITION_NAME)
                    .map(item => {
                        return {
                            __id: uid(32),
                            ...item,
                        }
                    }))

                // index
                let indexes = []
                if (databaseType != 'sqlite') {
                    const groupMap = _.groupBy(res.data.indexes, 'INDEX_NAME')
                    // console.log('groups2', groupMap)
                    for (let key in groupMap) {
                        const item0 = groupMap[key][0]
                        const columns = groupMap[key]
                        indexes.push({
                            __id: uid(32),
                            __INDEX_NAME: item0.INDEX_NAME,
                            name: {
                                value: item0.INDEX_NAME,
                            },
                            comment: {
                                value: item0.INDEX_COMMENT,
                            },
                            type2: {
                                value: item0.NON_UNIQUE == 1 ? 'Normal' : 'Unique',
                            },
                            type: item0.INDEX_TYPE,
                            NON_UNIQUE: item0.NON_UNIQUE,
                            columns: {
                                value: columns
                                    .sort((a, b) => {
                                        return a.SEQ_IN_INDEX - b.SEQ_IN_INDEX
                                    })
                                    .map(item => item.COLUMN_NAME)
                                    // .join(', ')
                            }
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
                    indexes = indexes.filter(item => item.__INDEX_NAME != "PRIMARY")
                    console.log('indexes', indexes)
                }
                else {
                    indexes = res.data.indexes.map(item => {
                        return {
                            __id: uid(32),
                            __INDEX_NAME: item.INDEX_NAME,
                            name: {
                                value: item.INDEX_NAME,
                            },
                            comment: {
                                value: item.INDEX_COMMENT,
                            },
                            type2: {
                                value: item.NON_UNIQUE == 1 ? 'Normal' : 'Unique',
                            },
                            type: item.INDEX_TYPE,
                            NON_UNIQUE: item.NON_UNIQUE,
                            columns: {
                                value: parseColumns(item['x-raw']),
                                // value: columns
                                //     .sort((a, b) => {
                                //         return a.SEQ_IN_INDEX - b.SEQ_IN_INDEX
                                //     })
                                //     .map(item => item.COLUMN_NAME)
                                    // .join(', ')
                            }
                            // {
                            //     title: 'SEQ_IN_INDEX',
                            //     dataIndex: 'SEQ_IN_INDEX',
                            // },
                            // {
                            //     title: 'COLUMN_NAME',
                            //     dataIndex: 'COLUMN_NAME',
                            // },
                        }
                    })
                    indexes = indexes.filter(item => item.columns && item.columns.value && item.columns.value.length)
                }

                setIndexes(indexes)
                setTableInfo(res.data.table)
            }
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTableInfo()
    }, [tableName])
    
    // console.log('render/indexes', indexes)

    function addColumn(index) {
        const newItem = {
            __id: uid(32),
            __new: true,
            COLUMN_NAME: {
                value: '',
                __new: true,
            },
            COLUMN_TYPE: {
                value: '',
                __new: true,
            },
            IS_NULLABLE: {
                value: tableColumns.length == 0 ? '' : 'YES',
                __new: true,
            },
            COLUMN_DEFAULT: {
                value: null,
                __new: true,
            },
            COLUMN_COMMENT: {
                value: '',
                __new: true,
            },
            COLUMN_KEY: {
                value: tableColumns.length == 0 ? 'PRI' : '',
                __new: true,
                primaryKeyIndex: tableColumns.length == 0 ? 0 : undefined,
            },
            generationType: {
                value: '',
                __new: true,
            },
            isAuto: {
                value: false,
                __new: true,
            },
            GENERATION_EXPRESSION: {
                value: '',
                __new: true,
            },
            CHARACTER_SET_NAME: {
                value: '',
                __new: true,
            },
            COLLATION_NAME: {
                value: '',
                __new: true,
            },
            // CHARACTER_MAXIMUM_LENGTH: 32
            // CHARACTER_OCTET_LENGTH: 96
            // CHARACTER_SET_NAME: "utf8"
            // COLLATION_NAME: "utf8_general_ci"
            // COLUMN_KEY: ""
            // DATA_TYPE: "varchar"
            // DATETIME_PRECISION: null
            // GENERATION_EXPRESSION: ""
            // NUMERIC_PRECISION: null
            // NUMERIC_SCALE: null
            // ORDINAL_POSITION: 2
            // PRIVILEGES: "select,insert,update,references"
            // TABLE_CATALOG: "def"
            // TABLE_NAME: "a_test5"
            // TABLE_SCHEMA: "linxot"
        }
        if (index == -1) {
            tableColumns.push(newItem)
        }
        else {
            newItem.__idxChanged = true
            tableColumns.splice(index, 0, newItem)
        }
        setTableColumns([...tableColumns])
    }

    const tabs = [
        {
            label: t('options'),
            key: 'basic',
        },
        {
            label: t('columns'),
            key: 'columns',
        },
        {
            label: t('indexes'),
            key: 'index',
        },
        // {
        //     label: t('doc'),
        //     key: 'doc',
        // }
    ]
    if (editType == 'update') {
        // tabs.push({
        //     label: t('indexes'),
        //     key: 'index',
        // })
        // console.log('databaseType', databaseType, dbFunConfigMap[databaseType])
        if (dbFunConfigMap[databaseType].partition) {
            tabs.push({
                label: t('partition'),
                key: 'partition',
            })
        }
        if (dbFunConfigMap[databaseType].trigger) {
            tabs.push({
                label: t('triggers'),
                key: 'trigger',
            })
        }
    }
    

	return (
        <div className={styles.detailBox}>
            {loading ?
                <div>{t('loading')}</div>
            : !tableInfo ?
                <div>
                    {t('sql.table.not_exists')} ({tableName})
                </div>
            :
                <>
                    <div className={styles.header}>
                        
                            
                            <Button
                                // loading={loading}
                                size="small"
                                type="primary"
                                onClick={update}
                                >
                                {t('save')}
                            </Button>
                            <div>
                                {tableName}@{dbName}
                            </div>
                            {/* <Button
                                size="small"
                                onClick={debug}
                                >
                                调试
                            </Button> */}
                            {editType == 'update' &&
                                <IconButton
                                    tooltip={t('refresh')}
                                    onClick={loadTableInfo}
                                >
                                    <ReloadOutlined />
                                </IconButton>
                                // <Button
                                //     size="small"
                                    
                                // >
                                //     {t('refresh')}
                                // </Button>
                            }
                            {/* <Button
                                    size="small"
                                    onClick={submitChange}
                                >
                                    提交修改
                                </Button> */}
                        {/* <Space>
                        </Space> */}
                    </div>
                    <div className={styles.body}>
                        <div className={styles.bodyLeft}>
                            <Tabs
                                activeKey={curTab}
                                onChange={key => {
                                    setCurTab(key)
                                }}
                                tabPosition="left"
                                type="card"
                                items={tabs}
                            />
                        </div>
                        
                        <div className={styles.bodyRight}>
                            {tabs.map(item => {
                                return (
                                    <div
                                        className={styles.tabContent}
                                        key={item.key}
                                        style={{
                                            display: item.key == curTab ? undefined : 'none',
                                        }}
                                    >
                                        {item.key == 'basic' &&
                                            <div>
                                                <div className={styles.formBox}>
                                                    <Form
                                                        form={form}
                                                        labelCol={{ span: 10 }}
                                                        wrapperCol={{ span: 16 }}
                                                        initialValues={{
                                                            port: 3306,
                                                        }}
                                                        size="small"
                                                        // layout={{
                                                        //     labelCol: { span: 0 },
                                                        //     wrapperCol: { span: 24 },
                                                        // }}
                                                    >
                                                        <Form.Item
                                                            name="TABLE_NAME"
                                                            label={t('name')}
                                                            rules={[ { required: true, }, ]}
                                                        >
                                                            <Input
                                                                suffix={<div>@{dbName}</div>}
                                                            />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="TABLE_COMMENT"
                                                            label={t('comment')}
                                                            rules={[]}
                                                        >
                                                            <Input.TextArea rows={4} />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="characterSet"
                                                            label={t('character_set')}
                                                        >
                                                            <Select
                                                                options={characterSets}
                                                                onChange={() => {
                                                                    console.log('change')
                                                                    form.setFieldsValue({
                                                                        collation: null,
                                                                    })
                                                                }}
                                                            />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="collation"
                                                            label={t('collation')}
                                                        >
                                                            <Select
                                                                options={collations}
                                                            />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="ENGINE"
                                                            label={t('nginx')}
                                                            rules={[]}
                                                        >
                                                            <Select
                                                                options={nginxs}
                                                            />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="AUTO_INCREMENT"
                                                            label={t('auto_increment')}
                                                        >
                                                            <InputNumber />
                                                        </Form.Item>
                                                        {/* <Form.Item
                                                                wrapperCol={{ offset: 8, span: 16 }}
                                                                // name="passowrd"
                                                                // label="Passowrd"
                                                                // rules={[{ required: true, },]}
                                                            >
                                                                <Space>
                                                                    
                                                                </Space>
                                                            </Form.Item> */}
                                                        {editType == 'update' &&
                                                            <>
                                                                <Form.Item label={t('data_length')}>
                                                                    {tableInfo.DATA_LENGTH ? filesize(parseFloat(tableInfo.DATA_LENGTH), { fixed: 1, }).human() : '--'}
                                                                </Form.Item>
                                                                <Form.Item label={t('avg_row_length')}>
                                                                    {tableInfo.AVG_ROW_LENGTH}
                                                                </Form.Item>
                                                                {/* <Form.Item label={t('auto_increment')}>
                                                                    {tableInfo.AUTO_INCREMENT}
                                                                </Form.Item> */}
                                                                <Form.Item label={t('row_format')}>
                                                                    {tableInfo.ROW_FORMAT}
                                                                </Form.Item>
                                                                <Form.Item label={t('create_time')}>
                                                                    {tableInfo.CREATE_TIME ? moment(tableInfo.CREATE_TIME).format('YYYY-MM-DD HH:mm:ss') : '--'}
                                                                </Form.Item>
                                                                <Form.Item label={t('update_time')}>
                                                                    {tableInfo.UPDATE_TIME ? moment(tableInfo.UPDATE_TIME).format('YYYY-MM-DD HH:mm:ss') : '--'}
                                                                </Form.Item>
                                                                {/* <Form.Item label="UPDATE_TIME">
                                                                    {tableInfo.UPDATE_TIME}
                                                                </Form.Item> */}
                                                            </>
                                                        }
                                                    </Form>
                                                    <div className={styles.apply}>
                                                        <Button
                                                            size="small"
                                                            onClick={async () => {
                                                                const values = await form.validateFields()
                                                                let collateSql = ''
                                                                if (values.collation) {
                                                                    collateSql = ` COLLATE ${values.collation}`
                                                                }
                                                                let sql = `ALTER TABLE \`${dbName}\`.\`${tableInfo.TABLE_NAME}\` CONVERT TO CHARACTER SET ${values.characterSet}${collateSql};`
                                                                setExecSql(sql)
                                                            }}
                                                        >
                                                            {t('sql.edit.apply_collation')}
                                                        </Button>
                                                    </div>
                                                </div>
                                                {editType == 'update' &&
                                                    <Descriptions column={1}>
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
                                                }
                                            </div>
                                        }
                                        {item.key == 'columns' &&
                                            <div className={styles.panelBox}>
                                                <div className={styles.panelHeader}>
                                                    {/* <input
                                                        onBlur={() => {
                                                            console.log('Bour OK')
                                                        }}
                                                    /> */}
                                                    <Space>
                                                        <Button
                                                            size="small"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => {
                                                                addColumn(-1)
                                                            }}
                                                        >
                                                            {t('add')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            disabled={!(colSelectedRowKeys.length == 1)}
                                                            icon={<InsertRowAboveOutlined />}
                                                            onClick={() => {
                                                                const rowKey = colSelectedRowKeys[0]
                                                                console.log('rowKey', rowKey)
                                                                // setTableColumns([...tableColumns])
                                                                const rowIdx = tableColumns.findIndex(_item => _item.__id == rowKey)
                                                                addColumn(rowIdx)
                                                            }}
                                                        >
                                                            {t('insert_above')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            disabled={!(colSelectedRowKeys.length == 1)}
                                                            icon={<InsertRowBelowOutlined />}
                                                            onClick={() => {
                                                                const rowKey = colSelectedRowKeys[0]
                                                                console.log('rowKey', rowKey)
                                                                const rowIdx = tableColumns.findIndex(_item => _item.__id == rowKey)
                                                                addColumn(rowIdx + 1)
                                                            }}
                                                        >
                                                            {t('insert_below')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            disabled={!(colSelectedRowKeys.length == 1)}
                                                            icon={<ArrowUpOutlined />}
                                                            onClick={() => {
                                                                const rowKey = colSelectedRowKeys[0]
                                                                console.log('rowKey', rowKey)
                                                                // setTableColumns([...tableColumns])
                                                                const rowIdx = tableColumns.findIndex(_item => _item.__id == rowKey)
                                                                if (rowIdx == 0) {
                                                                    return
                                                                }
                                                                console.log('rowIdx', rowIdx)
                                                                const tmp = tableColumns[rowIdx - 1]
                                                                tableColumns[rowIdx - 1] = tableColumns[rowIdx]
                                                                tableColumns[rowIdx] = tmp

                                                                tableColumns[rowIdx - 1].__idxChanged = true
                                                                tableColumns[rowIdx].__idxChanged = true
                                                                setTableColumns([...tableColumns])

                                                            }}
                                                        >
                                                            {t('move_up')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            disabled={!(colSelectedRowKeys.length == 1)}
                                                            icon={<ArrowDownOutlined />}
                                                            onClick={() => {
                                                                const rowKey = colSelectedRowKeys[0]
                                                                console.log('rowKey', rowKey)
                                                                // setTableColumns([...tableColumns])
                                                                const rowIdx = tableColumns.findIndex(_item => _item.__id == rowKey)
                                                                if (rowIdx == tableColumns.length - 1) {
                                                                    return
                                                                }
                                                                console.log('rowIdx', rowIdx)
                                                                const tmp = tableColumns[rowIdx + 1]
                                                                tableColumns[rowIdx + 1] = tableColumns[rowIdx]
                                                                tableColumns[rowIdx] = tmp

                                                                tableColumns[rowIdx + 1].__idxChanged = true
                                                                tableColumns[rowIdx].__idxChanged = true
                                                                setTableColumns([...tableColumns])

                                                            }}
                                                        >
                                                            {t('move_down')}
                                                        </Button>
                                                    </Space>
                                                    <Input
                                                        value={columnKeyword}
                                                        onChange={e => {
                                                            setColumnKeyword(e.target.value)
                                                        }}
                                                        allowClear
                                                        className={styles.filter}
                                                        placeholder={t('filter')}
                                                        size="small"
                                                    />
                                                </div>
                                                <div className={styles.panelBody}>
                                                    <Table
                                                        columns={columnColumns}
                                                        rowSelection={{
                                                            type: 'radio',
                                                            selectedRowKeys: colSelectedRowKeys,
                                                            hideSelectAll: true,
                                                            fixed: true,
                                                            // renderCell(_value, _item, rowIdx) {
                                                            //     // return (
                                                            //     //     <div>
                                                            //     //         <Button>1</Button>
                                                            //     //     </div>
                                                            //     // )
                                                            //     return (
                                                            //         <SimpleCell
                                                            //             onClick={(e) => {
                                                            //                 // console.log('_value', _value)
                                                            //                 // console.log('e', e)
                                                                            
                                                            //                 const itemKey = _item._idx
                                                            //                 // console.log('itemKey', itemKey)
                                                            //                 // 多选
                        
                                                            //                 if (e.metaKey) {
                                                            //                     console.log('metaKey')
                                                            //                     if (selectedRowKeys.includes(itemKey)) {
                                                            //                         console.log('又了')
                                                            //                         setSelectedRowKeys(selectedRowKeys.filter(it => it != itemKey))
                                                            //                     }
                                                            //                     else {
                                                            //                         console.log('没有')
                                                            //                         setSelectedRowKeys([...selectedRowKeys, itemKey])
                                                            //                     }
                                                            //                 }
                                                            //                 else if (e.shiftKey) {
                                                            //                     if (selectedRowKeys.length) {
                                                            //                         const fromIdx = selectedRowKeys[0]
                                                            //                         const min = Math.min(fromIdx, itemKey)
                                                            //                         const max = Math.max(fromIdx, itemKey)
                                                            //                         const newKeys = []
                                                            //                         for (let i = min; i <= max; i++) {
                                                            //                             newKeys.push(i)
                                                            //                         }
                                                            //                         setSelectedRowKeys(newKeys)
                                                            //                     }
                                                            //                     else {
                                                            //                         setSelectedRowKeys([itemKey])
                                                            //                     }
                                                            //                 }
                                                            //                 else {
                                                            //                     console.log('单选')
                                                            //                     // 单选
                                                            //                     if (selectedRowKeys.includes(itemKey)) {
                                                            //                         setSelectedRowKeys([])
                                                            //                     }
                                                            //                     else {
                                                            //                         setSelectedRowKeys([itemKey])
                                                            //                     }
                                                            //                 }
                                                            //             }}
                                                            //             text={rowIdx + 1} color="#999" />
                                                            //     )
                                                            // },
                                                            columnWidth: 0,
                                                            onChange(selectedRowKeys, selectedRows) {
                                                                setColSelectedRowKeys(selectedRowKeys)
                                                            }
                                                        }}
                                                        className={styles.noPaddingTable}
                                                        dataSource={filteredTableColumns}
                                                        bordered
                                                        pagination={false}
                                                        size="small"
                                                        rowKey="__id"
                                                        key={JSON.parse(JSON.stringify(filteredTableColumns))}
                                                    />
                                                </div>
                                            </div>
                                        }
                                        {item.key == 'index' &&
                                            <div className={styles.panelBox}>
                                                <div className={styles.panelHeader}>
                                                    <Space>
                                                        <Button
                                                            size="small"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => {
                                                                indexes.push({
                                                                    __id: uid(32),
                                                                    __new: true,
                                                                    name: {
                                                                        value: '',
                                                                    },
                                                                    comment: {
                                                                        value: '',
                                                                    },
                                                                    columns: {
                                                                        value: [],
                                                                    },
                                                                    type2: {
                                                                        value: 'Normal',
                                                                    },
                                                                    type: '',
                                                                    NON_UNIQUE: '',
                                                                })
                                                                setIndexes([...indexes])
                                                            }}
                                                        >
                                                            {t('add')}
                                                        </Button>
                                                    </Space>
                                                </div>
                                                <div className={styles.panelBody}>
                                                    <Table
                                                        columns={indexColumns}
                                                        dataSource={indexes}
                                                        bordered
                                                        pagination={false}
                                                        size="small"
                                                        rowKey="__id"
                                                    />
                                                </div>
                                            </div>
                                        }
                                        {item.key == 'partition' &&
                                            <div>
                                                <div className={styles.tool}>
                                                    <Space>
                                                        {editType == 'update' && partitions.length > 0 &&
                                                            <Button
                                                                size="small"
                                                                icon={<PlusOutlined />}
                                                                onClick={() => {
                                                                    createPartition()
                                                                }}
                                                            >
                                                                {t('add')}
                                                            </Button>
                                                        }
                                                        {partionSelectedRowKeys.length > 0 &&
                                                            <>
                                                                <Button
                                                                    size="small"
                                                                    danger
                                                                    onClick={() => {
                                                                        truncatePartition(partionSelectedRowKeys.map(name => {
                                                                            return partitions.find(item => item.PARTITION_NAME == name)
                                                                        }))
                                                                    }}
                                                                >
                                                                    {t('truncate')}
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    danger
                                                                    onClick={() => {
                                                                        dropPartition(partionSelectedRowKeys.map(name => {
                                                                            return partitions.find(item => item.PARTITION_NAME == name)
                                                                        }))
                                                                    }}
                                                                >
                                                                    {t('drop')}
                                                                </Button>
                                                            </>
                                                        }
                                                        {partitions.length > 0 &&
                                                            <Button
                                                                size="small"
                                                                danger
                                                                onClick={() => {
                                                                    removePartition()
                                                                }}
                                                            >
                                                                {t('sql.partition.remove')}
                                                            </Button>
                                                        }
                                                    </Space>
                                                </div>
                                                {partitions.length > 0 && editType == 'update' &&
                                                    <div className={styles.partitionInfo}>
                                                        {t('sql.partition.split_by')}
                                                        <Tag className={styles.tag}>
                                                            {partitions[0].PARTITION_METHOD}
                                                        </Tag>
                                                        <Tag className={styles.tag}>
                                                            {partitions[0].PARTITION_EXPRESSION}
                                                        </Tag>

                                                    </div>
                                                }
                                                <Table
                                                    columns={partitionColumns}
                                                    dataSource={partitions}
                                                    bordered
                                                    pagination={false}
                                                    rowSelection={{
                                                        selectedRowKeys: partionSelectedRowKeys,
                                                        onChange(selectedRowKeys, selectedRows, info) {
                                                            setPartitionSelectedRowKeys(selectedRowKeys)
                                                        },
                                                    }}
                                                    size="small"
                                                    rowKey="PARTITION_NAME"
                                                    scroll={{
                                                        // x: 2400,
                                                    }}
                                                />
                                            </div>
                                        }
                                        {item.key == 'trigger' &&
                                            <div>
                                                <Table
                                                    columns={triggerColumns}
                                                    dataSource={triggers}
                                                    bordered
                                                    pagination={false}
                                                    size="small"
                                                    rowKey="__id"
                                                    scroll={{
                                                        // x: 2400,
                                                    }}
                                                />
                                            </div>
                                        }
                                    </div>
                                )
                            })}
                        </div>
                        {/* <CodeDebuger path="src/views/db-manager/table-detail/table-detail.tsx" /> */}
                    </div>
                </>
            }
            {!!execSql &&
                <ExecModal
                    config={config}
                    connectionId={connectionId}
                    sql={execSql}
                    tableName={tableName}
                    dbName={dbName}
                    onClose={() => {
                        setExecSql('')
                    }}
                    onSuccess={() => {
                        emitRefresh()
                        // if (editType)
                        if (newNameRef.current) {
                            setEditType('update')
                            setTableName(newNameRef.current)
                            onTab && onTab({
                                tableName: newNameRef.current,
                                dbName,
                            })
                        }
                        else {
                            loadTableInfo()
                        }
                    }}
                />
            }
            {columnModalVisible &&
                <ColumnModal
                    item={columnModalItem}
                    characterSetMap={characterSetMap}
                    characterSets={characterSets}
                    onCancel={() => {
                        setColumnModalItem(null)
                        setColumnModalVisible(false)
                    }}
                    onOk={(values) => {
                        // console.log('values', values)
                        // console.log('columnModalItem', columnModalItem)
                        // console.log('tableColumns', tableColumns)
                        const idx = tableColumns.findIndex(item => item.__id == columnModalItem.__id)
                        if (idx == -1) {
                            message.error('index error')
                            return
                        }
                        
                        const isPkOld = ItemHelper.mixValue(tableColumns[idx], 'COLUMN_KEY') == 'PRI'

                        for (let key in values) {
                            if (!tableColumns[idx][key]) {
                                console.warn(`key ${key} not in row ${idx}`)
                            }
                            tableColumns[idx][key] = {
                                ...tableColumns[idx][key],
                                newValue: values[key]
                            }
                        }

                        const isPkNew = values['COLUMN_KEY'] == 'PRI'
                        if (!isPkOld && isPkNew) {
                            // add primary key
                            let primaryCount = 0
                            for (let column of tableColumns) {
                                const key = ItemHelper.mixValue(column, 'COLUMN_KEY')
                                if (key == 'PRI') {
                                    primaryCount++
                                }
                            }
                            tableColumns[idx]['COLUMN_KEY'].primaryKeyIndex = primaryCount - 1
                        }
                        if (isPkOld && !isPkNew) {
                            // remove primary key
                            const removedPrimaryKeyIndex = tableColumns[idx]['COLUMN_KEY'].primaryKeyIndex
                            // 删除主键索引，后面的索引全部减 1
                            for (let column of tableColumns) {
                                const key = ItemHelper.mixValue(column, 'COLUMN_KEY')
                                if (key == 'PRI') {
                                    const { primaryKeyIndex } = column['COLUMN_KEY']
                                    if (primaryKeyIndex > removedPrimaryKeyIndex) {
                                        column['COLUMN_KEY'].primaryKeyIndex -= 1
                                    }
                                }
                            }
                        }

                        setTableColumns([...tableColumns])
                        setColumnModalItem(null)
                        setColumnModalVisible(false)
                    }}
                />
            }
            {partitionModalVisible &&
                <PartitionModal
                    item={partitionModalItem}
                    onCancel={() => {
                        setPartitionModalVisible(false)
                    }}
                    onOk={(item) => {
                        setPartitionModalVisible(false)
                        if (partitionModalItem) {
                            partitions[partitionModalIndex].PARTITION_NAME = item.name
                            partitions[partitionModalIndex].PARTITION_DESCRIPTION = item.value
                            setPartitions([
                                ...partitions,
                            ])
                        }
                        else {
                            setPartitions([
                                ...partitions,
                                {
                                    __p_item_new: true,
                                    PARTITION_NAME: item.name,
                                    PARTITION_DESCRIPTION: item.value,
                                },
                            ])
                        }
                    }}
                />
            }
        </div>
    )
}
