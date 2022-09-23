import { Button, Checkbox, Descriptions, Dropdown, Form, Input, InputProps, Menu, message, Modal, Popover, Select, Space, Table, Tabs, Tooltip, Tree } from 'antd';
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
import { uid } from 'uid';















// ALL 或 ALL PRIVILEGES：表示以上所有权限。
// 2) 授予表权限时，<权限类型>可以指定为以下值：
// SELECT：授予用户可以使用 SELECT 语句进行访问特定表的权限。
// INSERT：授予用户可以使用 INSERT 语句向一个特定表中添加数据行的权限。
// DELETE：授予用户可以使用 DELETE 语句从一个特定表中删除数据行的权限。
// DROP：授予用户可以删除数据表的权限。
// UPDATE：授予用户可以使用 UPDATE 语句更新特定数据表的权限。
// ALTER：授予用户可以使用 ALTER TABLE 语句修改数据表的权限。
// REFERENCES：授予用户可以创建一个外键来参照特定数据表的权限。
// CREATE：授予用户可以使用特定的名字创建一个数据表的权限。
// INDEX：授予用户可以在表上定义索引的权限。
// ALL 或 ALL PRIVILEGES：所有的权限名。

const all_permissions = [
    // SELECT：表示授予用户可以使用 SELECT 语句访问特定数据库中所有表和视图的权限。
    {
        name: 'Select',
        col: 'Select_priv',
        code: 'SELECT',
    },
    // INSERT：表示授予用户可以使用 INSERT 语句向特定数据库中所有表添加数据行的权限。
    {
        name: 'Insert',
        col: 'Insert_priv',
        code: 'INSERT',
    },
    // UPDATE：表示授予用户可以使用 UPDATE 语句更新特定数据库中所有数据表的值的权限。
    {
        name: 'Update',
        col: 'Update_priv',
        code: 'UPDATE',
    },
    // DELETE：表示授予用户可以使用 DELETE 语句删除特定数据库中所有表的数据行的权限。
    {
        name: 'Delete',
        col: 'Delete_priv',
        code: 'DELETE',
    },
    // CREATE：表示授权用户可以使用 CREATE TABLE 语句在特定数据库中创建新表的权限。
    {
        name: 'Create',
        col: 'Create_priv',
        code: 'CREATE',
    },
    // DROP：表示授予用户可以删除特定数据库中所有表和视图的权限。
    {
        name: 'Drop',
        col: 'Drop_priv',
        code: 'DROP',
    },
    {
        name: 'Grant Option',
        col: 'Grant_priv',
        code: 'GRANT OPTION',
    },
    // REFERENCES：表示授予用户可以创建指向特定的数据库中的表外键的权限。
    {
        name: 'References',
        col: 'References_priv',
        code: 'REFERENCES',
    },
    // INDEX：表示授予用户可以在特定数据库中的所有数据表上定义和删除索引的权限。
    {
        name: 'Index',
        col: 'Index_priv',
        code: 'INDEX',
    },
    // ALTER：表示授予用户可以使用 ALTER TABLE 语句修改特定数据库中所有数据表的权限。 
    {
        name: 'Alter',
        col: 'Alter_priv',
        code: 'ALTER',
    },
    // CREATE TEMPORARY TABLES：表示授予用户可以在特定数据库中创建临时表的权限。
    {
        name: 'Create Temporary Table',
        col: 'Create_tmp_table_priv',
        code: 'CREATE TEMPORARY TABLES',
    },
    // LOCK TABLES：表示授予用户可以锁定特定数据库的已有数据表的权限。
    {
        name: 'Lock Tables',
        col: 'Lock_tables_priv',
        code: 'LOCK TABLES',
    },
    // CREATE VIEW：表示授予用户可以在特定数据库中创建新的视图的权限。
    {
        name: 'Create View',
        col: 'Create_view_priv',
        code: 'CREATE VIEW',
    },
    // SHOW VIEW：表示授予用户可以查看特定数据库中已有视图的视图定义的权限。
    {
        name: 'Show View',
        col: 'Show_view_priv',
        code: 'SHOW VIEW',
    },
    // CREATE ROUTINE：表示授予用户可以为特定的数据库创建存储过程和存储函数的权限。
    {
        name: 'Create Routine',
        col: 'Create_routine_priv',
        code: 'CREATE ROUTINE',
    },
    // ALTER ROUTINE：表示授予用户可以更新和删除数据库中已有的存储过程和存储函数的权限。 
    {
        name: 'Alter Routine',
        col: 'Alter_routine_priv',
        code: 'ALTER ROUTINE',
    },
    // EXECUTE ROUTINE：表示授予用户可以调用特定数据库的存储过程和存储函数的权限。
    {
        name: 'Execute',
        col: 'Execute_priv',
        code: 'EXECUTE',
    },
    {
        name: 'Event',
        col: 'Event_priv',
        code: 'EVENT',
    },
    {
        name: 'Trigger',
        col: 'Trigger_priv',
        code: 'TRIGGER',
    },
    {
        name: 'Reload',
        col: 'Reload_priv',
        code: 'RELOAD',
    },
    {
        name: 'Shutdown',
        col: 'Shutdown_priv',
        code: 'SHUTDOWN',
    },
    {
        name: 'Super',
        col: 'Super_priv',
        code: 'SUPER',
    },
    {
        name: 'Show Databases',
        col: 'Show_db_priv',
        code: 'SHOW DATABASES',
    },
    {
        name: 'File',
        col: 'File_priv',
        code: 'FILE',
    },
    {
        name: 'Process',
        col: 'Process_priv',
        code: 'PROCESS',
    },
    {
        name: 'Replication Slave',
        col: 'Repl_slave_priv',
        code: 'REPLICATION SLAVE',
    },
    {
        name: 'Replication Client',
        col: 'Repl_client_priv',
        code: 'REPLICATION CLIENT',
    },
    {
        name: 'Create User',
        col: 'Create_user_priv',
        code: 'CREATE USER',
    },
    {
        name: 'Create Tablespace',
        col: 'Create_tablespace_priv',
        code: 'CREATE TABLESPACE',
    },
    
    
    
    
]

