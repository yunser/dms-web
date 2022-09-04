import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './db-edit.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'


export function DatabaseEditHandler(props) {
    const { children, config, device, id, ids, onSuccess, asd = false } = props
    // const { id: deviceId } = item
    // //console.log('children', children)
    // children.props.onClick = () => {
    //     alert(1)
    // }
    const [modalVisible, setModalVisible] = useState(false)


    const [ loading, setLoading ] = useState(false)

    const NewElem = React.cloneElement(children,
        {
            ...children.props,
            // loading: loading,
            // disabled: item ? item.receiveStatus : loading,
            onClick() {
                setModalVisible(true)
            },
        },
        children.props.children
    )
    return (
        <>
            {NewElem}
            {modalVisible &&
                <DatabaseModal
                    config={config}
                    onSuccess={onSuccess}
                    onClose={() => {
                        setModalVisible(false)
                    }}
                />
            }
        </>
    )
    // React.cloneWithProps(ReactComponent component, object? extraProps) #
}


export function DatabaseModal({ config, onClose, onSuccess, onConnnect, }) {
    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const [code, setCode] = useState(`{
    "host": "",
    "user": "",
    "password": ""
}`)

//     useEffect(() => {
// //         console.log('onMouneed', storage.get('redisInfo', `{
// //     "host": "",
// //     "user": "",
// //     "password": ""
// // }`))
//         const redisInfo = storage.get('redisInfo', {
//             "host": "",
//             "user": "",
//             "password": "",
//             port: 6379,
//             remember: true,
//         })
//         // setCode(storage.get('redisInfo', `{
//         //     "host": "",
//         //     "user": "",
//         //     "password": ""
//         // }`))
//         form.setFieldsValue(redisInfo)
//     }, [])

    async function  connect() {
        setLoading(true)
        const values = await form.validateFields()
        const reqData = {
            host: values.host,
            port: values.port,
            user: values.user,
            password: values.password,
            db: values.db,
            remember: values.remember,
        }
        if (values.remember) {
            storage.set('redisInfo', reqData)
        }
        let ret = await request.post(`${config.host}/redis/connect`, reqData)
        // console.log('ret', ret)
        if (ret.status === 200) {
            // message.success('连接成功')
            onConnnect && onConnnect()
        }
        setLoading(false)
        // else {
        //     message.error('连接失败')
        // }
    }

    return (
        <Modal
            title="新增数据库"
            visible={true}
            onCancel={onClose}
            onOk={async () => {
                const values = await form.validateFields()
                let ret = await request.post(`${config.host}/mysql/execSql`, {
                    sql: `CREATE SCHEMA \`${values.name}\` ;`
                })
                // console.log('ret', ret)
                if (ret.status === 200) {
                    // message.success('连接成功')
                    // onConnnect && onConnnect()
                    message.success('Success')
                    onClose && onClose()
                    onSuccess && onSuccess()
                }
                // else {
                //     message.error('Fail')
                // }
            }}
        >
            <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
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
                    label="Schema name"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}
