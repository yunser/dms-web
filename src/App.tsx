import React, { useEffect, useState } from 'react'
// import logo from './logo.svg'
import '@yunser/style-reset/dist/index.css'
import './app.less'
import './global.css'
import './iconfont.css'
// import '~antd/dist/antd.dark.less'; // 引入官方提供的暗色 less 样式入口文件
// import 'antd/dist/antd.css';
// import darkCss from 'antd/dist/antd.dark.css';
// console.log('darkCss', darkCss)

// import '~antd/lib/style/themes/variable.less';
// import 'antd/es/style/themes/dark.less'

// import '~antd/es/style/themes/default.less';
// import ddd from '~antd/es/style/themes/dark.less';
// import ddd from './antd-dark.css.raw'

// import '~antd/dist/antd.less'; // 引入官方提供的 less 样式入口文件
// @import 'your-theme-file.less'; // 用于覆盖上面定义的变量
import './userWorker';

import storage from '@/utils/storage'
import clssses from './app.module.less'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from "react-router-dom";
import { HomePage } from './views/home'
storage.set('asd', 'asd2')
import { GitHome } from './views/git/git-home'
import { FileHome } from './views/file/file-home'
import { SshHome } from './views/ssh/ssh-home'

function GitPage() {
    return (
        <div style={{ height: '100vh' }}>
            <GitHome />
        </div>
    )
}

function FilePage() {
    return (
        <div style={{ height: '100vh' }}>
            <FileHome />
        </div>
    )
}

function SshPage() {
    return (
        <div style={{ height: '100vh' }}>
            <SshHome />
        </div>
    )
}


export default function App() {
    // const [count, setCount] = useState(0)

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/git" element={<GitPage />} />
                    <Route path="/file" element={<FilePage />} />
                    <Route path="/ssh" element={<SshPage />} />
                </Routes>
            </div>
        </Router>
    )
}
