import { Button, Descriptions, Dropdown, Form, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './user-list.module.less';
import _, { debounce } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { DatabaseOutlined, FormatPainterOutlined, ReloadOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { suggestionAdd } from '../suggestion';
import { SorterResult } from 'antd/lib/table/interface';
import { request } from '../utils/http';
import { ExecModal } from '../exec-modal/exec-modal';

export function UserEditModal({ config, connectionId, onSuccess, onCancel, item, onTab, data = {} }: any) {
    const userName = item.User
    console.warn('SqlTree/render')
    
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [sortedInfo, setSortedInfo] = useState({});
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [form] = Form.useForm()
    const [execSql, setExecSql] = useState('')
    useEffect(() => {
        form.setFieldsValue({
            ...item,
            password: item.authentication_string,
        })
    }, [item])
    const [list, setList] = useState([])
    

    async function loadData() {
        // console.log('props', this.props.match.params.name)
        // let dbName = this.props.match.params.name
        // this.dbName = dbName
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'user/fetchUserList',
        // });
        setLoading(true)
        setSortedInfo({})
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT *
FROM \`mysql\`.\`db\`
WHERE \`User\` = '${userName}'
LIMIT 20;`,
        })
        if (res.success) {
            // message.info('连接成功')
            const list = res.data
            console.log('res', list)

            const all_permissions = [
                {
                    name: 'Select',
                    col: 'Select_priv',
                },
                {
                    name: 'Insert',
                    col: 'Insert_priv',
                },
                {
                    name: 'Update',
                    col: 'Update_priv',
                },
                {
                    name: 'Delete',
                    col: 'Delete_priv',
                },
                {
                    name: 'Create',
                    col: 'Create_priv',
                },
                {
                    name: 'Drop',
                    col: 'Drop_priv',
                },
                {
                    name: 'Grant',
                    col: 'Grant_priv',
                },
                {
                    name: 'References',
                    col: 'References_priv',
                },
                {
                    name: 'Index',
                    col: 'Index_priv',
                },
                {
                    name: 'Alter',
                    col: 'Alter_priv',
                },
                {
                    name: 'Create Tmp Table',
                    col: 'Create_tmp_table_priv',
                },
                {
                    name: 'Lock Tables',
                    col: 'Lock_tables_priv',
                },
                {
                    name: 'Create View',
                    col: 'Create_view_priv',
                },
                {
                    name: 'Show View',
                    col: 'Show_view_priv',
                },
                {
                    name: 'Create Routine',
                    col: 'Create_routine_priv',
                },
                {
                    name: 'Alter Routine',
                    col: 'Alter_routine_priv',
                },
                {
                    name: 'Execute',
                    col: 'Execute_priv',
                },
                {
                    name: 'Event',
                    col: 'Event_priv',
                },
                {
                    name: 'Trigger',
                    col: 'Trigger_priv',
                },
            ]

            setList(list.map(item => {
                const permissions = []
                for (let per of all_permissions) {
                    if (item[per.col] == 'Y') {
                        permissions.push(per.name)
                    }
                }
                return {
                    ...item,
                    permissions: permissions.join(', ')
                }
            }))

            
        }
        //  else {
        //     message.error('连接失败')
        // }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [userName])

    function showSqlInNewtab({ title = 'New Query', sql }) {
        let tabKey = '' + new Date().getTime()
        onTab && onTab({
            type: 'sql-query',
            title,
            key: tabKey,
            defaultSql: sql,
            data: {
                dbName,
                tableName: null,
            },
        })
    }

    
    const columns = [
        {
            title: t('Db'),
            dataIndex: 'Db',
            with: 160,
        },
        {
            title: t('permissions'),
            dataIndex: 'permissions',
        },
    ]

    console.log('execSql', execSql)

    return (
        <div className={styles.tablesBox}>
            <Modal
                open={true}
                title="编辑用户"
                onCancel={onCancel}
                onOk={async () => {
                    const values = await form.validateFields()
                    const updates = []
                    // 修改用户名和主机
                    if (values.User != item.User || values.Host != item.Host) {
                        updates.push(`RENAME USER '${item.User}'@'${item.Host}' TO '${values.User}'@'${values.Host}';`)
                    }
                    // 修改密码
                    if (values.password != item.authentication_string) {
                        updates.push(`ALTER USER '${values.User}'@'${values.Host}' IDENTIFIED BY '${values.password}';`)
                    }
                    if (!updates.length) {
                        message.info('No changed.')
                        onCancel && onCancel()
                        return
                    }
                    setExecSql(updates.join('\n'))
                }}
            >
                <Form
                    form={form}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{
                        port: 3306,
                    }}
                    // layout={{
                    //     labelCol: { span: 0 },
                    //     wrapperCol: { span: 24 },
                    // }}
                >
                    <Form.Item
                        name="User"
                        label="User"
                        rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="Host"
                        label="Host"
                        rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[ { required: true, }, ]}
                    >
                        <Input
                            type="password"
                        />
                    </Form.Item>
                </Form>
                {/* <Table
                    className={styles.table}
                    dataSource={list}
                    pagination={false}
                    size="small"
                    rowKey="TABLE_NAME"
                    columns={columns}
                    loading={loading}
                    bordered
                    onChange={(pagination, filters, sorter) => {
                        console.log('Various parameters', pagination, filters, sorter);
                        // setFilteredInfo(filters);
                        console.log('sorter', sorter)
                        setSortedInfo(sorter)
                    }}
                    scroll={{
                        x: true,
                    }}
                /> */}
            </Modal>
            {!!execSql &&
                <ExecModal
                    config={config}
                    connectionId={connectionId}
                    sql={execSql}
                    tableName={null}
                    dbName={null}
                    onClose={() => {
                        setExecSql('')
                    }}
                    onSuccess={() => {
                        setExecSql('')
                        onSuccess && onSuccess()
                    }}
                />
            }
        </div>
    )
}
