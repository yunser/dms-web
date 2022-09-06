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


export function DatabaseEditHandler(props) {
    const { children, config, item, id, ids, onSuccess, asd = false } = props
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


export function DatabaseModal({ config, item, onClose, onSuccess, onConnnect, }) {
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
    // useEffect(() => {
    //     form.setFieldsValue({
    //         collation: null,
    //     })
    // }, [characterSet])
    

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

    async function loadCharData() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            sql: `SELECT *
    FROM \`information_schema\`.\`COLLATION_CHARACTER_SET_APPLICABILITY\``,
        })
        if (res.success) {
            console.log('res.data', res.data)
            const characterSetMap = {}
            const characterSets = []
            for (let item of res.data) {
                if (!characterSetMap[item.CHARACTER_SET_NAME]) {
                    characterSetMap[item.CHARACTER_SET_NAME] = []
                    characterSets.push({
                        label: item.CHARACTER_SET_NAME,
                        value: item.CHARACTER_SET_NAME
                    })
                }
                characterSetMap[item.CHARACTER_SET_NAME].push(item.COLLATION_NAME)
            }
            console.log('set', characterSetMap)
            characterSets.sort((a, b) => a.label.localeCompare(b.label))
            setCharacterSets(characterSets)
            setCharacterSetMap(characterSetMap)
            // CHARACTER_SET_NAME: "ucs2"
            // COLLATION_NAME: "ucs2_esperanto_ci"
        }
    }

    useEffect(() => {
        loadCharData()
    }, [])


    return (
        <Modal
            title={editType == 'create' ? t('db_create') : t('db_edit')}
            visible={true}
            onCancel={onClose}
            maskClosable={false}
            onOk={async () => {
                const values = await form.validateFields()
                if (editType == 'create') {
                    let sql = `CREATE SCHEMA \`${values.name}\``
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
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label="Schema name"
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        disabled={!(editType == 'create')}
                    />
                </Form.Item>
                <Form.Item
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
                </Form.Item>
                <Form.Item
                    name="collation"
                    label="Collation"
                    // rules={[ { required: true, }, ]}
                >
                    <Select
                        options={collations}
                        // onChange={}
                    />
                </Form.Item>
                
                
            </Form>
        </Modal>
    );
}
