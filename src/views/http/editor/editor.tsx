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
    Radio,
    Spin,
    Tag,
    Checkbox,
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
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEventEmitter } from 'ahooks';
import { getGlobalConfig } from '@/config';
import { FullCenterBox } from '@/views/common/full-center-box';
import classNames from 'classnames';
import { uid } from 'uid';
import filesize from 'file-size';

const boundary = `********${uid(16)}********`

// const Confirm = 
const { TabPane } = Tabs;

const MethodKey = {
    Get: 'GET',
    Post: 'POST',
    Put: 'PUT',
    Delete: 'DELETE',
};

function ResponseBody({ response }) {
    const [type, setType] = useState('pretty')

    let contentType = ''
    const fItem = response.headers.find(item => item.key.toLowerCase() == 'content-type')
    if (fItem) {
        contentType = fItem.value
    }
    
    console.log('response?', response)
    const prettyText = useMemo(() => {
        let text = response.text
        console.log('response.text', response.text)
        try {
            text = JSON.stringify(JSON.parse(response.text), null, 4)
        }
        catch (err) {
            // console.log('err', err)
            // nothing
        }
        return text
    }, [response.text])

    if (contentType.startsWith('image')) {
        return (
            <div className={styles.responseImgBox}>
                <img className={styles.img} src={response.__url} />
            </div>
        )
    }

    return (
        <div className={styles.responseBodyBox}>
            <div className={styles.type}>
                <Radio.Group
                    value={type}
                    onChange={e => {
                        setType(e.target.value)
                    }}
                    size="small"
                >
                    <Radio.Button value="pretty">{t('http.pretty')}</Radio.Button>
                    <Radio.Button value="raw">{t('http.raw')}</Radio.Button>
                </Radio.Group>
            </div>
            <div className={styles.viewer}>
                {type == 'pretty' &&
                    <Input.TextArea 
                        className={styles.textarea}
                        value={prettyText}
                    />
                }
                {type == 'raw' &&
                    <Input.TextArea 
                        className={styles.textarea}
                        value={response.text}
                    />
                }
            </div>
        </div>
    )
}

