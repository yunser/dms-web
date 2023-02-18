import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './db-edit.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';


// export function ListPushHandler(props) {
//     const { children, redisKey, config, connectionId, item, id, ids, onSuccess, asd = false } = props
//     // const { id: deviceId } = item
//     // //console.log('children', children)
//     // children.props.onClick = () => {
//     //     alert(1)
//     // }
//     const [modalVisible, setModalVisible] = useState(false)
    

//     const [ loading, setLoading ] = useState(false)

//     const NewElem = React.cloneElement(children,
//         {
//             ...children.props,
//             // loading: loading,
//             // disabled: item ? item.receiveStatus : loading,
//             onClick() {
//                 setModalVisible(true)
//             },
//         },
//         children.props.children
//     )

    

//     return (
//         <>
//             {NewElem}
//             {modalVisible &&
//                 <DatabaseModal
//                     redisKey={redisKey}
//                     connectionId={connectionId}
//                     config={config}
//                     item={item}
//                     onSuccess={onSuccess}
//                     onClose={() => {
//                         setModalVisible(false)
//                     }}
//                 />
//             }
//         </>
//     )
//     // React.cloneWithProps(ReactComponent component, object? extraProps) #
// }


export function KeyAddModal({ config, type, onCancel, connectionId, item, onClose, onSuccess, onConnect, }) {
    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [characterSetMap, setCharacterSetMap] = useState({})
    const [form] = Form.useForm()
    const characterSet = Form.useWatch('characterSet', form)
    const [characterSets, setCharacterSets] = useState([])
    const editType = item ? 'update' : 'create'

    // useEffect(() => {
    //     if (item) {
    //         form.setFieldsValue({
    //             value: item.value,
    //             // characterSet: item.DEFAULT_CHARACTER_SET_NAME,
    //             // collation: item.DEFAULT_COLLATION_NAME,
    //         })
    //     }
    // }, [])
   

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        let res
        if (type == 'string') {
            res = await request.post(`${config.host}/redis/set`, {
                connectionId: connectionId,
                key: values.name,
                value: 'New Key',
                // dbName,
            })
        }
        else if (type == 'list') {
            res = await request.post(`${config.host}/redis/rpush`, {
                connectionId: connectionId,
                key: values.name,
                // field: '',
                value: 'New Item',
                // dbName,
            })
        }
        else if (type == 'set') {
            res = await request.post(`${config.host}/redis/sadd`, {
                connectionId: connectionId,
                key: values.name,
                // field: '',
                value: 'New Item',
                // dbName,
            })
        }
        else if (type == 'zset') {
            res = await request.post(`${config.host}/redis/zadd`, {
                connectionId: connectionId,
                key: values.name,
                // field: '',
                score: 0,
                value: 'New Item',
                // dbName,
            })
        }
        else if (type == 'hash') {
            res = await request.post(`${config.host}/redis/hset`, {
                connectionId: connectionId,
                key: values.name,
                // field: '',
                field: 'New Field',
                value: 'New Value',
                // dbName,
            })
        }
        else if (type == 'stream') {
            res = await request.post(`${config.host}/redis/xadd`, {
                connectionId: connectionId,
                key: values.name,
                // field: '',
                // fields: ['New Field', 'New Field'],
                fields: ['Field', 'Value'],
                // value: 'New Value',
                // dbName,
            })
        }
        console.log('get/res', res.data)
        if (res.success) {
            message.success(t('success'))
            onSuccess && onSuccess({
                key: values.name,
            })
            // setResult({
            //     key: item,
            //     ...res.data,
            // })
            // setInputValue(res.data.value)
        }
        setLoading(false)
        // if (editType == 'create') {
        //     let ret = await request.post(`${config.host}/redis/rpush`, {
        //         position: values.position,
        //         key: redisKey,
        //         connectionId,
        //         value: values.value,
        //     })
        //     // console.log('ret', ret)
        //     if (ret.success) {
        //         // message.success('连接成功')
        //         // onConnect && onConnect()
        //         message.success('Success')
        //         onClose && onClose()
        //         onSuccess && onSuccess()
        //     }
        // }
        // else {
        //     let ret = await request.post(`${config.host}/redis/lset`, {
        //         connectionId,
        //         key: redisKey,
        //         index: item.index,
        //         value: values.value,
        //     })
        //     // console.log('ret', ret)
        //     if (ret.success) {
        //         // message.success('连接成功')
        //         // onConnect && onConnect()
        //         message.success('Success')
        //         onClose && onClose()
        //         onSuccess && onSuccess()
        //     }
        // }
        // else {
        //     message.error('Fail')
        // }
    }

    return (
        <Modal
            title={`${t('add')} ${t(type)}`}
            // title={'新增行'}
            visible={true}
            onCancel={onCancel}
            maskClosable={false}
            confirmLoading={loading}
            onOk={handleOk}
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
                onFinish={handleOk}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label={t('key_name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        autoFocus
                        // disabled={!(editType == 'create')}
                    />
                </Form.Item>
                {/* <Form.Item
                    name="characterSet"
                    label="Character Set"
                    // rules={editType == 'create' ? [] : [ { required: true, }, ]}
                >
                    <Select
                        options={characterSets}
                        onChange={() => {
                            console.log('change')
                            form.setFieldsValue({
                                collation: null,
                            })
                        }}
                        // onChange={}
                    />
                </Form.Item> */}
                
            </Form>
        </Modal>
    );
}
