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
            <Table
                dataSource={list}
                columns={columns}
                size="small"
                pagination={false}
                scroll={{
                    y: 560,
                }}
            />
        </Modal>
    )
}
