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
                <p>如需帮助，请看 <a href="https://github.com/yunser/dms-public" target="_blank">文档</a></p>
                <p>如有建议，请提 <a href="https://github.com/yunser/dms-public/issues" target="_blank">Issure</a></p>
            </article>
        </div>
    )
}
