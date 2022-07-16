import React, { useEffect, useMemo, useState } from 'react'

import classes from './layout.module.less'
import classNames from 'classnames'
import rough from 'roughjs';
import { useTranslation, Trans } from "react-i18next";

// https://css-tricks.com/colrv1-and-css-font-palette-web-typography/?ref=sidebar
export function HomePage() {

    const { t, i18n } = useTranslation();
    console.log('i18n', i18n)
    const [screens, setScreens] = useState([])
    const [error, setError] = useState('')
    // const [lang, setLang] = useState('en')
    const lang = useMemo(() => {
        if (i18n.language.includes('zh')) {
            return 'zh'
        }
        else {
            return 'en'
        }
    }, [i18n.language])
    
    async function getScreen() {
        let ret
        try {
            ret = await window.getScreenDetails()    
        } catch (err) {
            setError('获取屏幕数据出错，' + err.message || '未知错误')
            console.log('err', err.message)
            return
        }
        console.log('ret', ret)
        setScreens(ret.screens)
    }

    useEffect(() => {
        getScreen()
    }, [])

    const plugins = [
        {
            zh: {
                name: '随机颜色',
                description: '一键填充随机颜色',
            },
            en: {
                name: 'Random Color',
                description: 'Fill random color quickly',
            },
            banner: '/plugin/random-color-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1110990698532657166/',
                },
                {
                    type: 'jsdesign',
                    url: 'https://js.design/pluginDetail?id=62a7299dc0713d282cb7e6df',
                },
                {
                    type: 'mastergo',
                    url: 'https://mastergo.com/community/plugin/61626302068805',
                },
                {
                    type: 'sketch',
                    url: 'https://github.com/yunser/random-color-sketch',
                },
                {
                    type: 'xd',
                    url: 'https://webcdn.yunser.com/design/random-color-v1.0.1.xdx',
                },
            ],
        },
        {
            zh: {
                name: '二维码生成',
                description: '快速生成二维码',
            },
            en: {
                name: 'QR Code Generator',
                description: 'Generate QR Code quickly',
            },
            banner: '/plugin/qrcode-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1124757070391801748/',
                },
                {
                    type: 'mastergo',
                    url: 'https://mastergo.com/community/plugin/1124757070391801700',
                },
            ]
        },
        {
            zh: {
                name: '图片灰度',
                description: '选中图片并灰度化',
            },
            en: {
                name: 'Gray Image',
                description: 'Gray the selected image.',
            },
            banner: '/plugin/grey-image-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1119902195699638035',
                },
            ]
        },
        {
            zh: {
                name: '网格复制',
                description: '选中一个图层，快速复制并按照网格布局排列',
            },
            en: {
                name: 'Grid Copy',
                description: 'Duplicate layer and arrange it in a grid layout',
            },
            banner: '/plugin/copy-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1112341549325276309',
                },
            ]
        },
        {
            zh: {
                name: 'Figma Section',
                description: 'Frame 管理插件，可以快速地对 Frame 进行分组，高效管理',
            },
            en: {
                name: 'Figma Section',
                description: 'Frame management plugin, quickly group frames and manage them efficiently',
            },
            banner: '/plugin/section-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1113886515472528766',
                },
            ]
        },
        {
            zh: {
                name: '随机文本',
                description: '快速填充自定义文本',
            },
            en: {
                name: 'Random Text',
                description: 'Fill text content quickly',
            },
            banner: '/plugin/random-text-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1116426626869645051',
                },
            ]
        },
        {
            zh: {
                name: '画板助手',
                description: '批量添加画板',
            },
            en: {
                name: 'Frame Tool',
                description: 'Wrap a new frame around layers quickly',
            },
            banner: '/plugin/frame-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1118563470807277130',
                },
                {
                    type: 'jsdesign',
                    url: 'https://js.design/pluginDetail?id=62a9c6d9aebd83e44f192652',
                },
            ]
        },
        {
            zh: {
                name: 'Markdown 笔记',
                description: '使用 Markdown 快速添加笔记',
            },
            en: {
                name: 'MarkNote',
                description: 'Write Note with Markdown',
            },
            banner: '/plugin/mark-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/widget/1126927473785367489',
                },
            ]
        },
        {
            zh: {
                name: '状态',
                description: '快速标记设计稿状态',
            },
            en: {
                name: 'Status',
                description: 'Mark design status quickly',
            },
            banner: '/plugin/mark-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/widget/1125088691296055410',
                },
            ]
        },
        {
            zh: {
                name: '优先级 TODO',
                description: '快速创建一个 TODO 标签，支持优先级',
            },
            en: {
                name: 'Priority TODO',
                description: 'Quickly create a TODO tag with priority support.',
            },
            banner: '/plugin/todo-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/widget/1124015586798798685',
                },
            ]
        },
        {
            zh: {
                name: '随机大小和位置',
                description: '批量选中图层后，快速随机设置大小和位置',
            },
            en: {
                name: 'Random Size & Position',
                description: 'After batch selection of layers, quickly randomize the size and position',
            },
            banner: '/plugin/random-size-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1118961669120674782',
                },
            ]
        },
        {
            zh: {
                name: '字体图标导出',
                description: '导出图标为字体文件(.ttf)',
            },
            en: {
                name: 'Icon Font Exporter',
                description: 'Export icon as TrueType font (.ttf)',
            },
            banner: '/plugin/icon-banner.png',
            urls: [
                {
                    type: 'figma',
                    url: 'https://www.figma.com/community/plugin/1129455674275940478',
                },
            ]
        },
    ]

    const platform = {
        figma: {
            name: 'Figma',
            color: '#a458fa',
        },
        jsdesign: {
            name: '即时设计',
            color: '#df5256',
        },
        mastergo: {
            name: 'MasterGo',
            color: '#2461e6',
        },
        sketch: {
            name: 'Sketch',
            color: '#d78e24',
        },
        xd: {
            name: 'XD',
            color: '#ed70ef',
        },
    }

    return (
        <div className={classes.homePage}>
            <div className={classes.homePage_header}>
                <div className={classes.container}>
                    <div className={classes.appBar}>
                        <div className={classes.siteName}>{t('siteName')}</div>
                        <div className={classes.lang}
                            onClick={() => {
                                i18n.changeLanguage(lang == 'zh' ? 'en' : 'zh')
                            }}
                        >{lang == 'zh' ? 'English' : '中文'}</div>
                    </div>
                </div>
            </div>
            <div className={classes.slogonSection}>
                <div className={classes.container}>
                    <div className={classes.splogon}>
                        <div className={classes.text}>
                            {t('slogon')}
                        </div>
                    </div>
                </div>
            </div>
            <div className={classes.homePage_body}>
                <div className={classes.container}>
                    {/* <div className={classes.splogon}>
                        <div className={classes.text}>让设计更简单</div>
                    </div> */}
                    <div className={classes.plugins}>
                        {plugins.map((plugin, idx) => {
                            return (
                                <div className={classes.item}
                                    key={idx}
                                >
                                    <div className={classes.header}>
                                        <div className={classes.name}>{plugin[lang].name}</div>
                                        <div className={classes.desc}>{plugin[lang].description}</div>
                                    </div>
                                    <div className={classes.body}>
                                        <img className={classes.banner} src={plugin.banner} />
                                    </div>
                                    <div className={classes.footer}>
                                        <div className={classes.btns}>
                                            {plugin.urls.map((url, idx) => {
                                                return (
                                                    <button className={classes.btn}
                                                        style={{
                                                            backgroundColor: platform[url.type].color
                                                        }}
                                                        key={idx}
                                                        onClick={() => {
                                                            window.open(url.url, '_blank')
                                                        }}
                                                    >{platform[url.type].name}</button>
                                                )
                                            })}
                                            {/* <button className={classes.btn}
                                                onClick={() => {
                                                    window.open('https://js.design/pluginDetail?id=62a7299dc0713d282cb7e6df', '_blank')
                                                }}
                                            >即时设计</button> */}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <div className={classes.homePage_footer}>
                <div className={classes.container}>
                    <div className={classes.footerContent}>
                        by @Yunser
                    </div>
                </div>
            </div>
        </div>
    )
}