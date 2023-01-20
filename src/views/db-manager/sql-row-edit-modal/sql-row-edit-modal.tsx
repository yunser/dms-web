import { Button, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './sql-row-edit-modal.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { TabPane } = Tabs
const { TextArea } = Input


export function RowEditModal({ config, onOk, item, onCancel, onSuccess, tableName, dbName }) {
    const { t } = useTranslation()

    const [formItems, setFormItems] = useState([])
    const [form] = Form.useForm()

    // console.log('RowEditModal/item', item)
    // console.log('RowEditModal/formItems', formItems)

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
        form.setFieldsValue(values)
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
                const values = await form.validateFields()
                console.log('values', values)
                // doSubmit()
                onOk && onOk(values)
            }}
            // footer={null}
        >
            <Form
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
                {formItems.map(item => {
                    return (
                        <Form.Item
                            name={item.field}
                            label={item.field}
                        >
                            <Input />
                        </Form.Item>
                    )
                })}
            </Form>
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
