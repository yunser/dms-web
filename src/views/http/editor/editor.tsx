import React, { useState, useEffect, useMemo } from 'react';
// import { Link, history } from 'umi';
import {
    Button,
    Row,
    Col,
    Input,
    Select,
    Descriptions,
    Result,
    Avatar,
    Space,
    Statistic,
    Table,
    Tabs,
    message,
    Empty,
    Modal,
    Tree,
} from 'antd';
// import { LikeOutlined, UserOutlined } from '@ant-design/icons';
// import type { ProSettings } from '@ant-design/pro-layout';
// import ProLayout, {
//     PageContainer,
//     SettingDrawer,
// } from '@ant-design/pro-layout';
// import { CommonPage } from '@/components/common-page';
// import ProCard from '@ant-design/pro-card';
// import commonService from '@/service/common';
// import { useRequest } from '@umijs/hooks';
// import http from '@/utils/http';
// import { apiDomain } from '@/config';
import axios from 'axios'
import qs from 'qs'
import { useTranslation, Trans } from "react-i18next";
import styles from './editor.module.less'
import { t } from 'i18next';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { ReloadOutlined } from '@ant-design/icons';
import { useEventEmitter } from 'ahooks';

// const Confirm = 
const { TabPane } = Tabs;

const MethodKey = {
    Get: 'get',
    Post: 'post',
    Put: 'put',
    Delete: 'delete',
};

