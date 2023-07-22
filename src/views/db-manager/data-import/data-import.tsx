import { Button, Input } from 'antd';
import React, { useState } from 'react';
import styles from './data-import.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { TaskDetail } from '../table-data-exporter/table-data-exporter';

export function SqlDataImport({ config, connectionId }: any) {
    
    const { t } = useTranslation()
    const [code, setCode] = useState('')
    // const [code, setCode] = useState(`INSERT INTO \`linxot\`.\`ai_log3\` (\`id\`, \`content\`, \`response\`, \`create_time\`, \`status\`, \`error\`) VALUES (1, '12', '323', '2023-02-13 14:28:10', NULL, NULL);\nINSERT INTO \`linxot\`.\`ai_log3333\` (\`id\`, \`content\`, \`response\`, \`create_time\`, \`status\`, \`error\`) VALUES (3, '如何评价 Chat GPT？', 'Chat GPT 是一款 AI 工具', '2023-02-13 15:20:45', 1, '');`)
    const [loading, setLoading] = useState(false)
    const [taskId, setTaskId] = useState(false)

    async function dataImport() {
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/runSqls`, {
            connectionId,
            sqls: code.split('\n'),
        })
        setLoading(false)
        if (res.success) {
            setTaskId(res.data.taskId)
        }
    }

    return (
        <div className={styles.docBox}>
            {/* <div className={styles.header}>
            </div> */}
            <div className={styles.body}>
                <div className={styles.codeBox}>
                    <Input.TextArea
                        placeholder="SQL"
                        value={code}
                        rows={8}
                        onChange={e => {
                            setCode(e.target.value)
                        }}
                    >
                    </Input.TextArea>
                </div>
                <div>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                            dataImport()
                        }}
                    >
                        {t('run')}
                    </Button>
                </div>
                <div>
                    {!!taskId &&
                        <TaskDetail
                            config={config}
                            id={taskId}
                        />
                    }
                </div>
            </div>
        </div>
    )
}
