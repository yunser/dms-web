import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './db-edit.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';


export function ListPushHandler(props) {
    const { children, type = 'list', redisKey, config, connectionId, item, id, ids, onSuccess, asd = false } = props
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
                    type={type}
                    redisKey={redisKey}
                    connectionId={connectionId}
                    config={config}
                    item={item}
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


export function DatabaseModal({ config, type, redisKey, connectionId, item, onClose, onSuccess, onConnect, }) {
    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [characterSetMap, setCharacterSetMap] = useState({})
    const [form] = Form.useForm()
    const characterSet = Form.useWatch('characterSet', form)
    const [characterSets, setCharacterSets] = useState([])
    const editType = item ? 'update' : 'create'
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

    console.log('item', item)
    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                value: item.value,
                // for hash
                field: item.field,
                // for zset
                score: item.score,
                // characterSet: item.DEFAULT_CHARACTER_SET_NAME,
                // collation: item.DEFAULT_COLLATION_NAME,
            })
        }
    }, [item])
   


    return (
        <Modal
            title={editType == 'create' ? t('item_add') : t('item_update')}
            // title={'新增行'}
            visible={true}
            onCancel={onClose}
            maskClosable={false}
            onOk={async () => {
                const values = await form.validateFields()
                if (type == 'hash') {
                    if (editType == 'create') {
                        let ret = await request.post(`${config.host}/redis/hset`, {
                            key: redisKey,
                            connectionId,
                            field: values.field,
                            value: values.value,
                        })
                        // console.log('ret', ret)
                        if (ret.success) {
                            // message.success('连接成功')
                            // onConnect && onConnect()
                            message.success('Success')
                            onClose && onClose()
                            onSuccess && onSuccess()
                        }
                    }
                    else {
                        let ret = await request.post(`${config.host}/redis/hreplace`, {
                            connectionId,
                            key: redisKey,
                            field: item.field,
                            newField: values.field,
                            value: item.value,
                            newValue: values.value,
                        })
                        // console.log('ret', ret)
                        if (ret.success) {
                            // message.success('连接成功')
                            // onConnect && onConnect()
                            message.success('Success')
                            onClose && onClose()
                            onSuccess && onSuccess()
                        }
                    }
                }
                else if (type == 'zset') {
                    if (editType == 'create') {
                        let ret = await request.post(`${config.host}/redis/zadd`, {
                            key: redisKey,
                            connectionId,
                            score: values.score,
                            value: values.value,
                        })
                        // console.log('ret', ret)
                        if (ret.success) {
                            // message.success('连接成功')
                            // onConnect && onConnect()
                            message.success('Success')
                            onClose && onClose()
                            onSuccess && onSuccess()
                        }
                    }
                    else {
                        let ret = await request.post(`${config.host}/redis/zreplace`, {
                            connectionId,
                            key: redisKey,
                            score: item.score,
                            newScore: values.score,
                            value: item.value,
                            newValue: values.value,
                        })
                        // console.log('ret', ret)
                        if (ret.success) {
                            // message.success('连接成功')
                            // onConnect && onConnect()
                            message.success('Success')
                            onClose && onClose()
                            onSuccess && onSuccess()
                        }
                    }
                }
                else if (type == 'set') {
                    if (editType == 'create') {
                        let ret = await request.post(`${config.host}/redis/sadd`, {
                            key: redisKey,
                            connectionId,
                            value: values.value,
                        })
                        // console.log('ret', ret)
                        if (ret.success) {
                            // message.success('连接成功')
                            // onConnect && onConnect()
                            message.success('Success')
                            onClose && onClose()
                            onSuccess && onSuccess()
                        }
                    }
                    else {
                        let ret = await request.post(`${config.host}/redis/sreplace`, {
                            connectionId,
                            key: redisKey,
                            // index: item.index,
                            value: item.value,
                            newValue: values.value,
                        })
                        // console.log('ret', ret)
                        if (ret.success) {
                            // message.success('连接成功')
                            // onConnect && onConnect()
                            message.success('Success')
                            onClose && onClose()
                            onSuccess && onSuccess()
                        }
                    }
                }
                else {
                    if (editType == 'create') {
                        let ret = await request.post(`${config.host}/redis/rpush`, {
                            position: values.position,
                            key: redisKey,
                            connectionId,
                            value: values.value,
                        })
                        // console.log('ret', ret)
                        if (ret.success) {
                            // message.success('连接成功')
                            // onConnect && onConnect()
                            message.success('Success')
                            onClose && onClose()
                            onSuccess && onSuccess()
                        }
                    }
                    else {
                        let ret = await request.post(`${config.host}/redis/lset`, {
                            connectionId,
                            key: redisKey,
                            index: item.index,
                            value: values.value,
                        })
                        // console.log('ret', ret)
                        if (ret.success) {
                            // message.success('连接成功')
                            // onConnect && onConnect()
                            message.success('Success')
                            onClose && onClose()
                            onSuccess && onSuccess()
                        }
                    }
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
                    position: 'last',
                    // port: 6379,
                    // db: 0,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                {type == 'hash' &&
                    <Form.Item
                        name="field"
                        label={t('field')}
                        rules={[ { required: true, }, ]}
                    >
                        <Input
                        />
                    </Form.Item>
                }
                {type == 'zset' &&
                    <Form.Item
                        name="score"
                        label={t('score')}
                        rules={[ { required: true, }, ]}
                    >
                        <InputNumber
                        />
                    </Form.Item>
                }
                {editType == 'create' && type == 'list' &&
                    <Form.Item
                        name="position"
                        label={t('insert_into')}
                        rules={[ { required: true, }, ]}
                    >
                        <Select
                            options={[
                                {
                                    label: t('last'),
                                    value: 'last',
                                },
                                {
                                    label: t('front'),
                                    value: 'first',
                                },
                            ]}
                        />
                    </Form.Item>
                }
                <Form.Item
                    name="value"
                    label={t('content')}
                    rules={[ { required: true, }, ]}
                >
                    <Input
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
