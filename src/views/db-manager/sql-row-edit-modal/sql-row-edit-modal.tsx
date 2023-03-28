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

const { TabPane } = Tabs
const { TextArea } = Input

function MyInput({ value, onChange, ...otherProps }) {
    const { t } = useTranslation()
    return (
        <Space>
            <Input
                value={value}
                placeholder={value === null ? 'NULL' : ''}
                onChange={e => {
                    onChange && onChange(e.target.value)
                }}
                {...otherProps}
                onKeyDown={e => {
                    console.log('e', e.code)
                    if (e.code == 'Backspace') {
                        if (value === null) {
                            onChange && onChange('')
                        }
                        else if (value === '') {
                            onChange && onChange(null)
                        }
                    }
                }}
            />
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
            </Space>
        </Space>
    )
}

export function RowEditModal({ originColumns, onOk, item, onCancel, onSuccess, tableName, dbName }) {
    const { t } = useTranslation()

    const [formItems, setFormItems] = useState([])
    const [form] = Form.useForm()

    // console.log('RowEditModal/item', item)
    // console.log('RowEditModal/formItems', formItems)

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

        for (let key in item) {
            console.log('key', key)
            if (item[key] && item[key].fieldName) {
                const { fieldName, value } = item[key]
                list.push({
                    field: fieldName,
                    value,
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
            <div
                form={form}
                size="small"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
                    port: 3306,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                {formItems.map((item, index) => {
                    return (
                        <div className={styles.formItem}>
                            <div className={styles.label}>{item.field}</div>
                            <MyInput
                                className={styles.input}
                                size="small"
                                value={item.value}
                                onChange={value => {
                                    formItems[index].value = value
                                    setFormItems([...formItems])
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
