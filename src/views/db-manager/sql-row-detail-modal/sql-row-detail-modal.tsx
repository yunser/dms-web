import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './sql-row-detail-modal.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { TabPane } = Tabs
const { TextArea } = Input


export function RowDetailModal({ config, connectionId, item, onCancel, onSuccess, tableName, dbName }) {
    const { t } = useTranslation()

    // const [columns, setColumns] = useState([])
    const [list, setList] = useState([])
    const [keyword, setKeyword] = useState('')
    console.log('item', item)
    const columns = [
        {
            title: t('field'),
            dataIndex: 'field',
            width: 240,
        },
        {
            title: t('value'),
            dataIndex: 'value',
        },
    ]
    const filterList = useMemo(() => {

        if (!keyword) {
            return list
        }
        return list.filter(item => {
            return (item.field && item.field.toLowerCase().includes(keyword.toLowerCase()))
                || (item.value && ('' + item.value).toLowerCase().includes(keyword.toLowerCase()))
        })
    }, [list, keyword])

    useEffect(() => {
        const list = [] 
        for (let key in item) {
            const { fieldName, value } = item[key]
            list.push({
                field: fieldName,
                value,
            })
        }
        console.log('list', list)
        setList(list)
    }, [item])

	return (
        <Modal
            title={t('detail')}
            visible={true}
            width={800}
            // okText={t('run')}
            // onOk={handleOk}
            // okButtonProps={{
            //     children: t('run'),
            // }}
            onCancel={onCancel}
            onOk={() => {
                // doSubmit()
            }}
            footer={null}
        >
            <div style={{
                marginBottom: 8,
            }}>
                <Input
                    placeholder={t(('search'))}
                    value={keyword}
                    onChange={e => {
                        setKeyword(e.target.value)
                    }}
                    style={{
                        width: 320,
                    }}
                />
            </div>
            <Table
                dataSource={filterList}
                columns={columns}
                size="small"
                pagination={false}
                scroll={{
                    y: 480,
                }}
            />
        </Modal>
    )
}
