import { Button, Descriptions, Dropdown, Empty, Form, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-paste.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';


export function FilePasteModal({ file, onOk, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)

    const [form] = Form.useForm()

    async function handleOk() {
        const values = await form.validateFields()
        onOk && onOk({
            name: values.name,
        })
        // setLoading(true)
        // const folder = getParentPath(item.path)
        // const res = await request.post(`${config.host}/file/rename`, {
        //     // connectionId: connectionId,
        //     fromPath: item.path,
        //     toPath: (folder == '/' ? '/' : (folder + '/')) + values.name,
        //     sourceType,
        //     type,
        //     // field: '',
        //     // value: 'New Item',
        //     // dbName,
        // })
        // if (res.success) {
        //     onSuccess && onSuccess()
        // }
        // setLoading(false)
    }

    useEffect(() => {
        // loadDetail()
        form.setFieldsValue({
            // name: `${uid(16)}.png`,
            name: file.name,
        })
    }, [])

    return (
        <Modal
            title={t('upload_image')}
            open={true}
            onCancel={onCancel}
            onOk={handleOk}
            // confirmLoading={loading}
            maskClosable={false}
        >
            <Form
                form={form}
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
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    )
}
