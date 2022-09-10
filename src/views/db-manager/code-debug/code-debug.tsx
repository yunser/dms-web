import React, { useState } from 'react';
import styles from './code-debug.module.less';
// import { useLocation } from "umi";
import {Button, Dropdown, Menu } from 'antd'
import { DevPanel } from './panel';
import {
    RocketOutlined,
} from '@ant-design/icons';

export function CodeDebuger(props) {
    const { page, path } = props
    // const location = useLocation()

    // return null
    const project_path = '/Users/yunser/app/dms-new'

    const [panelVisible, setPanelVisible] = useState(false)
    // const [panelVisible, setPanelVisible] = useState(true)

    const pagePaths = {
        'waterCompanyList': 'src/pages/s_company/waterCompany.tsx',
        'waterCompanyIndex': 'src/views/dev-tool/code-debug.tsx',
    }

    return (
        <div>
            {localStorage.getItem('showDevTool') &&
                <div className={styles.CodeDebuger}>
                    <div>
                        <a href={`vscode://file/${project_path}/${path || pagePaths[page]}`}>打开代码</a>
                    </div>
                </div>
            }
        </div>
    )
}
