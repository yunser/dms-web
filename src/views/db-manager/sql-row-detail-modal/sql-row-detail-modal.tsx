import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './sql-row-detail-modal.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { LeftRightLayout } from '@/components/left-right-layout';

export function RowDetailModal({ originColumns, item, onCancel, onSuccess, tableName, dbName }) {
    const { t } = useTranslation()

    // const [columns, setColumns] = useState([])
    const [list, setList] = useState([])
    const [keyword, setKeyword] = useState('')

    const columnMap = useMemo(() => {
        const result = {}
        for (let col of originColumns) {
            result[col.COLUMN_NAME] = col
        }
        return result
    }, [originColumns])

    const columns = [
        // {
        //     title: t('type'),
        //     dataIndex: 'type',
        //     width: 160,
        //     render(value, item) {
        //         return (
        //             <Space>
        //                 {/* <FileTextOutlined className={styles.icon} /> */}
        //                 {/* {value} */}
        //                 {columnMap[item.field].COLUMN_TYPE}
        //             </Space>
        //         )
        //     }
        // },
        {
            title: t('field'),
            dataIndex: 'field',
            align: 'right',
            width: 240,
            render(value) {
                return (
                    <LeftRightLayout>
                        {/* <FileTextOutlined className={styles.icon} /> */}
                        <Popover
                            content={
                                <div>
                                    <div>{columnMap[value]?.COLUMN_TYPE}</div>
                                    <div>{columnMap[value]?.COLUMN_COMMENT}</div>
                                </div>
                            }
                            >
                            <InfoCircleOutlined style={{ opacity: columnMap[value]?.COLUMN_COMMENT ? 1 : 0.4}} />
                        </Popover>
                        {value}

                    </LeftRightLayout>
                )
            }
        },
        {
            title: t('value'),
            dataIndex: 'value',
            render(value) {
                if (value == null) {
                    return (
                        <div className={styles.null}>NULL</div>
                    )
                }
                return <div>{value}</div>
            }
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
            if (key != '_idx') {
                const { fieldName, value } = item[key]
                list.push({
                    field: fieldName,
                    value,
                })
            }
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
                    placeholder={t(('filter'))}
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
                bordered
                pagination={false}
                rowKey="field"
                scroll={{
                    y: 480,
                }}
            />
        </Modal>
    )
}
