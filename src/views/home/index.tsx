import React, { useEffect, useMemo, useState } from 'react'

import classes from './layout.module.less'
// import classNames from 'classnames'
// import rough from 'roughjs';
// import { useTranslation, Trans } from "react-i18next";
import { DbManager } from '../db-manager';

const initialValue = [
    {
        type: 'paragraph',
        children: [{ text: 'A line of text in a paragraph.' }],
    },
]

// https://css-tricks.com/colrv1-and-css-font-palette-web-typography/?ref=sidebar
export function HomePage() {

    // const { t, i18n } = useTranslation();
    // console.log('i18n', i18n)
    const [screens, setScreens] = useState([])
    const [error, setError] = useState('')
    // const [lang, setLang] = useState('en')
    // const lang = useMemo(() => {
    //     if (i18n.language.includes('zh')) {
    //         return 'zh'
    //     }
    //     else {
    //         return 'en'
    //     }
    // }, [i18n.language])
    


    return (
        <div className={classes.homePage}>
            {/* Home */}
            {/* 1 */}
            <DbManager
                config={{
                    // host: 'http://localhost:7003'
                    host: 'http://localhost:10086'
                }}
            />

            
        </div>
    )
}