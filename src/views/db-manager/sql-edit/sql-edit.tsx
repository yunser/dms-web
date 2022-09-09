import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './sql-edit.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'


export function SqlEditHandler(props) {
    const { children, config, connectionId, item, getCode, id, ids, onSuccess, asd = false } = props
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
                    connectionId={connectionId}
                    item={item}
                    getCode={getCode}
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


export function DatabaseModal({ config, item, getCode, onClose, onSuccess, onConnnect, }) {
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

    return (
        <Modal
            // title={editType == 'create' ? t('db_create') : t('db_edit')}
            title="Save SQL"
            visible={true}
            onCancel={onClose}
            maskClosable={false}
            onOk={async () => {
                const values = await form.validateFields()
                if (editType == 'create') {
                    let ret = await request.post(`${config.host}/mysql/sql/create`, {
                        name: values.name,
                        sql: getCode(),
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
                    let sql = `ALTER SCHEMA \`${item.SCHEMA_NAME}\``
                    if (values.characterSet) {
                        sql += ` DEFAULT CHARACTER SET ${values.characterSet}`
                    }
                    if (values.collation) {
                        sql += ` COLLATE ${values.collation}`
                    }
                    console.log('sql', sql)
                    // return
                    let ret = await request.post(`${config.host}/mysql/execSql`, {
                        sql,
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
                // }}
            >
                <Form.Item
                    name="name"
                    label="Title"
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        // disabled={!(editType == 'create')}
                    />
                </Form.Item>
                
            </Form>
        </Modal>
    );
}
