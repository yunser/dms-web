import React, { useEffect, useState } from 'react'
// import logo from './logo.svg'
import '@yunser/style-reset/dist/index.css'
// import './app.less'
import './global.css'
import './iconfont.css'
import 'antd/dist/antd.css';
// import '~antd/lib/style/themes/variable.less';
// import 'antd/es/style/themes/dark.less'

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
import "./i18n";
import './userWorker';

export default function App() {
    // const [count, setCount] = useState(0)

    return (
        <Router>
            {/* <App /> */}
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </div>
        </Router>
    )
}
