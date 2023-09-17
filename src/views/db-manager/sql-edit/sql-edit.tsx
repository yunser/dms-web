import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './sql-edit.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '@/views/db-manager/editor/Editor';
import storage from '../storage'
import { request } from '@/views/db-manager/utils/http';


export function SqlEditHandler(props) {
    const { children, config, event$, connectionId, item, getCode, id, ids, onSuccess, asd = false } = props
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
                <SqlLikeModal
                    config={config}
                    event$={event$}
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


export function SqlLikeModal({ config, event$, item, getCode, onClose, onSuccess, onConnect, }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const editType = item ? 'update' : 'create'

    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                ...item,
            })
        }
        else {
            form.setFieldsValue({
                name: '',  
                sql: getCode(),
            })
        }
    }, [item])

    return (
        <Modal
            title={editType == 'create' ? t('sql.like.create') : t('sql.like.update')}
            open={true}
            onCancel={onClose}
            maskClosable={false}
            onOk={async () => {
                const values = await form.validateFields()
                if (editType == 'create') {
                    let ret = await request.post(`${config.host}/mysql/sql/create`, {
                        name: values.name,
                        sql: values.sql,
                    })
                    if (ret.success) {
                        message.success(t('saved'))
                        event$.emit({
                            type: 'event_sql_list_refresh',
                        })

                        onClose && onClose()
                        onSuccess && onSuccess()
                    }
                }
                else {
                    let ret = await request.post(`${config.host}/mysql/sql/update`, {
                        id: item.id,
                        data: {
                            name: values.name,
                            sql: values.sql,
                        }
                    })
                    if (ret.success) {
                        message.success(t('saved'))
                        onClose && onClose()
                        onSuccess && onSuccess()
                    }
                }
            }}
        >
            <Form
                form={form}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="sql"
                    label={t('sql')}
                    rules={[ { required: true, }, ]}
                >
                    <Input.TextArea
                        rows={8}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