function MyTable({ dataSource = [], columns = [], onChange }) {
    console.log('MyTable.render', dataSource)
    return (
        <div>

            <table className={styles.table}>
                <thead>
                    <tr className={styles.header}>
                        <th style={{ width: 32 }}></th>
                        <th style={{ width: 240 }}>{t('key')}</th>
                        <th style={{ width: 240 }}>{t('value')}</th>
                        <th style={{ width: 320 }}>{t('description')}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody className={styles.body}>
                    {dataSource.map((item, idx) => {
                        return (
                            <tr className={styles.row}>
                                <td>
                                    <div className={classNames(styles.cell, styles.checkCell)}>
                                        <Checkbox
                                            checked={item.enable}
                                            onChange={e => {
                                                dataSource[idx].enable = e.target.checked
                                                onChange && onChange([
                                                    ...dataSource,
                                                ])

                                            }}
                                        />
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.cell}>
                                        <input
                                            className={styles.input}
                                            value={item.key}
                                            onChange={e => {
                                                dataSource[idx].key = e.target.value
                                                onChange && onChange([
                                                    ...dataSource,
                                                ])
                                            }}
                                        />
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.cell}>
                                        <input
                                            className={styles.input}
                                            value={item.value}
                                            onChange={e => {
                                                dataSource[idx].value = e.target.value
                                                onChange && onChange([
                                                    ...dataSource,
                                                ])
                                            }}
                                        />
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.cell}>
                                        <input
                                            className={styles.input}
                                            value={item.description}
                                            onChange={e => {
                                                dataSource[idx].description = e.target.value
                                                onChange && onChange([
                                                    ...dataSource,
                                                ])
                                            }}
                                        />
                                    </div>
                                    {/* {item.description} */}
                                </td>
                                <td>
                                    <div className={styles.cell}>
                                        <div className={styles.removeBtn}>
                                            <IconButton
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
                                            >
                                                <DeleteOutlined />
                                            </IconButton>
                                        </div>
                                        {/* <Button
                                        >x</Button> */}
                                    </div>
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
                            enable: true,
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
    
    const config = getGlobalConfig()
    const [httpVersion, setHttpVersion] = useState('1.1')
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
    const [bodyType, setBodyType] = useState('none')
    // const [bodyType, setBodyType] = useState('form-data')
    const [reqTab, setReqTab] = useState(api.method == 'GET' ? 'params' : 'body')
    const [resTab, setResTab] = useState('body')
    // const [ method, setMethod ] = useState('get')
    // const [ url, setUrl ] = useState('https://nodeapi.yunser.com/version')
    // const [ body, setBody ] = useState('')
    const [responseError, setResponseError] = useState('')
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
        {
            enable: true,
            key: 'User-Agent',
            value: 'DMS/1.0',
            description: '',
        },
        {
            enable: true,
            key: 'Accept',
            value: '*/*',
            description: '',
        },
        {
            enable: true,
            key: 'Connection',
            value: 'close',
            description: '',
        },
        {
            enable: true,
            key: 'Accept-Encoding',
            value: 'gzip, deflate, br',
            description: '',
        },
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
    const [urlencodeds, _setUrlencodeds] = useState([
        // {
        //     enable: true,
        //     key: 'a',
        //     value: 'aa',
        //     description: '',
        // },
        // {
        //     enable: true,
        //     key: 'b',
        //     value: 'bb',
        //     description: '',
        // },
    ])
    const [formDatas, _setFormDatas] = useState([
        // {
        //     enable: true,
        //     key: 'a',
        //     value: 'aa',
        //     description: '',
        // },
        // {
        //     enable: true,
        //     key: 'b',
        //     value: 'bb',
        //     description: '',
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
            if (item.key) {
                qureies[item.key] = item.value
            }
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
        
        // let _headers = {}
        // console.log('method', method)
        // if (method === MethodKey.Post) {
        //     _headers = {
        //         'Content-Type': 'application/json',
        //     };
        // }

        const startTime = new Date()
        let _url = url
        if (!_url.startsWith('http://') && !_url.startsWith('https://')) {
            _url = 'http://' + _url
        }
        if (params.length) {
            const qureies = keyValueList2Obj(params)
            // for (let item of params) {
            //     qureies[item.key] = item.value
            // }
            // _url += `?${qs.stringify(qureies)}`
        }
        // console.log('_headers', _headers)
        const headerObj = keyValueList2Obj(headers.filter(item => item.enable))
        // const res = await axiosRequest({
        //     url: _url,
        //     method: method,
        //     headers: _headers,
        //     // method,
        //     // url,
        //     // body,
        //     // headers,
        // })
        setResponse({
            statusText: '',
            status: '',
            text: '',
            time: '',
            headers: [],
            requestRaw: '',
            responseRaw: '',
        })
        setResponseError('')
        let _body
        if (bodyType == 'none') {
            _body = ''
        }
        else if (bodyType == 'x-www-form-urlencoded') {
            // const params = new URLSearchParams()
            // urlencodeds.forEach(item => {
            //     params.append(item.key, item.value)
            // })
            // _body = params.toString()
            _body = urlencodeds.map(item => {
                return `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`
            }).join('&')
        }
        else if (bodyType == 'form-data') {
            _body = `--${boundary}\n` + formDatas.map(item => {
                return `Content-Disposition: form-data; name="${item.key}"

${item.value}
`
            }).join(`--${boundary}\n`) + `--${boundary}--`
        }
        else {
            _body = body
        }
        setLoading(true)
        let res = await request.post(`${config.host}/http/client/request`, {
            method: method,
            url: _url,
            httpVersion,
            headers: headerObj,
            body: _body,
        }, {
            noMessage: true
        })
        console.log('info', res.data)
        console.log('res', res)
        setLoading(false)
        if (res.success) {
            // setServiceInfo(res.data)
            const data = res.data
            setResponse({
                __url: _url,
                status: data.status,
                statusText: data.statusText,
                requestRaw: data.requestRaw,
                responseRaw: data.responseRaw,
                text: data.data,
                time: new Date().getTime() - startTime.getTime(),
                headers: data.headers,
                // headers: keyValueObj2List(data.headers)
                //     .sort((h1, h2) => {
                //         return h1.key.localeCompare(h2.key)
                //     })
            });
        }
        else {
            setResponseError(res.data?.message || 'unknown error')
        }

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
        
        // console.log('data.data', `=${data.data}=`)
        
    }

    async function save() {
        onSave && onSave()
    }

    async function remove() {
        onRemove && onRemove()
    }

    // console.log('SingleEditor.api', api)

    // useEffect(() => {
    //     const handleKeyDown = e => {
    //         // console.log('e', e.code, e)
    //         if (e.code == 'Enter') {
    //             doRequest()
    //         }
    //     }
    //     window.addEventListener('keydown', handleKeyDown)
    //     return () => {
    //         window.removeEventListener('keydown', handleKeyDown)
    //     }
    // }, [])

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
                <div className={styles.searchBox}>
                    <Select
                        value={method}
                        options={[
                            {
                                label: 'GET',
                                value: 'GET',
                            },
                            {
                                label: 'POST',
                                value: 'POST',
                            },
                            {
                                label: 'PUT',
                                value: 'PUT',
                            },
                            {
                                label: 'DELETE',
                                value: 'DELETE',
                            },
                            {
                                label: 'OPTIONS',
                                value: 'OPTIONS',
                            },
                            {
                                label: 'HEAD',
                                value: 'HEAD',
                            },
                            {
                                label: 'CONNECT',
                                value: 'CONNECT',
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
                            const url = e.target.value
                            console.log('url-change', url)
                            setUrl(url)
                            let urlObj = new URL(url)
                            if (urlObj.search.length > 1) {
                                const sp = new URLSearchParams(urlObj.search)
                                // for (let header of headers) {
                                //     if (header.key) {
                                //         sp.set(header.key, header.value)
                                //     }
                                // }
                                const keyMap: any = {}
                                const newParams: any = []
                                for (var pair of sp.entries()) {
                                    const [key, value] = pair
                                    // console.log('keyvalue', key, value)
                                    if (key) {
                                        keyMap[key] = value
                                        newParams.push({
                                            enable: true,
                                            key,
                                            value,
                                            description: '',
                                        })
                                    }
                                }
                                // console.log('keyMap', keyMap)
                                // const newParams = [...params]
                                // for (let header of newParams) {
                                //     console.log('compare', header, keyMap[header.key])
                                //     if (keyMap[header.key] && keyMap[header.key] != header.value) {
                                //         header.value = keyMap[header.key]
                                //         console.log('change', header.key)
                                //     }
                                // }
                                setParams(newParams)
                            }
                            else {
                                setParams([])
                            }
                        }}
                        style={{ width: 560 }}
                        onKeyDown={(e) => {
                            console.log('e', e.code)
                            if (e.code == 'Enter') {
                                doRequest()
                            }
                        }}
                    />
                </div>
                <Select
                    className={styles.protocol}
                    value={httpVersion}
                    onChange={value => {
                        setHttpVersion(value)
                    }}
                    options={[
                        {
                            label: 'HTTP/1.1',
                            value: '1.1',
                        },
                        {
                            label: 'HTTP/1.0',
                            value: '1.0',
                        },
                    ]}
                />
                <Button
                    className={styles.send}
                    type="primary"
                    loading={loading}
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
                    <TabPane tab={t('http.query')} key="params" />
                    <TabPane tab={t('http.headers')} key="headers" />
                    <TabPane tab={t('http.body')} key="body" />
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
                            onChange={newParams => {
                                // console.log('newParams', newParams)
                                setParams(newParams)
                                const urlObj = new URL(url)
                                // console.log('urlObj', urlObj)
                                // setUrl
                                let _newParams = newParams.filter(item => item.key && item.enable)
                                // console.log('_newParams', _newParams)
                                let _search = ''
                                const sp = new URLSearchParams()
                                if (_newParams.length) {
                                    for (let header of _newParams) {
                                        sp.set(header.key, header.value)
                                        // if (header.key) {
                                        // }
                                    }
                                    _search = '?' + sp.toString()
                                }
                                // console.log('_search', _search)
                                const newUrl = `${urlObj.origin}${urlObj.pathname}${_search}${urlObj.hash}`
                                // console.log('newUrl', newUrl)
                                setUrl(newUrl)
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
                            {/* <div className={styles.typeBox}>请求内容（application/json）：</div> */}
                            <div className={styles.typeBox}>
                                <Radio.Group
                                    onChange={e => {
                                        const { value } = e.target
                                        setBodyType(value)

                                        function setContentType(contentType) {
                                            const fContentTypeIdx = headers.findIndex(item => item.key.toLowerCase() == 'content-type')
                                            console.log('fContentTypeIdx', fContentTypeIdx)
                                            if (fContentTypeIdx == -1) {
                                                setHeaders([
                                                    ...headers,
                                                    {
                                                        enable: true,
                                                        key: 'Content-Type',
                                                        value: contentType,
                                                        description: '',
                                                    }
                                                ])
                                            }
                                            else {
                                                const newHeaders = [
                                                    ...headers,
                                                ]
                                                newHeaders[fContentTypeIdx].value = contentType
                                                setHeaders(newHeaders)
                                            }
                                        }

                                        if (value == 'json') {
                                            setContentType('application/json')
                                        }
                                        else if (value == 'x-www-form-urlencoded') {
                                            setContentType('application/x-www-form-urlencoded')
                                        }
                                        else if (value == 'form-data') {
                                            setContentType(`multipart/form-data; boundary=${boundary}`)
                                        }
                                        else if (value == 'raw') {
                                            setContentType('text/plain')
                                        }
                                        else if (value == 'none') {
                                            const fContentType = headers.find(item => item.key.toLowerCase() == 'content-type')
                                            console.log('fContentType', fContentType)
                                            if (fContentType) {
                                                setHeaders(headers.filter(item => item.key.toLowerCase() != 'content-type'))
                                            }
                                        }
                                    }}
                                    value={bodyType}
                                >
                                    <Radio value="none">{t('http.none')}</Radio>
                                    <Radio value="json">{t('json')}</Radio>
                                    <Radio value="raw">{t('http.raw')}</Radio>
                                    <Radio value="x-www-form-urlencoded">x-www-form-urlencoded</Radio>
                                    <Radio value="form-data">form-data</Radio>
                                </Radio.Group>
                            </div>
                            {bodyType == 'none' ?
                                <FullCenterBox height={200}>
                                    <Empty description="this request dose not hava a body" />
                                </FullCenterBox>
                            : bodyType == 'x-www-form-urlencoded' ?
                                <div>
                                    <MyTable
                                        dataSource={urlencodeds}
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
                                        onChange={value => {
                                            _setUrlencodeds(value)
                                        }}
                                    />
                                </div>
                            : bodyType == 'form-data' ?
                                <div>
                                    <MyTable
                                        dataSource={formDatas}
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
                                        onChange={value => {
                                            _setFormDatas(value)
                                        }}
                                    />
                                </div>
                            :
                                <Input.TextArea
                                    value={body}
                                    rows={8}
                                    onChange={(e) => {
                                        setBody(e.target.value);
                                    }}
                                />
                            }
                        </div>
                    </div>
                }
            </div>
            <div className={styles.responseBox}>
                {!!responseError ?
                    <FullCenterBox>
                        <div className={styles.errorBox}>
                            <div>{responseError}</div>
                        </div>
                    </FullCenterBox>
                : !!response ?
                    <div className={styles.content}>
                        {loading ? (
                            <FullCenterBox height={320}>
                                <Spin />
                            </FullCenterBox>
                        ) : (
                            <>
                                <div className={styles.contentHeader}>
                                    <Tabs
                                        activeKey={resTab}
                                        onChange={key => {
                                            setResTab(key)
                                        }}
                                    >
                                        <TabPane tab={t('http.body')} key="body" />
                                        <TabPane tab={t('http.headers')} key="headers" />
                                        {/* <TabPane tab={t('http.cookies')} key="cookies" /> */}
                                        <TabPane tab={t('http.request.raw')} key="raw-request" />
                                        <TabPane tab={t('http.response.raw')} key="raw-response" />
                                    </Tabs>
                                    <Space>
                                        <div>
                                            {t('status')}:{' '}
                                            <span
                                                style={{
                                                    color: `${response.status}`.startsWith('2') ? 'green' : 'red',
                                                }}
                                            >{response.status} {response.statusText}</span>
                                            
                                            
                                        </div>
                                        <div>{t('time')}: {response.time}ms</div>
                                        <div>{t('size')}: {filesize(response.responseRaw.length, { fixed: 1, }).human()}</div>
                                    </Space>
                                </div>
                                {/* <div>Size: ?ms</div> */}
                                <div className={styles.contentBody}>
                                    {resTab == 'body' &&
                                        <ResponseBody
                                            // request={{url}}
                                            response={response}
                                        />
                                    }
                                    {resTab == 'headers' &&
                                        <div className={styles.contentBodyHeader}>
                                            <Table
                                                size="small"
                                                bordered
                                                dataSource={response.headers}
                                                columns={[
                                                    {
                                                        title: 'Key',
                                                        dataIndex: 'key',
                                                        width: 240,
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
                                    {resTab == 'raw-response' &&
                                        <div className={styles.rawBox}>
                                            <Input.TextArea
                                                className={styles.code}
                                                value={response.responseRaw}
                                            />
                                        </div>
                                    }
                                    {resTab == 'raw-request' &&
                                        <div className={styles.rawBox}>
                                            <Input.TextArea
                                                className={styles.code}
                                                value={response.requestRaw}
                                            />
                                        </div>
                                    }
                                    {resTab == 'cookies' &&
                                        <div className={styles.rawBox}>
                                            999
                                        </div>
                                    }
                                </div>
                            </>
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

export function HttpClient({ host }) {
    const config = getGlobalConfig()
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
            // setServiceInfo(res.data)
        }
    }

    useEffect(() => {
        loadInfo()
    }, [])

    console.log('Editor.render')
    console.log('Editor.tabs', tabs.length)

    const editable = false

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
                {!!serviceInfo && false &&
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