function DbModal({ config, connectionId, onOk, onCancel }) {
    const [form] = Form.useForm()
    const [options, setOptions] = useState([])
    async function loadDbList() {
        // setLoading(true)
        let ret = await request.post(`${config.host}/mysql/databases`, {
            connectionId,
        })
        // console.log('ret', ret)
        if (ret.success) {
            // message.info('连接成功')
            // console.log('ret', ret.data)
            // storage.set('connectId', 'ret.data')
            setOptions(ret.data.map(item => {
                return {
                    label: item.SCHEMA_NAME,
                    value: item.SCHEMA_NAME,
                }
            }))
        } else {
            // message.error('连接失败')
        }
        // setLoading(false)
    }

    useEffect(() => {
        loadDbList()
    }, [])

    return (
        <Modal
            title="选择数据库"
            open={true}
            onCancel={onCancel}
            onOk={async () => {
                const values = await form.validateFields()
                console.log('values', values)
                onOk && onOk(values.schema)
            }}
        >
            <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={{
                    // port: 3306,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="schema"
                    label="数据库"
                    rules={[ { required: true, }, ]}
                >
                    <Select
                        options={options}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

function PermissionEditModal({ value, onCancel, onOk }) {

    const [checkValues, setCheckValues] = useState([])
    const [checkOptions, setCheckOptions] = useState([])
    
    console.log('value?', value)

    useEffect(() => {

        // const checkValues = []
        const checkOptions = []
        for (let per of all_permissions) {
            checkOptions.push({
                label: per.name,
                value: per.col,
            })
            // if (item[per.col] == 'Y') {
            //     checkValues.push(per.col)
            // }
        }
        setCheckOptions(checkOptions)
        setCheckValues(value.map(item => item.col))
    }, [])
    
    return (
        <Modal
            title="编辑权限"
            open={true}
            onCancel={onCancel}
            onOk={() => {
                console.log('ok', checkValues)
                const newList = checkValues.map(col => {
                    return all_permissions.find(item => item.col == col)
                })
                console.log('newList', newList)
                onOk && onOk(newList)
            }}
        >
            <div className={styles.perBox}>
                <Checkbox.Group
                    options={checkOptions}
                    value={checkValues}
                    onChange={value => {
                        setCheckValues(value)
                    }}
                />
            </div>
        </Modal>
    )
}


export function UserEditModal({ config, connectionId, onSuccess, onCancel, item, onTab, data = {} }: any) {
    
    console.warn('SqlTree/render')
    
    const editType = item ? 'update' : 'create'
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [sortedInfo, setSortedInfo] = useState({});
    const [loading, setLoading] = useState(false)
    // const [curTab, setCurTab] = useState('basic')
    // const [curTab, setCurTab] = useState('global')
    const [perModalVisible, setPerModalVisible] = useState(false)
    const [perModalItem, setPerModalItem] = useState(false)
    const [removedDbPers, setRemovedDbPers] = useState([])
    const [curTab, setCurTab] = useState('database')
    const [form] = Form.useForm()
    const [execSql, setExecSql] = useState('')
    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                ...item,
                password: item.authentication_string,
            })
        }
        else {
            form.setFieldsValue({
                User: '',
                Host: '',
                password: '',
            })
        }
    }, [item])
    const [list, setList] = useState([])
    const [checkOptions, setCheckOptions] = useState([])
    const [checkValues, setCheckValues] = useState([])
    const [truePermissions, setTruePermissions] = useState([])
    const [dbModalVisible, setDbModalVisible] = useState(false)
    

    async function loadData() {
        // console.log('props', this.props.match.params.name)
        // let dbName = this.props.match.params.name
        // this.dbName = dbName
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'user/fetchUserList',
        // });
        if (!item) {
            return
        }
        const userName = item.User
        setLoading(true)
        setSortedInfo({})
        setRemovedDbPers([])
        
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT *
FROM \`mysql\`.\`db\`
WHERE \`User\` = '${userName}'
ORDER BY \`Db\` ASC;`,
        })
        if (res.success) {
            // message.info('连接成功')
            const list = res.data
            console.log('res', list)

            let count = 0
            const truePermissions = []
            for (let itemKey in item) {
                console.log('itemKey', itemKey)
                if (itemKey.match(/_priv$/)) {
                    const fPer = all_permissions.find(item => item.col == itemKey)

                    count++
                    if (fPer) {
                        truePermissions.push(fPer)
                    }
                    else {
                        console.warn('权限没加上', itemKey)
                    }
                }
            }
            console.log('count', count)

            const checkOptions = []
            const checkValues = []
            for (let per of truePermissions) {
                checkOptions.push({
                    label: per.name,
                    value: per.col,
                })
                if (item[per.col] == 'Y') {
                    checkValues.push(per.col)
                }
            }
            setCheckOptions(checkOptions)
            setCheckValues(checkValues)
            setTruePermissions(truePermissions)


            setList(list.map(item => {
                const _permissions = []
                // const permissions = []
                for (let per of truePermissions) {
                    if (item[per.col] == 'Y') {
                        // permissions.push(per.name)
                        _permissions.push(per)
                    }
                }
                return {
                    __id: uid(16),
                    ...item,
                    _permissions,
                    _oldPermissions: JSON.parse(JSON.stringify(_permissions)),
                    // permissions: permissions.join(', '),
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
    }, [item])

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
            dataIndex: '_permissions',
            with: 640,
            render(value) {
                return (
                    <div>{value.map(it => it.name).join((', '))}</div>
                )
            }
        },
        {
            title: '操作',
            dataIndex: 'op',
            fixed: 'right',
            render(_value, item) {
                return (
                    <Space>
                        {/* <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                setCurUserName(item.User)
                            }}
                        >
                            查看数据库权限
                        </Button> */}
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                // setEditVisible(true)
                                // setEditUserItem(item)
                                console.log('item', item)
                                setPerModalVisible(true)
                                setPerModalItem(item)
                            }}
                        >
                            {t('edit')}
                        </Button>
                        <Button
                            danger
                            type="link"
                            size="small"
                            onClick={() => {
                                // setExecSql(`DROP USER '${item.User}'@'${item.Host}';`)
                                setRemovedDbPers([
                                    ...removedDbPers,
                                    item,
                                ])
                                setList(list.filter(_item => _item.__id != item.__id))
                            }}
                        >
                            {t('delete')}
                        </Button>
                    </Space>
                )
            }
        },
    ]

    // console.log('execSql', execSql)

    const tabs = [
        {
            label: t('基本设置'),
            key: 'basic',
        },
    ]
    if (editType == 'update') {
        tabs.push(...[
            {
                label: t('全局权限'),
                key: 'global',
            },
            {
                label: t('数据库权限'),
                key: 'database',
            },
        ])
    }

    return (
        <div>
            <Modal
                open={true}
                title="编辑用户"
                width={1200}
                onCancel={onCancel}
                onOk={async () => {
                    const values = await form.validateFields()
                    const updates = []
                    const uh = `'${values.User}'@'${values.Host || '%'}'`
                    if (editType == 'create') {
                        // let pwdCode = ''
                        updates.push(`CREATE USER ${uh} IDENTIFIED BY '${values.password}';`)
                    }
                    else {
                        // 修改用户名和主机
                        if (values.User != item.User || values.Host != item.Host) {
                            updates.push(`RENAME USER '${item.User}'@'${item.Host}' TO ${uh};`)
                        }
                        // 修改密码
                        if (values.password != item.authentication_string) {
                            updates.push(`ALTER USER ${uh} IDENTIFIED BY '${values.password}';`)
                        }
                    }
                    // 修改全局权限
                    const addPer = []
                    const delPer = []
                    for (let per of truePermissions) {
                        if (item[per.col] == 'Y' && !checkValues.includes(per.col)) {
                            delPer.push(per.code)
                        }
                        if (item[per.col] == 'N' && checkValues.includes(per.col)) {
                            addPer.push(per.code)
                        }
                    }
                    console.log('delPer', delPer)
                    if (delPer.length) {
                        updates.push(`REVOKE ${delPer.join(', ')} ON *.* FROM ${uh};`)
                    }
                    if (addPer.length) {
                        updates.push(`GRANT ${addPer.join(', ')} ON *.* TO ${uh};`)
                    }
                    // 删除数据库权限
                    if (removedDbPers.length) {
                        console.log('removedDbPers', removedDbPers)
                        for (let item of removedDbPers) {
                            updates.push(`REVOKE ${item._oldPermissions.map(it => it.code).join(', ')} ON \`${item.Db}\`.* FROM ${uh};`)
                        }
                    }
                    for (let item of list) {
                        if (item.__new) {
                            // 新增数据库权限
                        }
                        else {
                            // 编辑数据库权限

                        }
                        // 新增的权限逻辑
                        const addList = []
                        for (let it of item._permissions) {
                            const fOld = item._oldPermissions.find(_it => _it.col == it.col)
                            if (!fOld) {
                                addList.push(it)
                            }
                        }
                        console.log('item', item)
                        console.log('addList', addList)
                        if (addList.length) {
                            updates.push(`GRANT ${addList.map(it => it.code).join(', ')} ON \`${item.Db}\`.* TO ${uh};`)
                        }
                        // 删除的权限逻辑
                        const removeList = []
                        for (let it of item._oldPermissions) {
                            const fOld = item._permissions.find(_it => _it.col == it.col)
                            if (!fOld) {
                                removeList.push(it)
                            }
                        }
                        console.log('removeList', removeList)
                        if (removeList.length) {
                            updates.push(`REVOKE ${removeList.map(it => it.code).join(', ')} ON \`${item.Db}\`.* FROM ${uh};`)
                        }
                        
                    }

                    if (!updates.length) {
                        message.info('No changed.')
                        onCancel && onCancel()
                        return
                    }
                    setExecSql(updates.join('\n'))
                }}
            >
                <div className={styles.detailBox}>
                    <div className={styles.detailLeft}>
                        <Tabs
                            activeKey={curTab}
                            onChange={key => {
                                setCurTab(key)
                            }}
                            tabPosition="left"
                            type="card"
                            items={tabs}
                        />
                    </div>
                    <div className={styles.detailRight}>
                        {tabs.map(item => {
                            return (
                                <div
                                    className={styles.tabContent}
                                    key={item.key}
                                    style={{
                                        display: item.key == curTab ? undefined : 'none',
                                    }}
                                >
                                    {item.key == 'basic' &&
                                        <div className={styles.formBox}>
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
                                                    rules={[ { required: editType == 'update', }, ]}
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
                                        </div>
                                    }
                                    {item.key == 'global' &&
                                        <div>
                                            <Checkbox.Group
                                                options={checkOptions}
                                                value={checkValues}
                                                onChange={value => {
                                                    setCheckValues(value)
                                                }}
                                            />
                                        </div>
                                    }
                                    {item.key == 'database' &&
                                        <div>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setDbModalVisible(true)
                                                }}
                                            >
                                                新增
                                            </Button>
                                            <Table
                                                className={styles.table}
                                                dataSource={list}
                                                pagination={false}
                                                size="small"
                                                rowKey="__id"
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
                                            />
                                        </div>
                                    }
                                </div>
                            )
                        })}

                    </div>
                </div>
                
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
            {perModalVisible &&
                <PermissionEditModal
                    value={perModalItem._permissions}
                    onCancel={() => {
                        setPerModalVisible(false)
                    }}
                    onOk={(pers) => {
                        const idx = list.findIndex(it => it.__id == perModalItem.__id)
                        console.log('idx', idx)
                        list[idx]._permissions = pers
                        setList([
                            ...list,
                        ])
                        setPerModalVisible(false)
                    }}
                />
            }
            {dbModalVisible &&
                <DbModal
                    config={config}
                    connectionId={connectionId}
                    onCancel={() => {
                        setDbModalVisible(false)
                    }}
                    onOk={(schema) => {
                        setDbModalVisible(false)
                        setList([
                            ...list,
                            {
                                __new: true,
                                __id: uid(16),
                                // ...item,
                                Db: schema,
                                _permissions: [],
                                _oldPermissions: [],
                            }
                        ])
                    }}
                    
                />
            }
        </div>
    )
}
