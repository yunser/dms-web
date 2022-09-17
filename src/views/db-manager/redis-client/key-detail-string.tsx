import { Button, Checkbox, Descriptions, Dropdown, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Table, Tabs, Tree } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-client.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'
import { IconButton } from '../icon-button';
import { FolderOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import humanFormat from 'human-format'
import { ListPushHandler } from './list-push';

const timeScale = new humanFormat.Scale({
  ms: 1,
  s: 1000,
  min: 60000,
  h: 3600000,
  d: 86400000
})


export function StringContent({ curDb, connectionId, onSuccess, data, config }) {
    const { t } = useTranslation()
    // const [curDb] = useState(0)
    const [itemDetail, setItemDetail] = useState(null)
    const [inputValue, setInputValue] = useState(data.value)
    const editType = 'update'

    console.log('data?', data)

    return (
        <div className={styles.stringBox}>

            <Input.TextArea
                className={styles.textarea}
                value={inputValue}
                onChange={e => {
                    setInputValue(e.target.value)
                }}
                rows={24}
                // style={{
                //     width: 400,
                // }}
            />
            <div style={{
                marginTop: 8,
            }}>
                {editType == 'update' ?
                    <Space>
                        <Button
                            size="small"
                            onClick={async () => {
                                let res = await request.post(`${config.host}/redis/set`, {
                                    connectionId: connectionId,
                                    key: data.key,
                                    value: inputValue,
                                    // dbName,
                                })
                                console.log('get/res', res.data)
                                if (res.success) {
                                    // message.success('修改成功')
                                    message.success(t('success'))
                                    onSuccess && onSuccess()
                                    // setResult({
                                    //     key: item,
                                    //     ...res.data,
                                    // })
                                    // setInputValue(res.data.value)
                                }
                            }}
                        >
                            {t('update')}
                        </Button>
                        
                    </Space>
                :
                    <Button
                        onClick={async () => {
                            let res = await request.post(`${config.host}/redis/set`, {
                                connectionId: connectionId,
                                key: inputKey,
                                value: inputValue,
                                // dbName,
                            })
                            console.log('get/res', res.data)
                            if (res.success) {
                                message.success('新增成功')
                                loadKeys()
                                loadKey(inputKey)
                                // setResult(null)
                                // setResult({
                                //     key: item,
                                //     ...res.data,
                                // })
                                // setInputValue(res.data.value)
                            }
                        }}
                    >
                        新增
                    </Button>
                }
            </div>
        </div>
    )
}
