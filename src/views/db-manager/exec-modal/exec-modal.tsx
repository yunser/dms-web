import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './exec-modal.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { TabPane } = Tabs
const { TextArea } = Input


export function ExecModal({ config, sql, onClose, onSuccess, tableName, dbName }) {
    const { t } = useTranslation()

    const [modelVisible, setModalVisible] = useState(true)
    const [modelCode, setModalCode] = useState('')
    // 执行状态弹窗
    const [resultModelVisible, setResultModalVisible] = useState(false)
    const [resultActiveKey, setResultActiveKey] = useState('')
    const [resultTabs, setResultTabs] = useState([
        // {
        //     title: '执行结果1',
        //     key: '0',
        // }

    ])
    console.log('resultTabs', resultTabs)
    useEffect(() => {
        setModalCode(sql)
    }, [sql])


    function resetSubmit() {

    }

    async function doSubmit() {
        setModalVisible(false)
        
        setResultModalVisible(true)

        const lines = modelCode.split(';').map(item => item.trim()).filter(item => item)
        let lineIdx = 0
        let newTabs = []
        console.log('lines', lines)
        for (let line of lines) {
            console.log('line', line)
            let res = await request.post(`${config.host}/mysql/execSql`, {
                sql: line,
            }, {
                noMessage: true,
            })
            let error = ''
            if (res.success) {
                // message.success('提交成功')
                
                // run()
                
            }
            else {
                error = res.data.message || 'Unknown Error'
            }
            // console.log('res', res)
            const key = `tab-${lineIdx}`
            newTabs = [
                ...newTabs,
                {
                    title: `${t('result')} ${lineIdx + 1}`,
                    key,
                    data: {
                        sql: line,
                        resData: res.data,
                        error,
                    }
                }
            ]
            setResultTabs(newTabs)
            setResultActiveKey(key)

            lineIdx++
        }


        resetSubmit()

    }

    function TabItem(item: any) {
        return (
            <TabPane
                tab={(
                    <span>
                        {item.data.error ?
                            <CloseCircleOutlined className={styles.failIcon} />
                        :
                            <CheckCircleOutlined className={styles.successIcon} />
                        }
                        {item.title}
                    </span>
                )}
                key={item.key}
                closable={true}
            >
                <div className={styles.modalResultBox}>
                    <div className={styles.sqlBox}>
                        <div>SQL:</div>
                        <div><code><pre>{item.data.sql}</pre></code></div>
                    </div>
                    {!!item.data.error ?
                        <div>
                            <div>Error</div>
                            <div className={styles.errMsg}>{item.data.error}</div>
                        </div>
                    :
                        <div>
                            <div>Info:</div>
                            <div className={styles.info}>
                                {!!item.data.resData.result?.info ? item.data.resData.result?.info : `影响行数：${item.data.resData?.result?.affectedRows}`}</div>
                        </div>
                    }
                </div>
            </TabPane>
            // <SqlBox defaultSql={item.defaultSql} />
        )
    }

	return (
        <div className={styles.resultBox}>
            {modelVisible &&
                <Modal
                    title={t('submit_modify')}
                    maskClosable={false}
                    visible={true}
                    width={800}
                    okText={t('run')}
                    // onOk={handleOk}
                    // okButtonProps={{
                    //     children: t('run'),
                    // }}
                    onCancel={() => {
                        setModalVisible(false)
                        onClose && onClose()
                    }}
                    onOk={() => {
                        doSubmit()
                    }}
                >
                    <div className={styles.safeTip}>{t('confirm_sql')}</div>

                    <TextArea
                        // className={styles.textarea} 
                        value={modelCode}
                        rows={4}
                    // disabled
                        onChange={e => setModalCode(e.target.value)}
                    />
                    {/* <p>Some contents...</p>
                    <p>Some contents...</p>
                    <p>Some contents...</p> */}
                </Modal>
            }
            {resultModelVisible &&
                <Modal
                    title={t('exec_result')}
                    visible={true}
                    width={800}
                    // maskClosable={false}
                    // onOk={handleOk}
                    // okButtonProps={{
                    //     children: '执行',
                    // }}
                    onCancel={() => {
                        setResultModalVisible(false)
                        onClose && onClose()
                        
                        const isSomeSuccess = resultTabs.find(item => !item.data.error)
                        if (isSomeSuccess) {
                            onSuccess && onSuccess()
                        }
                    }}
                    // onOk={() => {
                    //     doSubmit()
                    // }}
                    footer={null}
                >
                    <Tabs
                        // onEdit={onEdit}
                        activeKey={resultActiveKey}
                        hideAdd={true}
                        onChange={key => {
                            setResultActiveKey(key)
                        }}
                        type="card"
                        style={{
                            // height: '100%',
                        }}
                    >
                        {resultTabs.map(TabItem)}
                    </Tabs>

                </Modal>
            }
        </div>
    )
}
