import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './help.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';

function Tester() {
    console.log(('Tester/render'))
    const [num, setNum] = useState(0)
    const [num2, setNum2] = useState(0)
    return (
        <div>
            {/* <div>{num}</div> */}
            <div>
                <Button
                    onClick={() => {
                        setNum(num + 1)
                        setNum2(num2 + 1)
                    }}
                >
                    +1
                </Button>
            </div>
        </div>
    )
}

export function Help({ config, }) {
    console.warn('Help/render')
    
    const { t } = useTranslation()

    return (
        <div>
            <article className={styles.article}>
                <h1>帮助</h1>
                <p>目前功能以查询为主，更多功能正在开发中...</p>
                <p>开发目标以满足自用为主，如有建议，请提 <a href="https://github.com/yunser/dms-public/issues" target="_blank">Issure</a>
                </p>
                {/* <Tester /> */}
            </article>
        </div>
    )
}
