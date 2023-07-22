import { Alert, Button, Descriptions, Progress, Spin } from 'antd';
import React from 'react';
import { useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';
import styles from './table-data-exporter.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

export function TaskDetail({ config, id }) {
    const { t } = useTranslation()
    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(false)
    const timerRef = useRef(null)

    async function loadTask() {
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/task/detail`, {
            id,
        })
        setLoading(false)
        if (res.success) {
            const task = res.data.task
            setTask(task)
            if (task.status != 'ing') {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }

    useEffect(() => {
        loadTask()
        timerRef.current = setInterval(() => {
            loadTask()
        }, 1000)
        return () => {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [id])

    async function download() {
        const downloadUrl = `${config.host}/mysql/exportDataDownload?taskId=${task.id}`
        window.open(downloadUrl, '_blank')
    }

    // const statusMap = {
    //     'ing': t('export.status.ing'),
    //     'success': t('export.status.success'),
    //     'fail': t('export.status.fail'),
    // }
    return (
        <div>
            <div className={styles.taskDetail}>
                {loading &&
                    <Spin />
                }
                {!!task &&
                    <div>
                        {/* <div>{statusMap[task.status]}</div> */}
                        <div className={styles.num}>{task.current + 1}/{task.total}</div>
                        <div>
                            <Progress
                                percent={(task.current + 1) / task.total * 100}
                                showInfo={false}
                            />
                        </div>
                        {task.status == 'success' && !!task.hasFile &&
                            <div className={styles.tool}>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        download()
                                    }}
                                >
                                    {t('download')}
                                </Button>
                            </div>
                        }
                        {task.status == 'fail' &&
                            <div>
                                <div>{t('row')}: {task.current + 1}</div>
                                <div className={styles.error}>
                                    {task.error}
                                </div>
                                {!!task.sql &&
                                    <div className={styles.code}>
                                        <code>
                                            <pre>{task.sql}</pre>
                                        </code>
                                    </div>
                                }
                            </div>
                        }
                    </div>
                }
            </div>
        </div>
    )
}

export function TableDataExporter({ config, connectionId, dbName, tableName }) {

    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [rowNum, setRowNum] = useState(0)
    const [taskId, setTaskID] = useState('')
    const [exporting, setExporting] = useState(false)

    async function startExport() {
        setExporting(true)
        let res = await request.post(`${config.host}/mysql/exportTableData`, {
            connectionId,
            dbName,
            tableName,
            pageSize: 1000,
        })
        if (res.success) {
            setTaskID(res.data.taskId)
        }
    }

    async function loadTableInfo() {
        if (dbName && tableName) {
            setLoading(true)
            const sql = `SELECT COUNT(*) FROM \`${dbName}\`.\`${tableName}\`;`
            let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
                connectionId,
                sql,
            })
            setLoading(false)
            if (res.success) {
                const rowNum = res.data[0]['COUNT(*)']
                setRowNum(rowNum)
            }
        }
    }

    useEffect(() => {
        loadTableInfo()
    }, [tableName])
    

	return (
        <div className={styles.detailBox}>
            {loading ?
                <div>{t('loading')}</div>
            :
                <>
                    <div className={styles.body}>
                        <div className={styles.helpBox}>
                            <Alert 
                                type="warning"
                                message={t('mysql.export_data.big_table')}
                            />
                        </div>
                        <Descriptions column={1}>
                            <Descriptions.Item label={t('schema')}>
                                {dbName}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('table')}>
                                {tableName}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('mysql.export_data.table_length')}>
                                {rowNum}
                            </Descriptions.Item>
                        </Descriptions>
                        <div>
                            <Button
                                type="primary"
                                size="small"
                                onClick={startExport}
                                disabled={exporting}
                            >
                                {t('export')}
                            </Button>
                        </div>
                        {exporting &&
                            <div>
                                <TaskDetail
                                    config={config}
                                    id={taskId}
                                />
                            </div>
                        }
                    </div>
                </>
            }
        </div>
    )
}
