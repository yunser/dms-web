import i18n from "i18next";
// import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
    // .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // we init with resources
        resources: {
            en: {
                translations: {
                    run: 'Run',
                    connect: 'Connect',
                    explain: 'Explain',
                    format: 'Format',
                    close_all: 'Close All',
                    submit_modify: 'Submit Modify',
                    add: 'Add',
                    delete: 'Delete',
                    export: 'Export',
                    db_name: 'Database Name',
                    new_query: 'New Query',
                    refresh: 'Refresh',
                    exec_result: 'Result',
                    history: 'History',

                    siteName: 'Design Plugin',
                    'slogon': 'Make Design Simple',

                    "To get started, edit <1>src/App.js</1> and save to reload.":
                        "To get started, edit <1>src/App.js</1> and save to reload.",
                    "Welcome to React": "Welcome to React and react-i18next",
                    welcome: "Hello <br/> <strong>World</strong>"
                }
            },
            zh: {
                translations: {
                    run: '执行',
                    connect: '连接',
                    explain: '执行计划',
                    format: '格式化',
                    close_all: '关闭所有',
                    submit_modify: '提交修改',
                    add: '新增',
                    delete: '删除',
                    export: '导出',
                    db_name: '数据库名称',
                    new_query: '新建查询',
                    refresh: '刷新',
                    exec_result: '执行结果',
                    history: '历史记录',

                    siteName: '设计插件',
                    'slogon': '让设计更简单',

                    "To get started, edit <1>src/App.js</1> and save to reload.":
                        "Starte in dem du, <1>src/App.js</1> editierst und speicherst.",
                    "Welcome to React": "欢迎"
                }
            }
        },
        fallbackLng: "en",
        debug: true,

        // have a common namespace used around the full app
        ns: ["translations"],
        defaultNS: "translations",

        keySeparator: false, // we use content as keys

        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
