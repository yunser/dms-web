import { Button, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './sql-row-edit-modal.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import TextareaAutosize from 'react-textarea-autosize'
import { SearchUtil } from '@/utils/search';
import { uid } from 'uid';

const { TabPane } = Tabs
const { TextArea } = Input

function MyInput({ value, onChange, column, ...otherProps }) {
    const { t } = useTranslation()

    let type = 'text'
    console.log('column', column)
    // if (column?.DATA_TYPE == 'varchar') {
    if (column?.DATA_TYPE == 'int' || column?.DATA_TYPE == 'tinyint') {
        type = 'number'
    }

    const commomProps = {
        value,
        placeholder: value === null ? 'NULL' : '',
        onChange: e => {
            onChange && onChange(e.target.value)
        },
        onKeyDown: e => {
            console.log('e', e.code)
            if (e.code == 'Backspace') {
                if (value === null) {
                    onChange && onChange('')
                }
                else if (value === '') {
                    onChange && onChange(null)
                }
            }
        }
    }

    return (
        <Space>
            {column?.DATA_TYPE == 'varchar' ?
                <TextareaAutosize
                    className={styles.textarea}
                    maxRows={8}
                    {...commomProps}
                />
            :
                <Input
                    type={type}
                    {...otherProps}
                    {...commomProps}
                />
            }
            <Space>
                <Button
                    size="small"
                    tabIndex={-1}
                    onClick={() => {
                        onChange && onChange(null)
                    }}
                >
                    {t('sql.null')}
                </Button>
                <Button
                    size="small"
                    tabIndex={-1}
                    onClick={() => {
                        onChange && onChange('')
                    }}
                >
                    {t('sql.empty')}
                </Button>
                <Button
                    size="small"
                    tabIndex={-1}
                    disabled={!(column?.DATA_TYPE == 'datetime')}
                    onClick={() => {
                        const time = moment().format('YYYY-MM-DD HH:mm:ss')
                        onChange && onChange(time)
                    }}
                >
                    {t('sql.now')}
                </Button>
            </Space>
        </Space>
    )
}

export function RowEditModal({ originColumns, onOk, item, onCancel, onSuccess, tableName, dbName }) {
    const { t } = useTranslation()

    const [formKey, setFormKey] = useState(() => {
        return uid(16)
    })
    const [formItems, setFormItems] = useState([])
    const [form] = Form.useForm()
    const [keyword, setKeyword] = useState('')
    // console.log('RowEditModal/item', item)
    // console.log('RowEditModal/formItems', formItems)
    const filterdFormItems = useMemo(() => {
        return SearchUtil.searchLike(formItems, keyword, {
            attributes: ['field'],
        })
    }, [formItems, keyword])

    const columnMap = useMemo(() => {
        const result = {}
        for (let col of originColumns) {
            result[col.COLUMN_NAME] = col
        }
        return result
    }, [originColumns])

    useEffect(() => {
        const list = [] 
        const values = {}

        let idx = 0
        for (let key in item) {
            console.log('key', key)
            if (item[key] && item[key].fieldName) {
                const { fieldName, value } = item[key]
                list.push({
                    field: fieldName,
                    value,
                    index: idx++,
                })

                values[fieldName] = value
            }
        }
        // console.log('list', list)
        setFormItems(list)
        // form.setFieldsValue(values)
    }, [item])

    
	return (
        <Modal
            title={t('edit')}
            visible={true}
            width={800}
            maskClosable={false}
            // okText={t('run')}
            // onOk={handleOk}
            // okButtonProps={{
            //     children: t('run'),
            // }}
            onCancel={onCancel}
            onOk={async () => {
                // const values = await form.validateFields()
                const values = {}
                console.log('formItems', formItems)
                for (let formItem of formItems) {
                    values[formItem.field] = formItem.value
                }
                console.log('values', values)
                // doSubmit()
                onOk && onOk(values)
            }}
            // footer={null}
        >
            <div className={styles.filterBox}>
                <Input
                    className={styles.input}
                    placeholder={t('filter')}
                    value={keyword}
                    size="small"
                    // allowClear 会导致输入框高度不对
                    // allowClear
                    onChange={e => {
                        setKeyword(e.target.value)
                    }}
                />
            </div>
            <div
                className={styles.form}
                key={formKey}
            >
                
                {filterdFormItems.map((item, index) => {
                    return (
                        <div className={styles.formItem}>
                            <div className={styles.label}>{item.field}</div>
                            <MyInput
                                className={styles.input}
                                size="small"
                                value={item.value}
                                column={columnMap[item.field]}
                                onChange={value => {
                                    formItems[item.index].value = value
                                    setFormItems([...formItems])
                                    if (value === null) {
                                        setFormKey(uid(16))
                                    }
                                }}
                            />
                            <Popover
                            content={
                                <div>
                                    <div>{columnMap[item.field]?.COLUMN_TYPE}</div>
                                    <div>{columnMap[item.field]?.COLUMN_COMMENT}</div>
                                </div>
                            }
                            >
                            <InfoCircleOutlined className={styles.info} style={{ opacity: columnMap[item.field]?.COLUMN_COMMENT ? 1 : 0.4}} />
                        </Popover>

                            {/* ({item.value === null ? '<null>' : item.value}) */}
                        </div>
                        // <Form.Item
                        //     name={item.field}
                        //     label={item.field}
                        // >
                        // </Form.Item>
                    )
                })}
            </div>
            {/* <Table
                dataSource={list}
                columns={columns}
                size="small"
                pagination={false}
                scroll={{
                    y: 480,
                }}
            /> */}
        </Modal>
    )
}
