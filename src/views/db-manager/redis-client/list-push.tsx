import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './db-edit.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'


export function ListPushHandler(props) {
    const { children, redisKey, config, connectionId, item, id, ids, onSuccess, asd = false } = props
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


export function DatabaseModal({ config, redisKey, connectionId, item, onClose, onSuccess, onConnnect, }) {
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

    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                name: item.SCHEMA_NAME,
                characterSet: item.DEFAULT_CHARACTER_SET_NAME,
                collation: item.DEFAULT_COLLATION_NAME,
            })
        }
    }, [])
   


    return (
        <Modal
            // title={editType == 'create' ? t('db_create') : t('db_edit')}
            title={'新增行'}
            visible={true}
            onCancel={onClose}
            maskClosable={false}
            onOk={async () => {
                const values = await form.validateFields()
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
                        // onConnnect && onConnnect()
                        message.success('Success')
                        onClose && onClose()
                        onSuccess && onSuccess()
                    }
                }
                else {
                    // let sql = `ALTER SCHEMA \`${item.SCHEMA_NAME}\``
                    // if (values.characterSet) {
                    //     sql += ` DEFAULT CHARACTER SET ${values.characterSet}`
                    // }
                    // if (values.collation) {
                    //     sql += ` COLLATE ${values.collation}`
                    // }
                    // console.log('sql', sql)
                    // // return
                    // let ret = await request.post(`${config.host}/mysql/execSql`, {
                    //     connectionId,
                    //     sql,
                    // })
                    // // console.log('ret', ret)
                    // if (ret.success) {
                    //     // message.success('连接成功')
                    //     // onConnnect && onConnnect()
                    //     message.success('Success')
                    //     onClose && onClose()
                    //     onSuccess && onSuccess()
                    // }
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
                <Form.Item
                    name="position"
                    label="插入到"
                    rules={[ { required: true, }, ]}
                >
                    <Select
                        options={[
                            {
                                label: '最后面',
                                value: 'last',
                            },
                            {
                                label: '最前面',
                                value: 'first',
                            },
                        ]}
                    />
                </Form.Item>
                <Form.Item
                    name="value"
                    label="内容"
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        disabled={!(editType == 'create')}
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