function MyTable({ dataSource = [], columns = [], onChange }) {
    console.log('MyTable.render')
    return (
        <div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>{t('key')}</th>
                        <th>{t('key')}</th>
                        <th>{t('description')}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {dataSource.map((item, idx) => {
                        return (
                            <tr>
                                <td>
                                    <Input
                                        value={item.key}
                                        onChange={e => {
                                            dataSource[idx].key = e.target.value
                                            onChange && onChange([
                                                ...dataSource,
                                            ])
                                        }}
                                    />
                                </td>
                                <td>
                                    <Input
                                        value={item.value}
                                        onChange={e => {
                                            dataSource[idx].value = e.target.value
                                            onChange && onChange([
                                                ...dataSource,
                                            ])
                                        }}
                                    />
                                </td>
                                <td>
                                    <Input
                                        value={item.description}
                                        onChange={e => {
                                            dataSource[idx].description = e.target.value
                                            onChange && onChange([
                                                ...dataSource,
                                            ])
                                        }}
                                    />
                                    {/* {item.description} */}
                                </td>
                                <td>
                                    <Button
                                        onClick={() => {
                                            dataSource.splice(idx, 1)
                                            onChange && onChange([
                                                ...dataSource,
                                                // {
                                                //     key: '',
                                                //     value: '',
                                                //     description: '',
                                                // }
                                            ])
                                        }}
                                    >x</Button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <Button
                className={styles.add}
                onClick={() => {
                    onChange && onChange([
                        ...dataSource,
                        {
                            key: '',
                            value: '',
                            description: '',
                        }
                    ])
                }}
            >+</Button>
        </div>
    )
}

function Files({ event$, config, serviceInfo, onClickItem }) {

    const [files, setFiles] = useState([
        {
            type: 'FILE',
            name: 'README.md',
        },
        {
            type: 'FILE',
            name: 'user.api.json',
        },
        {
            type: 'FOLDER',
            name: 'user',
            children: [
                {
                    type: 'FILE',
                    name: 'user2.api.json',
                },
            ],
        },
    ])
    // tree
    const [treeData, setTreeData] = useState([])
    const [expandedKeys, setExpandedKeys] = useState([])

    async function loadData() {
        // if (!host) {
        //     return
        // }
        let res = await request.post(`${config.host}/file/list`, {
            path: serviceInfo.rootPath,
            r: true,
        })
        // console.log('res', res)
        if (res.success) {
            // setList(res.data.list)
            const files = res.data.list
                .sort((a, b) => {
                    return a.name.localeCompare(b.name)
                })
            setFiles(files)

            function handleList(list) {
                return list.map(item => {
                    const ret = {
                        title: item.name,
                        key: item.path,
                        itemData: item,
                        children: [],
                    }
                    if (item && item.children) {
                        ret.children = handleList(item.children)
                    }
                    return ret
                })
            }
            setTreeData(handleList(files))
        }
        // const res = await axios.get(`${host}/file/list`)
        // console.log('res', res.data)
    }

    event$.useSubscription(msg => {
        // console.log('dbManager/onmessage', msg)
        // console.log(val);
        if (msg.type == 'type_reload_file') {
            loadData()
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [])

    function FileList({ list, level = 0 }) {
        // const sortFiles = useMemo(() => {
        //     return files.sort((a, b) => {
        //         return a.name.localeCompare(b.name)
        //     })
        // }, [files])

        

        return (
            <div>
                <div className={styles.header}>
                    <IconButton
                        tooltip={t('refresh')}
                        // size="small"
                        className={styles.refresh}
                        onClick={() => {
                            // loadKey()
                            loadData()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                </div>
                <Tree
                    treeData={treeData}
                    expandedKeys={expandedKeys}
                    onExpand={(expandedKeys) => {
                        setExpandedKeys(expandedKeys)
                    }}
                    onSelect={(selectedKeys, info) => {
                        console.log('info', info.node.itemData)
                        onClickItem && onClickItem(info.node.itemData)
                    }}
                />
            </div>
            // <div className={classes.fileList}
            // >
            //     {list.sort((a, b) => {
            //         return a.name.localeCompare(b.name)
            //     }).map(item => {
            //         return (
            //             <div className={classes.item}
                            
            //             >
            //                 <div className={classes.nameBox}
            //                     style={{
            //                         paddingLeft: level * 20 + 16,
            //                     }}
            //                     onClick={() => {
            //                         onClickItem && onClickItem(item)
            //                     }}
            //                 >
            //                     <i className={`iconfont icon-${item.type == 'DIRECTORY' ? 'folder' : 'file'} ${classes.icon}`}></i>
            //                     <div className={classes.name}>{item.name}</div>
            //                 </div>
            //                 {item.children && item.children.length &&
            //                     <div className={classes.folder}
            //                     >
            //                         <FileList list={item.children} level={level + 1} />
            //                     </div>
            //                 }
            //             </div>
            //         )
            //     })}
            // </div>
        )
    }

    return (
        <div>
            <FileList
                list={files}
                event$={event$}
            />
        </div>
    )
}

async function axiosRequest(params) {
    try {
        const res = await axios.request(params)
        return res
    }
    catch (err) {
        if (err.response) {
            return err.response
        }
        // TODO
        throw new Error('未知错误')
    }
}

function SingleEditor({ host, serviceInfo, api, onChange, onSave, onRemove }) {
    
    const [method, _setMethod] = useState(api.method || MethodKey.Get);
    function setMethod(method) {
        _setMethod(method)
        onChange && onChange({
            api: {
                ...api,
                method,
            }
        })
    }
    // useEffect(() => {
    //     if (api.method == 'GET') {
    //         setReqTab('params')
    //     }
    //     else {
    //         setReqTab('body')
    //     }
    // }, [api])
    function setName(name) {
        onChange && onChange({
            api: {
                ...api,
                name,
            }
        })
    }

    const [url, _setUrl] = useState(api.url || '');
    function setUrl(url) {
        _setUrl(url)
        onChange && onChange({
            api: {
                ...api,
                url,
            }
        })
    }
    const [body, _setBody] = useState(api.body ? api.body : '')
    function setBody(body) {
        _setBody(body)
        onChange && onChange({
            api: {
                ...api,
                body,
            }
        })
    }
    const [reqTab, setReqTab] = useState(api.method == 'GET' ? 'params' : 'body')
    const [resTab, setResTab] = useState('body')
    // const [ method, setMethod ] = useState('get')
    // const [ url, setUrl ] = useState('https://nodeapi.yunser.com/version')
    // const [ body, setBody ] = useState('')
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [params, _setParams] = useState(api.params || [
        // {
        //     key: 'a',
        //     value: 'aa',
        //     description: 'AA',
        // },
        // {
        //     key: 'b',
        //     value: 'bb',
        //     description: 'BB',
        // },
    ])
    function setParams(params) {
        _setParams(params)
        onChange && onChange({
            api: {
                ...api,
                params,
            }
        })
    }
    const [headers, _setHeaders] = useState(api.headers || [
        // {
        //     key: 'Content-Type',
        //     value: 'application/json',
        //     description: '',
        // },
        // {
        //     key: 'b',
        //     value: 'bb',
        //     description: 'BB',
        // },
    ])
    function setHeaders(headers) {
        _setHeaders(headers)
        onChange && onChange({
            api: {
                ...api,
                headers,
            }
        })
    }
    function keyValueList2Obj(params) {
        const qureies = {}
        for (let item of params) {
            qureies[item.key] = item.value
        }
        return qureies
    }

    function keyValueObj2List(obj) {
        const arr = []
        for (let key in obj) {
            arr.push({
                key,
                value: obj[key]
            })
        }
        return arr
    }

    async function doRequest() {
        if (!url) {
            message.error(t('pls_input_url'))
            return
        }
        setLoading(true);
        let _headers = {};
        if (method === MethodKey.Post) {
            _headers = {
                'Content-Type': 'application/json',
            };
        }

        const startTime = new Date()
        let _url = url
        if (params.length) {
            const qureies = keyValueList2Obj(params)
            // for (let item of params) {
            //     qureies[item.key] = item.value
            // }
            _url += `?${qs.stringify(qureies)}`
        }
        _headers = keyValueList2Obj(headers)
        console.log('_headers', _headers)
        const res = await axiosRequest({
            url: _url,
            method: method,
            headers: _headers,
            // method,
            // url,
            // body,
            // headers,
        })

        // fetch(apiDomain + '/http/agent', {
        //     method: 'POST',
        //     body: JSON.stringify({
        //         method,
        //         url,
        //         body
        //     }),
        //     headers: {
        // 　　　　'Content-Type': 'application/json'
        // 　　},
        // })
        //     .then(response => {
        //         console.log('response', response)
        //         // return response.json()
        //         return response.text()
        //     })
        //     .then(text => {
        //         console.log('text', text)
        //     })
        // if (typeof data.data === 'string') {
        //     setResult(data.data)
        // } else {
        // }
        // apiDomain
        // if (typeof res.data == )
        console.log('res', res)
        setResponse({
            status: res.status,
            text: res.request.responseText,
            time: new Date().getTime() - startTime.getTime(),
            headers: keyValueObj2List(res.headers)
        });
        // console.log('data.data', `=${data.data}=`)
        setLoading(false);
    }

    async function save() {
        onSave && onSave()
    }

    async function remove() {
        onRemove && onRemove()
    }

    console.log('SingleEditor.api', api)

    return (
        <div className={styles.singleEditor}>
            {/* <h1>HTTP</h1> */}
            {!!serviceInfo &&
                <div className={styles.nameBox}>
                    {/* 名称： */}
                    {/* {api.name} */}
                    <Input
                        className={styles.name}
                        value={api.name}
                        onChange={e => {
                            setName(e.target.value)
                        }}
                    />
                </div>
            }
            {/* <Space>
            </Space> */}
            <div className={styles.headerBox}>
                <Select
                    value={method}
                    options={[
                        {
                            label: 'GET',
                            value: 'get',
                        },
                        {
                            label: 'POST',
                            value: 'post',
                        },
                        {
                            label: 'PUT',
                            value: 'put',
                        },
                        {
                            label: 'DELETE',
                            value: 'delete',
                        },
                        {
                            label: 'OPTIONS',
                            value: 'options',
                        },
                    ]}
                    onChange={(value) => {
                        setMethod(value)
                        // if ()
                    }}
                    style={{ width: 120 }}
                />
                <Input
                    // width={800}
                    value={url}
                    placeholder="URL"
                    onChange={(e) => {
                        setUrl(e.target.value);
                    }}
                    style={{ width: 560 }}
                />
                <Button
                    className={styles.send}
                    type="primary"
                    onClick={doRequest}>{t('send')}</Button>
                {!!serviceInfo &&
                    <Button
                        className={styles.send}
                        onClick={save}>保存</Button>
                }
                {!!host &&
                    <Button
                        className={styles.send}
                        danger
                        onClick={remove}>删除</Button>
                }
            </div>
            <div className={styles.requestBox}>
                {/* <div>Params</div> */}
                <Tabs
                    activeKey={reqTab}
                    onChange={key => {
                        setReqTab(key)
                    }}
                >
                    <TabPane tab="Params" key="params" />
                    <TabPane tab="Headers" key="headers" />
                    <TabPane tab="Body" key="body" />
                </Tabs>
                {reqTab == 'params' &&
                    <div>
                        <MyTable
                            dataSource={params}
                            columns={[
                                {
                                    title: 'Key',
                                    dataIndex: 'key',
                                },
                                {
                                    title: 'Value',
                                    dataIndex: 'value',
                                },
                                {
                                    title: t('description'),
                                    dataIndex: 'description',
                                },
                            ]}
                            onChange={data => {
                                setParams(data)
                            }}
                        />
                    </div>
                }
                {reqTab == 'headers' &&
                    <div>
                        <MyTable
                            dataSource={headers}
                            columns={[
                                {
                                    title: 'Key',
                                    dataIndex: 'key',
                                },
                                {
                                    title: 'Value',
                                    dataIndex: 'value',
                                },
                                // {
                                //     title: 'Description',
                                //     dataIndex: 'description',
                                // },
                            ]}
                            onChange={data => {
                                setHeaders(data)
                            }}
                        />
                    </div>
                }
                {reqTab == 'body' &&
                    <div>
                        {/* {(method === MethodKey.Post || method === MethodKey.Put) && (
                        )} */}
                        <div>
                            <div className={styles.typeBox}>请求内容（application/json）：</div>
                            <Input.TextArea
                                value={body}
                                rows={8}
                                onChange={(e) => {
                                    setBody(e.target.value);
                                }}
                            />
                        </div>
                    </div>
                }
            </div>
            <div className={styles.responseBox}>
                {!!response ?
                    <div>
                        {loading ? (
                            <div>请求中</div>
                        ) : (
                            <div>
                                <div className={styles.header}>
                                    <Tabs
                                        activeKey={resTab}
                                        onChange={key => {
                                            setResTab(key)
                                        }}
                                    >
                                        <TabPane tab="Body" key="body" />
                                        <TabPane tab="Headers" key="headers" />
                                    </Tabs>
                                    <Space>
                                        <div>
                                            Status: 
                                            <span
                                                style={{
                                                    color: response.status == 200 ? 'green' : 'red',
                                                }}
                                            >{response.status}</span>
                                            
                                            
                                        </div>
                                        <div>Time: {response.time}ms</div>
                                    </Space>
                                </div>
                                {/* <div>Size: ?ms</div> */}
                                {resTab == 'body' &&
                                    <Input.TextArea value={response.text} rows={16} />
                                }
                                {resTab == 'headers' &&
                                    <div>
                                        <Table
                                            dataSource={response.headers}
                                            columns={[
                                                {
                                                    title: 'Key',
                                                    dataIndex: 'key',
                                                },
                                                {
                                                    title: 'Value',
                                                    dataIndex: 'value',
                                                },
                                            ]}
                                            pagination={false}
                                        />
                                    </div>
                                }
                            </div>
                        )}
                        
                    </div>
                :
                    <div className={styles.empty}>
                        <Empty description={t('no_request')}></Empty>
                        {/* Empty */}
                    </div>
                }
            </div>
        </div>
    );
}

function getNewItem() {
    return {
        type: 'API',
        id: '' + new Date().getTime(),
        title: t('new_api'),
        api: {
            method: 'GET',
            url: '',
        },
    }
}


function ServiceStatus() {

    const [status, setStatus] = useState('--')

    return (
        <div>{status}</div>
    )
}

export function HttpEditor({ config, host }) {
    const { t, i18n } = useTranslation();
    const lang = useMemo(() => {
        if (i18n.language.includes('zh')) {
            return 'zh'
        }
        else {
            return 'en'
        }
    }, [i18n.language])
    const [tab, setTab] = useState('2')
    const [tabs, setTabs] = useState([
        getNewItem(),
        // {
        //     type: 'API',
        //     id: '2',
        //     title: '新建接口',
        //     api: {
        //         method: 'GET',
        //         url: 'https://nodeapi.yunser.com/about',
        //     },
        // },
        // {
        //     type: 'API',
        //     id: '3',
        //     title: '新建接口2',
        //     api: {
        //         method: 'POST',
        //         url: 'https://nodeapi.yunser.com/testPost',
        //     },
        // },
        // {
        //     type: 'PROJECT',
        //     id: '1',
        //     title: '项目概览',
        // },
        
    ])
    const [curTabIdx, setCurTabIdx] = useState(0)
    const [serviceInfo, setServiceInfo] = useState(null)
    const activeTab = tabs[curTabIdx]

    const event$ = useEventEmitter()
    
    const onEdit = (targetKey: string, action: 'add' | 'remove') => {
        console.log('onEdit', targetKey, action)
        console.log('onEdit.tabs', tabs)
        
        if (action === 'add') {
            // add();
            setTabs([
                ...tabs,
                getNewItem(),
            ])
            setCurTabIdx(tabs.length)
        } else {
            const newTabs = tabs.filter((item, idx) => (idx + '') != targetKey)
            if (newTabs.length == 0) {
                newTabs.push(getNewItem())
            }
            setTabs(newTabs)
            // remove(targetKey);
            // TODO setCurTabIdx(parseInt(key))
            setCurTabIdx(0)
        }
    };

    async function loadInfo() {
        let res = await request.post(`${config.host}/api/info`, {
        })
        console.log('info', res.data)
        if (res.success) {
            setServiceInfo(res.data)
        }
    }

    useEffect(() => {
        loadInfo()
    }, [])

    console.log('Editor.render')
    console.log('Editor.tabs', tabs.length)
    return (
        <div className={styles.editor}>
            {false &&
                <div className={styles.editorTop}>
                    <div>{!!host ? '在线模式（数据保存在服务器）' : t('local_mode')}</div>
                    {/* <ServiceStatus /> */}
                    <Space>
                        <div className={styles.lang}
                            onClick={() => {
                                i18n.changeLanguage(lang == 'zh' ? 'en' : 'zh')
                            }}
                        >{lang == 'zh' ? 'English' : '中文'}</div>
                        {!!host &&
                            <div>
                                {!!serviceInfo ?
                                    <div style={{ color: 'green' }}>
                                        服务正常
                                        {/* {serviceInfo.rootPath} */}
                                    </div>
                                :
                                    <div style={{ color: 'red' }}>服务异常</div>
                                }
                            </div>
                        }
                    </Space>
                </div>
            }
            <div className={styles.editorContent}>
                {/* !!host &&  */}
                {!!serviceInfo &&
                    <div className={styles.editorLeft}>
                        <Files
                            config={config}
                            host={host}
                            event$={event$}
                            serviceInfo={serviceInfo}
                            onClickItem={async item => {
                                console.log('item', item)
                                if (item.type == 'FILE') {
                                    const fTabIdx = tabs.findIndex(_item => _item.path == item.path)
                                    if (fTabIdx != -1) {
                                        setCurTabIdx(fTabIdx)
                                    }
                                    else {
                                        let res = await request.post(`${config.host}/file/read`, {
                                            path: item.path,
                                        })
                                        // console.log('res', res)
                                        if (res.success) {
                                            const content = res.data.content
                                            // console.log('res', )
                
                                            // setFiles(res.data)
                                            let newItem
                                            if (item.name.match(/.json$/)) {
                                                newItem = {
                                                    type: 'API',
                                                    id: '' + new Date().getTime(),
                                                    title: item.name,
                                                    api: JSON.parse((content)),
                                                    path: item.path,
                                                }
                                            }
                                            else {
                                                newItem = {
                                                    type: 'TEXT',
                                                    id: '' + new Date().getTime(),
                                                    title: item.name,
                                                    content,
                                                    path: item.path,
                                                }
                                            }
                                            setTabs([
                                                ...tabs,
                                                newItem
                                            ])
                                            setCurTabIdx(tabs.length)
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                }
                <div className={styles.editorRight}>
                    <div className={styles.editorTabs}>
                        <Tabs
                            
                            type="editable-card"
                            // activeKey={tab}
                            activeKey={'' + curTabIdx}
                            onEdit={onEdit}
                            onChange={key => {
                                // setTab(key)
                                setCurTabIdx(parseInt(key))
                            }}
                        >
                            {tabs.map((item, idx) => {
                                return (
                                    <TabPane tab={item.title} 
                                        key={'' + idx}
                                    />
                                )
                            })}
                            {/* <TabPane tab="Headers" key="headers" />
                            <TabPane tab="Body" key="body" /> */}
                        </Tabs>
                    </div>
                    {/* 1212 */}
                    {activeTab.type == 'PROJECT' &&
                        <div>项目</div>
                    }
                    {activeTab.type == 'API' &&
                        // <div></div>
                        <SingleEditor
                            host={host}
                            serviceInfo={serviceInfo}
                            api={activeTab.api}
                            key={activeTab.id}
                            onChange={({ api }) => {
                                tabs[curTabIdx].api = api
                                setTabs([...tabs])
                            }}
                            onSave={async () => {
                                console.log('保存', activeTab)
                                // const 
                                if (!activeTab.api.name) {
                                    message.error('名称不能为空')
                                    return
                                }
                                if (!activeTab.api.url) {
                                    message.error('URL 不能为空')
                                    return
                                }
                                let _path
                                if (activeTab.path) {
                                    _path = activeTab.path
                                }
                                else {
                                    _path = `${serviceInfo.rootPath}/${activeTab.api.name}.api.json`
                                }
                                let res = await request.post(`${config.host}/file/write`, {
                                    path: _path,
                                    content: JSON.stringify(activeTab.api, null, 4)
                                })
                                if (res.success) {
                                    event$.emit({
                                        type: 'type_reload_file',
                                        data: {
                                            // theme: getTheme(),
                                        }
                                    })
                                }
                            }}
                            onRemove={async () => {
                                // if (activeTab.path) {}
                                Modal.confirm({
                                    // icon: <ExclamationCircleOutlined />,
                                    content: '确认删除？',
                                    async onOk() {
                                        console.log('OK');
                                        await axios.post(`${host}/api/remove`, {
                                            path: activeTab.path,
                                            // content: JSON.stringify(activeTab.api, null, 4)
                                        })
                                    },
                                    onCancel() {
                                        console.log('Cancel');
                                    },
                                });
                            }}
                        />
                    }
                    {activeTab.type == 'TEXT' &&
                        <div className={styles.contentBox}>
                            <pre>{activeTab.content}</pre>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}