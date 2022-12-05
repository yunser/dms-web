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
    Link,
    useSearchParams,
} from "react-router-dom";
import { HomePage } from './views/home'
storage.set('asd', 'asd2')
import { GitHome } from './views/git/git-home'
import { FileHome } from './views/file/file-home'
import { SshDetail } from './views/ssh/ssh-home'
import { SshConnect } from './views/ssh/ssh-connect'
import { ServiceHome } from './views/service/service-home'
import { SwaggerHome } from './views/swagger/swagger-home'
import { SwaggerDetail } from './views/swagger/swagger-detail'
import { ProductionHome } from './views/production/production-home'
import { SqlLab } from './views/db-manager/sql-lab'
import { LoggerDetail } from './views/logger/logger-detail'
import { AlasqlHome } from './views/slasql/ip-home'

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
            <SshConnect />
        </div>
    )
}

function FullApp({ children }) {
    return (
        <div style={{ height: '100vh' }}>
            {children}
        </div>
    )
}

function SwaggerDetailPage() {

    let [searchParams, setSearchParams] = useSearchParams();

    const url = searchParams.get('url')
    console.log('url', url)

    const config = {
        host: 'http://localhost:10086',
    }

    if (url) {
        return (
            <SwaggerDetail
                config={config}
                // event$={event$}
                apiUrl={url}
                // project={curProject}
                onHome={() => {
                    // setView('list')
                }}
                // projectPath={curProject.path}
                // onList={() => {
                //     setView('list')
                // }}
            />
        )
    }
    return (
        <div>
            no url query
        </div>
    )
}

function WeappPage() {
    return (
        <ProductionHome
        />
    )
}

function Lab() {
    return (
        <div>
            实验室
            <div>
                <Link to="/weapp">小程序截图</Link>
            
            </div>
        </div>
    )
}

export default function App() {
    // const [count, setCount] = useState(0)

    useEffect(() => {
        window.onbeforeunload = () => {
            console.log("onbeforeunload");
            return "提示语";   
        }
    }, [])

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/git" element={<GitPage />} />
                    <Route path="/file" element={<FilePage />} />
                    <Route path="/ssh" element={<SshPage />} />
                    <Route path="/service" element={<ServiceHome />} />
                    {/* <Route path="/swagger" element={<SwaggerHome />} /> */}
                    <Route path="/swagger" element={<FullApp><SwaggerHome /></FullApp>} />
                    <Route path="/swagger/detail" element={<FullApp><SwaggerDetailPage /></FullApp>} />
                    <Route path="/weapp" element={<FullApp><WeappPage /></FullApp>} />
                    <Route path="/sql" element={<FullApp><SqlLab /></FullApp>} />
                    <Route path="/logger" element={<FullApp><LoggerDetail /></FullApp>} />
                    <Route path="/lab" element={<FullApp><Lab /></FullApp>} />
                    <Route path="/alasql" element={<FullApp><AlasqlHome /></FullApp>} />
                </Routes>
            </div>
        </Router>
    )
}
