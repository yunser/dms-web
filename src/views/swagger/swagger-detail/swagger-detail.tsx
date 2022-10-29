import { Button, Col, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './swagger-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CloseCircleOutlined, CloseOutlined, DownloadOutlined, EllipsisOutlined, HomeOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
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
        return '??'
    }
    if (typeof schema == 'object' && schema.$ref) {
        const { $ref } = schema
        if ($ref && $ref.startsWith('#/definitions/')) {
            const type = $ref.replace('#/definitions/', '')
            const def = api.definitions[type]
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

function getType(schema, api) {
    if (schema.type == 'string') {
        return 'String'
    }
    if (schema.type == 'array') {
        return [getType(schema.items, api)]
    }
    if (schema.type == 'integer') {
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
        if (schema.properties || schema.additionalProperties) {
            const props = schema.properties || []
            const attrs = Object.keys(props)
            return (
                <div className={styles.obj}>
                    <div className={styles.name}>
                        {!!schema.xml?.name &&
                            <span>
                                {schema.xml?.name} 
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
                                    {getType(props[attr], api)}
                                </div>
                            )
                        })}
                        {!!schema.additionalProperties &&
                            <div
                                className={styles.item}
                                // key={attr}
                            >
                                <div className={styles.attrName}>{'< * >'}:</div>
                                {getType(schema.additionalProperties, api)}
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
        return '??'
    }
    if (typeof schema == 'object' && schema.$ref) {
        const { $ref } = schema
        if ($ref && $ref.startsWith('#/definitions/')) {
            const type = $ref.replace('#/definitions/', '')
            const def = api.definitions[type]
            if (def) {
                return getType(def, api)
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
    return <pre style={{ marginBottom: 0 }}>{JSON.stringify(mock, null, 4)}</pre>
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
                    <div>
                        {value}
                        {item.required &&
                            <div className={styles.required}>*</div>
                        }
                    </div>
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
                console.log('value', typeof value, value, value.startsWith('2'))
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
                if (item.schema) {
                    return <TypeRender schema={item.schema} api={api} />
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
            
                {/* <div>{pathItem.method}</div> */}
                <div className={classNames(styles.method, styles[pathItem.method])}>{pathItem.method}</div>
                <div className={styles.path}>{pathItem.path}</div>
                <div className={styles.tags}>
                    {(pathItem.tags || []).map(tag => {
                        return (
                            <Tag>{tag}</Tag>
                        )
                    })}
                </div>
            </div>
            <div>{pathItem.summary}</div>

            <div className={styles.sectionTitle}>Parameters</div>
            {/* <div className={styles.parameters}>
                {pathItem.parameters?.map(param => {
                    return (
                        <div className={styles.item}>
                            {param.name}
                        </div>
                    )
                })}
            </div> */}
            <Table
                dataSource={pathItem.parameters || []}
                columns={paramColumns}
                pagination={false}
                bordered
                size="small"
            />

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

export function SwaggerDetail({ config, project, onHome }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curIp, setCurIp] = useState('--')
    const [api, setApi] = useState<OpenAPIObject>()
    const [items, setItems] = useState([])
    const [detailItem, setDetailItem] = useState(null)
    const [detailVisible, setDetailVisible] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [curTag, setCurTag] = useState('')

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

    async function loadData() {
        let res = await request.post(`${config.host}/http/proxy`, {
            url: project.url
        })
        if (res.success) {
            const api: OpenAPIObject = res.data
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
        }
    }

    useEffect(() => {
        loadData()
    }, [])

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
        for (let pathItem of items) {
            for (let tagName of (pathItem.tags || [])) {
                const tagIdx = list.findIndex(_tag => _tag.name == tagName)
                if (tagIdx != -1) {
                    // if (!list[tagIdx].items) {
                    //     list[tagIdx].items = []
                    // }
                    list[tagIdx].items.push(pathItem)
                }
            }
        }
        return list.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
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

    if (!api) {
        return (
            <FullCenterBox>
                <Spin />
            </FullCenterBox>
        )
    }

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
                
                <div className={styles.tags}>
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
                    <IconButton 
                        className={styles.close}
                        onClick={() => {
                            setDetailVisible(false)
                        }}
                    >
                        <CloseOutlined />
                    </IconButton>
                :
                    <IconButton 
                        className={styles.close}
                        onClick={() => {
                            onHome && onHome()
                        }}
                        >
                        <HomeOutlined />
                    </IconButton>
                }
                {detailVisible ?
                    <PathItemDetail 
                        pathItem={detailItem}
                        api={api}
                    />
                :
                    <div id="info" className={styles.docHome}>
                        <div className={styles.docHeader}>
                            <div className={styles.docTitle}>{api.info.title}</div>
                            <Tag>v{api.info.version}</Tag>
                        </div>
                        <div className={styles.desc}>
                            {/* {api.info.description} */}
                            <div className={styles.article} dangerouslySetInnerHTML={{
                                __html: marked.parse(api.info.description)
                            }}>

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
                            <Descriptions.Item label="Swagger version">
                                v{api.swagger}
                            </Descriptions.Item>
                            <Descriptions.Item label="URL">
                                {project.url}
                            </Descriptions.Item>
                        </Descriptions>
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

