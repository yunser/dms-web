import { Button, Col, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './swagger-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CloseCircleOutlined, CloseOutlined, CopyOutlined, DownloadOutlined, EllipsisOutlined, HomeOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
// import { saveAs } from 'file-saver'

import { OpenAPIObject, PathItemObject } from 'openapi3-ts'
import { marked } from 'marked';
import { CopyButton } from '@/views/db-manager/copy-button';

function getMock(schema, api) {
    if (schema.type == 'string') {
        return 'string'
    }
    if (schema.type == 'array') {
        // console.log('array', schema)
        // for (let attr of schema) {

        // }
        return [getMock(schema.items, api)]
    }
    if (schema.type == 'integer') {
        return 1
    }
    if (schema.type == 'boolean') {
        return true
    }
    if (schema.type == 'number') {
        return 1.1
    }
    if (schema.type == 'object') {
        if (schema.properties || schema.additionalProperties) {
            const props = schema.properties || []
            const attrs = Object.keys(props)
            const obj = {}
            for (let attr of attrs) {
                obj[attr] = getMock(props[attr], api)
            }
            if (schema.additionalProperties) {
                obj['additionalProp1'] = getMock(schema.additionalProperties, api)
                obj['additionalProp2'] = getMock(schema.additionalProperties, api)
                obj['additionalProp3'] = getMock(schema.additionalProperties, api)
            }
            return obj
        }
        console.log('??？', schema)
        return {}
    }
    if (typeof schema == 'object' && schema.$ref) {
        const { $ref } = schema
        if ($ref && $ref.startsWith('#/components/schemas/')) {
            const type = $ref.replace('#/components/schemas/', '')
            const def = getModelsMap(api)[type]
            if (def) {
                return getMock(def, api)
                // return <TypeRender schema={def} />
            }
            // const obj = 
            // return <div>{type}</div>
        }
        else if ($ref && $ref.startsWith('#/definitions/')) {
            const type = $ref.replace('#/definitions/', '')
            const def = getModelsMap(api)[type]
            if (def) {
                return getMock(def, api)
                // return <TypeRender schema={def} />
            }
            // const obj = 
            // return <div>{type}</div>
        }
        return schema.$ref
    }
    if (schema.type == 'file') {
        return '--'
    }
    console.log('??', schema)
    return '?' + schema.type
}

function getType(schema, api, level = 0) {
    
    if (schema.type == 'string') {
        return 'String'
    }
    if (schema.type == 'array') {
        return (
            <div className={styles.array}>
                {'Array ['}
                <div className={styles.arrayItems}>
                    {getType(schema.items, api, level + 1)}
                </div>
                {']'}
            </div>
        )
    }
    if (schema.type == 'integer') {
        if (schema.format) {
            return `Integer(${schema.format})`
        }
        return 'Integer'
    }
    if (schema.type == 'boolean') {
        return 'Boolean'
    }
    if (schema.type == 'number') {
        return 'Number'
    }
    if (schema.type == 'file') {
        return 'File'
    }
    if (schema.type == 'object') {
        if (level > 8) {
            return 'Object {}'
        }

        if (schema.properties || schema.additionalProperties) {
            const props = schema.properties || []
            const attrs = Object.keys(props)
            return (
                <div className={classNames(styles.obj, [styles['level-' + level]])}>
                    <div className={styles.name}>
                        {!!schema.xml?.name &&
                            <span>
                                {schema.xml?.name} {' '}
                            </span>
                        }
                        {'{'}
                    </div>
                    <div className={styles.attrs}>
                        {attrs.map(attr => {
                            return (
                                <div
                                    className={styles.item}
                                    key={attr}
                                >
                                    <div className={styles.attrName}>{attr}:</div>
                                    {getType(props[attr], api, level + 1)}
                                </div>
                            )
                        })}
                        {!!schema.additionalProperties &&
                            <div
                                className={styles.item}
                                // key={attr}
                            >
                                <div className={styles.attrName}>{'< * >'}:</div>
                                {getType(schema.additionalProperties, api,  level + 1)}
                            </div>
                        }
                    </div>
                    <div>
                        {'}'}
                    </div>
                </div>
            )
        }
        console.log('??？', schema)
        return 'Object {}'
    }
    if (typeof schema == 'object' && schema.$ref) {
        const { $ref } = schema
        if ($ref && $ref.startsWith('#/components/schemas/')) {
            const type = $ref.replace('#/components/schemas/', '')
            const def = getModelsMap(api)[type]
            if (def) {
                return getType(def, api, level + 1)
                // return <TypeRender schema={def} />
            }
            // const obj = 
            // return <div>{type}</div>
        }
        else if ($ref && $ref.startsWith('#/definitions/')) {
            const type = $ref.replace('#/definitions/', '')
            const def = getModelsMap(api)[type]
            if (def) {
                return getType(def, api, level + 1)
                // return <TypeRender schema={def} />
            }
            // const obj = 
            // return <div>{type}</div>
        }
        // return <div>{item.schema.$ref}</div>
        return $ref
    }
    console.log('??', schema)
    return '?' + schema.type
}


function TypeRender({ schema, api }) {
    return <div>{getType(schema, api)}</div>
}

function MockRender({ schema, api }) {
    // if (schema.type == 'object') {
    //     const attrs = 
    // }
    // if "type": "object",
    const mock = getMock(schema, api)
    if (typeof mock == 'number' || typeof mock == 'string') {
        return <div>{mock}</div>    
    }
    const code = JSON.stringify(mock, null, 4)
    return (
        <code className={styles.code}>
            <pre style={{ marginBottom: 0 }}>{code}</pre>
            <div className={styles.copyBtn}>
                <CopyButton
                    size="small"
                    text={code}
                >
                    <IconButton title="复制">
                        <CopyOutlined />
                    </IconButton>
                </CopyButton>
            </div>
        </code>
    )
}

function getModelsMap(api: OpenAPIObject) {
    return api.components?.schemas || api.definitions || {}
}

function RequestBody({ requestBody, api }) {
    if (!requestBody.content['application/json']) {
        return '--'
    }
    const { schema } = requestBody.content['application/json']

    const columns = [
        {
            title: 'Model',
            dataIndex: 'model',
            render() {
                return (
                    <div>
                        <TypeRender schema={schema} api={api} />
                    </div>
                )
            },
        },
        {
            title: 'Example Value',
            dataIndex: 'a',
            render() {
                return (
                    <div>
                        <MockRender schema={schema} api={api} />
                    </div>
                )
            },
        },
    ]

    return (
        <div>
            <Table
                dataSource={[{}]}
                columns={columns}
                bordered
                size="small"
            />
        </div>
    )
}

function Models({ api }: { api: OpenAPIObject }) {

    const modelsMap = getModelsMap(api)

    const list = Object.keys(modelsMap).map(key => {
        return {
            ...modelsMap[key],
            name: key,
        }
    })

    return (
        <div className={styles.models}>
            {list.map(item => {
                return (
                    <div
                        key={item.name}
                        className={styles.modelItem}
                    >
                        <div className={styles.modelName}>{item.name}</div>
                        <TypeRender schema={item} api={api} />
                    </div>
                )
            })}
        </div>
    )
}

function PathItemDetail({ pathItem, api }: { 
    pathItem: PathItemObject,
    api: OpenAPIObject
 }) {

    const paramColumns = [
        {
            title: 'name',
            dataIndex: 'name',
            width: 240,
            render(value, item) {
                return (
                    <Space className={styles.copyCell}>
                        {value}
                        {!!item.required &&
                            <div className={styles.required}>*</div>
                        }
                        <div className={styles.copyBtn}>
                            <CopyButton
                                size="small"
                                text={value}
                            >
                                <IconButton title="复制">
                                    <CopyOutlined />
                                </IconButton>
                            </CopyButton>
                        </div>
                    </Space>
                )
            }
        },
        {
            title: 'Description',
            dataIndex: 'description',
            width: 400,
            // ellipsis: true
        },
        {
            title: 'Parameter Type',
            dataIndex: 'in',
            width: 240,
        },
        {
            title: 'Data Type',
            dataIndex: 'type',
            width: 240,
            render(value, item) {
                if (item.type) {
                    return <TypeRender schema={item} api={api} />
                }
                if (item.schema) {
                    return <TypeRender schema={item.schema} api={api} />
                }
                return <div>--</div>
            }
        },
        {
            title: 'Mock',
            dataIndex: 'type',
            key: 'type2',
            width: 240,
            render(value, item) {
                if (item.type) {
                    return <MockRender schema={item} api={api} />
                    // return <div>{getMock(item, api)}</div>
                }
                if (item.schema) {
                    return <MockRender schema={item.schema} api={api} />
                }
                return <div>--</div>
            }
        },
        {
            title: '',
            dataIndex: '__empty__',
        },
    ]

    const responseColumns = [
        {
            title: 'HTTP Status Code',
            dataIndex: 'httpStatus',
            width: 160,
            render(value) {
                // console.log('value', typeof value, value, value.startsWith('2'))
                let color
                if (value.startsWith('2')) {
                    color = 'green'
                }
                else if (value.startsWith('4') || value.startsWith('5')) {
                    color = 'red'
                }
                else {
                    // color = 'red'
                }
                return (
                    <div style={{ color }}>{value}</div>
                )
            }
        },
        {
            title: 'Reason',
            dataIndex: 'description',
            width: 400,
        },
        {
            title: 'Model',
            dataIndex: 'model',
            width: 400,
            render(value, item) {
                // if (item.type) {
                //     return <TypeRender schema={item} api={api} />
                // }
                let schema
                if (item['content']?.['application/json']?.schema) {
                    schema = item.content['application/json']['schema']
                }
                else {
                    schema = item.schema
                }
                if (schema) {
                    console.log('schema?', schema)
                    return <TypeRender schema={schema} api={api} />
                }
                return <div>--</div>
            }
        },
        {
            title: 'Example Value',
            dataIndex: 'model',
            key: 'example',
            width: 400,
            render(value, item) {
                // if (item.type) {
                //     return <TypeRender schema={item} api={api} />
                // }
                let schema
                if (item['content']?.['application/json']?.schema) {
                    schema = item.content['application/json']['schema']
                }
                else {
                    schema = item.schema
                }
                if (schema) {
                    return <MockRender schema={schema} api={api} />
                }
                return <div>--</div>
            }
        },
        {
            title: '',
            dataIndex: '__empty__',
        },
        
    ]

    const responses = useMemo(() => {
        if (!pathItem.responses) {
            return []
        }
        return Object.keys(pathItem.responses).map(httpStatus => {
            return {
                ...pathItem.responses[httpStatus],
                httpStatus,
            }
        })
    }, [pathItem.responses])


    return ((
        <div className={styles.detailBox}>
            <div
                className={classNames(styles.header, {
                    [styles.deprecated]: pathItem.deprecated,
                })}
            >
            
                <div className={classNames(styles.method, styles[pathItem.method])}>{pathItem.method}</div>
                <div className={styles.path}>{pathItem.path}</div>
                <div className={styles.copyBtn}>
                    <CopyButton
                        size="small"
                        text={pathItem.path}
                    >
                        <IconButton title="复制">
                            <CopyOutlined />
                        </IconButton>
                    </CopyButton>
                </div>
                <div className={styles.tags}>
                    {(pathItem.tags || []).map(tag => {
                        return (
                            <Tag>{tag}</Tag>
                        )
                    })}
                </div>
            </div>
            <div className={styles.summary}>{pathItem.summary}</div>
            <div>{pathItem.description}</div>

            {(pathItem.parameters || []).length > 0 &&
                <>
                    <div className={styles.sectionTitle}>Parameters</div>
                    <Table
                        dataSource={pathItem.parameters || []}
                        columns={paramColumns}
                        pagination={false}
                        bordered
                        size="small"
                    />
                </>
            }

            {!!pathItem.requestBody &&
                <div className={styles.requestBody}>
                    <div className={styles.sectionTitle}>
                        Request body
                        {!!pathItem.requestBody.required &&
                            <div className={styles.required}>*</div>
                        }
                    </div>
                    <div className={styles.desc}>{pathItem.requestBody.description}</div>
                    <RequestBody 
                        requestBody={pathItem.requestBody}
                        api={api}
                    />
                </div>
            }





            <div className={styles.sectionTitle}>Response Messages</div>
            {/* <div>Response Messages</div> */}
            <Table
                dataSource={responses}
                columns={responseColumns}
                pagination={false}
                bordered
                size="small"
            />
        </div>
    ))
}

export function SwaggerDetail({ config, apiUrl, project, onHome }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curIp, setCurIp] = useState('--')
    const [api, setApi] = useState<OpenAPIObject>()
    const [items, setItems] = useState([])
    const [detailItem, setDetailItem] = useState(null)
    const [detailVisible, setDetailVisible] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [curTag, setCurTag] = useState('')
    const [curTab, setCurTab] = useState('info')
    const [error, setError] = useState('')

    const filteredItems = useMemo(() => {

        let all = items
        if (curTag) {
            all = items.filter(item => item.tags && item.tags.includes(curTag))
        }
        if (!keyword) {
            return all
        }
        const kw = keyword.toLowerCase()
        return all.filter(item => {
            return item.path.includes(kw)
        })
    }, [curTag, items, keyword])


    async function loadData(_oldDetailItem) {
        setError('')
        let res
        if (apiUrl) {
            res = await request.post(`${config.host}/http/proxy`, {
                url: apiUrl,
            }, {
                noMessage: true,
            })
        }
        else {
            res = await request.post(`${config.host}/file/read`, {
                path: project.path,
            }, {
                noMessage: true,
            })
        }
        // console.log('proxy/res', res)
        if (res.success) {
            let api: OpenAPIObject
            if (res.data && res.data.content) {
                // file
                api = JSON.parse(res.data.content)
            }
            else {
                api = res.data
            }
            // console.log('api', api)
            if (!api.openapi && !api.swagger) {
                setError(`${apiUrl} is not a OpenAPI/Swagger URL`)
                return
            }
            setApi(api)
            const items = []
            for (let path in api.paths) {
                const pathItem: PathItemObject = api.paths[path]
                if (pathItem.get) {
                    items.push({
                        ...pathItem.get,
                        path,
                        method: 'GET',
                    })
                }
                if (pathItem.post) {
                    items.push({
                        ...pathItem.post,
                        path,
                        method: 'POST',
                    })
                }
                if (pathItem.put) {
                    items.push({
                        ...pathItem.put,
                        path,
                        method: 'PUT',
                    })
                }
                if (pathItem.delete) {
                    // console.log('push-del', )
                    items.push({
                        ...pathItem.delete,
                        path,
                        method: 'DELETE',
                    })
                }
            }
            setItems(items)

            // 更新详情
            if (_oldDetailItem) {
                const fItem = items.find(item => item.path == _oldDetailItem.path && item.method == _oldDetailItem.method)
                if (fItem) {
                    setDetailItem(fItem)
                }
            }
        }
        else {
            setError(res.data?.message || res.data?.msg || res.statusText || 'Unknown Error')
        }
    }

    useEffect(() => {
        loadData()
    }, [apiUrl])

    const tagList = useMemo(() => {
        if (!api) {
            return []
        }
        const list = (api.tags || []).map(item => {
            return {
                ...item,
                items: [],
            }
        })
        const defaultTagItems = []
        for (let pathItem of items) {
            const tags = pathItem.tags || []
            if (tags.length) {
                for (let tagName of tags) {
                    const tagIdx = list.findIndex(_tag => _tag.name == tagName)
                    if (tagIdx != -1) {
                        // if (!list[tagIdx].items) {
                        //     list[tagIdx].items = []
                        // }
                        list[tagIdx].items.push(pathItem)
                    }
                }
            }
            else {
                defaultTagItems.push(pathItem)
            }
        }
        let results = list.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
        if (defaultTagItems.length) {
            results.unshift({
                name: 'default',
                description: '',
                items: defaultTagItems,
            })
        }
        return results
    }, [api, items])

    const filteredTagList = useMemo(() => {
        if (!keyword) {
            return tagList
        }
        const kw = keyword.toLowerCase()
        return tagList
            .map(tag => {
                return {
                    ...tag,
                    items: tag.items.filter(pathItem => pathItem.path.toLowerCase().includes(kw))
                }
            })
            .filter(item => item.items.length > 0)
            // .filter(item => item.name.toLowerCase().includes(kw))
    }, [tagList, keyword])

    
    if (!!error) {
        return (
            <div className={styles.errorBox}>
                <div className={styles.msg}>{error}</div>
                <IconButton 
                    className={styles.close}
                    onClick={() => {
                        onHome && onHome()
                    }}
                    >
                    <HomeOutlined />
                </IconButton>
                {/* <Button
                    onClick={() => {
                        onHome && onHome()
                    }}
                >
                    Home
                </Button> */}
            </div>
        )
    }
    
    if (!api) {
        return (
            <FullCenterBox>
                <Spin />
            </FullCenterBox>
        )
    }
    // let apiInfo = null
    // let models = null
    // if (!detailVisible) {
    //     apiInfo = (
                
    //     )
    //     models = (
            
    //     )
    // }
    // console.log('tagList', tagList)
    return (
        <div className={styles.swaggerApp}>
            <div className={styles.layoutLeft}>
                <div className={styles.tool}>
                    <Input
                        placeholder={t('filter')}
                        value={keyword}
                        allowClear
                        onChange={e => {
                            setKeyword(e.target.value)
                        }}
                    />
                </div>
                
                <div className={styles.tagList}>
                    {/* <div className={styles.tagItem}
                        onClick={() => {
                            
                        }}
                    >
                        <div className={styles.tagItemHeader}>
                            <div className={styles.name}>Info</div>
                        </div>
                    </div> */}
                    {filteredTagList.map(tag => {
                        return (
                            <div className={classNames(styles.tagItem, {
                                // [styles.active]: c
                            })}
                                onClick={() => {
                                    if (curTag == tag.name) {
                                        setCurTag('')
                                    }
                                    else {
                                        setCurTag(tag.name)
                                    }
                                }}
                            >
                                <div className={styles.tagItemHeader}>
                                    <div className={styles.name}>{tag.name}</div>
                                    <div className={styles.desc}>{tag.description}</div>
                                </div>
                                <div className={styles.paths}>
                                    {tag.items.map(pathItem => {
                                        return (
                                            <div className={classNames(styles.pathItem, {
                                                [styles.active]: detailItem && detailItem.path == pathItem.path && detailItem.method == pathItem.method,
                                                [styles.deprecated]: pathItem.deprecated,
                                            })}
                                                onClick={() => {
                                                    setDetailItem(pathItem)
                                                    setDetailVisible(true)
                                                }}
                                            >
                                                <div className={classNames(styles.method, styles[pathItem.method])}
                                                    >{pathItem.method}</div>
                                                <div className={styles.path}>{pathItem.path}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {/* <view>{tag.items.length}</view> */}
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className={styles.layoutRight}>
                {false &&
                    <>
                        
                        <div>
                            
                            <div className={styles.items}>
                                {filteredItems.map(item => {
                                    return (
                                        <div className={styles.item}
                                            onClick={() => {
                                                setDetailItem(item)
                                                setDetailVisible(true)
                                            }}
                                        >
                                            <div className={styles.itemHeader}>
                                                <div className={classNames(styles.method, styles[item.method])}>{item.method}</div>
                                                <div className={styles.path}>{item.path}</div>
                                                <div className={styles.summary}>{item.summary}</div>
                                            </div>
                                            {/* <PathItemDetail 
                                                pathItem={item}
                                                api={api}
                                            /> */}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                }
                {detailVisible ?
                    <Space className={styles.close}>
                        <IconButton 
                            onClick={() => {
                                loadData(detailItem)
                            }}
                            >
                            <ReloadOutlined />
                        </IconButton>
                        <IconButton 
                            // className={styles.close}
                            onClick={() => {
                                setDetailVisible(false)
                            }}
                        >
                            <CloseOutlined />
                        </IconButton>
                    </Space>
                :
                    <Space className={styles.close}>
                        <IconButton 
                            onClick={() => {
                                loadData()
                            }}
                            >
                            <ReloadOutlined />
                        </IconButton>
                        <IconButton 
                            onClick={() => {
                                onHome && onHome()
                            }}
                            >
                            <HomeOutlined />
                        </IconButton>
                    </Space>
                }
                {detailVisible ?
                    <PathItemDetail 
                        pathItem={detailItem}
                        api={api}
                    />
                :
                    <div className={styles.tabs}>
                        <div className={styles.tabHeader}>
                            <Tabs
                                activeKey={curTab}
                                onChange={key => {
                                    setCurTab(key)
                                }}
                                type="card"
                                items={[
                                    {
                                        label: 'Info',
                                        key: 'info',
                                        // children: apiInfo,
                                    },
                                    {
                                        label: 'Models',
                                        key: 'models',
                                        // children: models,
                                    },
                                ]}
                            />
                        </div>
                        <div className={styles.tabContent}>
                            {curTab == 'info' &&
                                <div id="info" className={styles.docHome}>
                                    <div className={styles.docHeader}>
                                        <div className={styles.docTitle}>{api.info.title}</div>
                                        <Tag>v{api.info.version}</Tag>
                                    </div>
                                    <div className={styles.desc}>
                                        {/* {api.info.description} */}
                                        <div 
                                            className={styles.article} 
                                            dangerouslySetInnerHTML={{
                                                __html: marked.parse(api.info.description)
                                            }}
                                        >
                    
                                        </div>
                                    </div>
                    
                                    <Descriptions column={1}>
                                        <Descriptions.Item label="Base Path">
                                            {api.basePath}
                                        </Descriptions.Item>
                                        {!!api.info.license &&
                                            <Descriptions.Item label="License">
                                                <a href={api.info.license.url} target="_blank">{api.info.license.name}</a>
                                            </Descriptions.Item>
                                        }
                                        <Descriptions.Item label="Contact">
                                            {api.info.contact?.email}
                                        </Descriptions.Item>
                                        {!!api.info.termsOfService &&
                                            <Descriptions.Item label="Terms of service">
                                                <a href={api.info.termsOfService} target="_blank">{api.info.termsOfService}</a>
                                            </Descriptions.Item>
                                        }
                                        {!!api.schemes &&
                                            <Descriptions.Item label="Schemes">
                                                {api.schemes.join(', ')}
                                            </Descriptions.Item>
                                        }
                                        {!!api.externalDocs &&
                                            <Descriptions.Item label="External Docs">
                                                <a href={api.externalDocs.url} target="_blank">{api.externalDocs.description}</a>
                                            </Descriptions.Item>
                                        }
                                        {!!api.host &&
                                            <Descriptions.Item label="Host">
                                                <a href={api.host} target="_blank">{api.host}</a>
                                            </Descriptions.Item>
                                        }
                                        {!!api.servers &&
                                            <Descriptions.Item label="Servers">
                                                <ul className={styles.servers}>
                                                    {api.servers.map(server => {
                                                        return (
                                                            <li className={styles.item}>{server.url}</li>
                                                        )
                                                    })}
                                                </ul>
                                            </Descriptions.Item>
                                        }
                                        <Descriptions.Item label="Version">
                                            {api.openapi ? 'OpenAPI' : 'Swagger'} v{api.openapi || api.swagger}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Source">
                                            <a href={apiUrl} target="_blank">{apiUrl}</a>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </div>  
                            }
                            {curTab == 'models' &&
                                <div>
                                    <Models api={api} />
                                </div>
                            }
                        </div>

                    </div>
                    
                }
            </div>
            {/* {detailVisible &&
                <Drawer
                    open={true}
                    title={`${detailItem.method} ${detailItem.path}`}
                    width={1200}
                    onClose={() => {
                        setDetailVisible(false)
                    }}
                >
                    <PathItemDetail 
                        pathItem={detailItem}
                        api={api}
                    />
                </Drawer>
            } */}
        </div>
    )
}

