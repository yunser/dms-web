import { Button, Checkbox, Descriptions, Dropdown, Form, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
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
        name: 'Grant',
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

export function UserEditModal({ config, connectionId, onSuccess, onCancel, item, onTab, data = {} }: any) {
    const userName = item.User
    console.warn('SqlTree/render')
    
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [sortedInfo, setSortedInfo] = useState({});
    const [loading, setLoading] = useState(false)
    // const [curTab, setCurTab] = useState('basic')
    const [curTab, setCurTab] = useState('global')
    const [form] = Form.useForm()
    const [execSql, setExecSql] = useState('')
    useEffect(() => {
        form.setFieldsValue({
            ...item,
            password: item.authentication_string,
        })
    }, [item])
    const [list, setList] = useState([])
    const [checkOptions, setCheckOptions] = useState([])
    const [checkValues, setCheckValues] = useState([])
    const [truePermissions, setTruePermissions] = useState([])
    

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
                const permissions = []
                for (let per of truePermissions) {
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
    }, [userName, item])

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

    const tabs = [
        {
            label: t('基本设置'),
            key: 'basic',
        },
        {
            label: t('全局权限'),
            key: 'global',
        },
    ]

    return (
        <div>
            <Modal
                open={true}
                title="编辑用户"
                width={800}
                onCancel={onCancel}
                onOk={async () => {
                    const values = await form.validateFields()
                    const updates = []
                    const uh = `'${values.User}'@'${values.Host}'`
                    // 修改用户名和主机
                    if (values.User != item.User || values.Host != item.Host) {
                        updates.push(`RENAME USER '${item.User}'@'${item.Host}' TO ${uh};`)
                    }
                    // 修改密码
                    if (values.password != item.authentication_string) {
                        updates.push(`ALTER USER ${uh} IDENTIFIED BY '${values.password}';`)
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
                                </div>
                            )
                        })}

                    </div>
                </div>
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
