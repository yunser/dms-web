// @i18n
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
    .use(LanguageDetector)
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
                    close: 'Close',
                    close_all: 'Close All',
                    close_other: 'Close Other',
                    submit_modify: 'Submit Modify',
                    add: 'Add',
                    delete: 'Delete',
                    delete_confirm: 'Confirm delete?',
                    export: 'Export JSON',
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
                    welcome: "Hello <br/> <strong>World</strong>",
                    help: 'Help',
                    json: 'JSON',
                    compress: 'Compress',
                    password: 'Password',
                    port: 'Port',
                    user: 'User',
                    host: 'Host',
                    remember_me: 'Remember me',
                    no_sql: 'No SQL',
                    search: 'Search',
                    time: 'Time',
                    rows: 'rows',
                    workbench: 'Workbench',
                    name: 'Name',
                    save: 'Save',
                    table_drop: 'Drop table',
                    table_truncate: 'Truncate table',
                    view_struct: 'View Struct',
                    export_struct: 'Export Struct',
                }
            },
            zh: {
                translations: {
                    run: '执行',
                    connect: '连接',
                    explain: '执行计划',
                    format: '格式化',
                    close: '关闭',
                    close_all: '关闭所有',
                    close_other: '关闭其他',
                    submit_modify: '提交修改',
                    add: '新增',
                    delete: '删除',
                    delete_confirm: '确认删除？',
                    export: '导出 JSON',
                    db_name: '数据库名称',
                    new_query: '新建查询',
                    refresh: '刷新',
                    exec_result: '执行结果',
                    history: '历史记录',

                    siteName: '设计插件',
                    'slogon': '让设计更简单',

                    "To get started, edit <1>src/App.js</1> and save to reload.":
                        "Starte in dem du, <1>src/App.js</1> editierst und speicherst.",
                    "Welcome to React": "欢迎",
                    help: '帮助',
                    json: 'JSON',
                    compress: '压缩',
                    password: '密码',
                    port: '端口',
                    user: '用户名',
                    host: '主机',
                    remember_me: '记住密码',
                    no_sql: '没有要执行的 SQL',
                    search: '搜索',
                    time: '时间',
                    rows: '行',
                    workbench: '工作台',
                    name: '名称',
                    save: '保存',
                    table_drop: '删除表',
                    table_truncate: '清空表',
                    view_struct: '查看结构',
                    export_struct: '导出建表语句',
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
