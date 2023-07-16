import { message, Space, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './export-doc.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/views/db-manager/icon-button';
import { ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from '@/views/db-manager/utils/http';
import { saveAs } from 'file-saver';

function formatValue(value) {
    if (value === null) {
        return 'NULL'
    }
    return value
}

export function ExportDoc({ config, connectionId, dbName }: any) {
    
    const { t } = useTranslation()
    const [html, setHtml] = useState('')
    const [loading, setLoading] = useState(false)

    function handleData(tables, columns) {
        const tableHtmls = []
        const sortedTables = tables
            // .filter(item => item.TABLE_NAME == 'address_node')
            .sort((a, b) => {
                return a.TABLE_NAME.localeCompare(b.TABLE_NAME)
            })
        for (let table of sortedTables) {
            const tableColumns = columns.filter(item => item.TABLE_NAME == table.TABLE_NAME)
            // console.log('tableColumns', tableColumns)
            const bodyHtml = []
            for (let column of tableColumns) {
                bodyHtml.push(`<tr>
    <td>${column.COLUMN_NAME}</td>
    <td>${column.COLUMN_TYPE}</td>
    <td>${column.IS_NULLABLE}</td>
    <td>${column.COLUMN_KEY == 'PRI' ? 'YES' : ''}</td>
    <td>${column.EXTRA == 'auto_increment' ? 'YES' : ''}</td>
    <td>${formatValue(column.COLUMN_DEFAULT)}</td>
    <td>${column.COLUMN_COMMENT}</td>
</tr>`)
            }
            const columnsHtml = `
            <table>
                <tr>
                    <th>${t('column_name')}</th>
                    <th>${t('type')}</th>
                    <th>${t('nullable')}</th>
                    <th>${t('primary_key')}</th>
                    <th>${t('auto_increment')}</th>
                    <th>${t('default')}</th>
                    <th>${t('comment')}</th>
                </tr>
                ${bodyHtml.join('\n')}
                
            </table>
            `
            let comment = ''
            if (table.TABLE_COMMENT) {
                comment = `<p>${table.TABLE_COMMENT}</p>`
            }
            tableHtmls.push(`<h2>${table.TABLE_NAME}</h2>
            ${comment}
            ${columnsHtml}
            `)
        }
        setHtml(tableHtmls.join(''))
    }

    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `select * from \`information_schema\`.\`TABLES\` where TABLE_SCHEMA = '${dbName}' and \`TABLE_TYPE\` = 'BASE TABLE';`,
        })
        if (res.success) {
            // message.info('连接成功')
            const tables = res.data
            // console.log('tables', tables)
            // setList(list)
            let colRes = await request.post(`${config.host}/mysql/execSqlSimple`, {
                connectionId,
                sql: `select * from \`information_schema\`.\`COLUMNS\` where TABLE_SCHEMA = '${dbName}';`,
            })
            if (colRes.success) {
                const columns = colRes.data
                // console.log('columns', columns)
                handleData(tables, columns)
            }
        } else {
            message.error('连接失败')
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className={styles.docBox}>
            <div className={styles.header}>
                <Space>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadData()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('export_html')}
                        onClick={() => {
                            const downloadHtml = `<!DOCTYPE html>
                            <html lang="en">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Document</title>
                                <style>
                                    * {
                                        padding: 0;
                                        margin: 0;
                                        box-sizing: border-box;
                                    }
                                    body {
                                        font-size: 14px;
                                    }
                                    h2 {
                                        font-weight: bold;
                                        font-size: 24px;
                                        margin-bottom: 8px;
                                    }
                                    p {
                                        margin-bottom: 1em;
                                    }
                                    article {
                                        max-width: 1200px;
                                        padding: 16px;
                                    }
                                    table {
                                        margin-bottom: 32px;
                                        border-collapse: collapse;
                                    }
                                    th,
                                    td {
                                        padding: 4px 8px;
                                        border: 1px solid #ccc;
                                        text-align: left;
                                    }
                                    </style>
                            </head>
                            <body>
                                <article>
                                    ${html}
                                </article>
                            </body>
                            </html>`
                            const blob = new Blob([downloadHtml], {type: 'text/html;charset=utf-8'});
                            saveAs(blob, `${dbName}.html`)
                        }}
                    >
                        <ExportOutlined />
                    </IconButton>
                </Space>
                <div>
                </div>
            </div>
            <div className={styles.body}>
                {loading ?
                    <Spin />
                :
                    <div 
                        className={styles.html}
                        dangerouslySetInnerHTML={{
                            __html: html,
                        }}
                    ></div>
                }
            </div>
        </div>
    )
}
