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
                    explain_must_select: 'Only SELECT statements can be EXPLAIN',
                    format: 'Format',
                    close: 'Close',
                    close_all: 'Close All',
                    close_other: 'Close Other',
                    submit_modify: 'Submit Modify',
                    add: 'Add',
                    edit: 'Edit',
                    delete: 'Delete',
                    delete_confirm: 'Confirm delete',
                    export: 'Export',
                    export_json: 'Export JSON',
                    export_csv: 'Export CSV',
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
                    text: 'Text',
                    compress: 'Compress',
                    password: 'Password',
                    port: 'Port',
                    user: 'User',
                    host: 'Host',
                    remember_me: 'Remember me',
                    no_sql: 'No SQL',
                    search: 'Search',
                    time: 'Time',
                    rows: 'Rows',
                    workbench: 'Workbench',
                    name: 'Name',
                    save: 'Save',
                    table_drop: 'Drop table',
                    table_truncate: 'Truncate table',
                    view_struct: 'View Struct',
                    export_struct: 'Export Struct',
                    download: 'Download',
                    schema: 'Schema',
                    schema_name: 'Schema Name',
                    sql: 'SQL',
                    status: 'Status',
                    message: 'Message',
                    exec_time: 'Time(ms)',
                    actions: 'Actions',
                    use: 'Use',
                    content: 'Content',
                    no_content: 'No Content',
                    limit: 'Limit',
                    no_limit: 'Don\'t limit',
                    list_view: 'List view',
                    index: 'Index',
                    indexes: 'Indexes',
                    columns: 'Columns',
                    partition: 'Partitioning',
                    options: 'Options',
                    connection_create: 'New connection',
                    connection_export: 'Export connection',
                    db_create: 'New Schema',
                    db_edit: 'Edit Schema',
                    user_manager: 'Users',
                    table_list: 'View tables',
                    table_create: 'New table',
                    comment: 'Comment',
                    nginx: 'Nginx',
                    character_set: 'Character Set',
                    collation: 'Collation',
                    create_time: 'Create time',
                    avg_row_length: 'Avg Row Length',
                    auto_increment: 'Auto Increment',
                    data_length: 'Data Length',
                    // table_rows: 'Table Rows',
                    table_name: 'Table Name',
                    index_name: 'Index',
                    index_length: 'Index Length',
                    data_free: 'Data Free',
                    reconnect: 'Reconnect',
                    connect_error: 'Connect error',
                    connected: 'Connected',
                    loading: 'Loading...',
                    confirm_sql: 'The following is the SQL to be executed, please confirm',
                    column_name: 'Column',
                    type: 'Type',
                    primary_key: 'Primary Key',
                    default: 'Default',
                    nullable: 'Nullable',
                    index_columns: 'Columns',
                    table_empty: 'NO TABLE',
                    sql_manage: 'SQLs',
                    toggle_theme: 'Toggle Theme',
                }
            },
            zh: {
                translations: {
                    run: '执行',
                    connect: '连接',
                    explain: '执行计划',
                    explain_must_select: '只有 SELECT 语句才可以 EXPLAIN',
                    format: '格式化',
                    close: '关闭',
                    close_all: '关闭所有',
                    close_other: '关闭其他',
                    submit_modify: '提交修改',
                    add: '新增',
                    edit: '编辑',
                    delete: '删除',
                    delete_confirm: '确认删除',
                    export: '导出',
                    export_json: '导出 JSON',
                    export_csv: '导出 CSV',
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
                    text: '文本',
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
                    download: '下载',
                    schema: '数据库',
                    schema_name: '数据库名',
                    sql: 'SQL',
                    status: '状态',
                    message: '信息',
                    exec_time: '执行时间(毫秒)',
                    actions: '操作',
                    use: '使用',
                    content: '内容',
                    no_content: '没有内容',
                    limit: '限制',
                    no_limit: '不限制',
                    list_view: '列表视图',
                    index: '索引',
                    indexes: '索引',
                    columns: '字段',
                    partition: '分区',
                    options: '配置',
                    connection_create: '新增连接',
                    connection_export: '导出连接',
                    db_create: '新增数据库',
                    db_edit: '编辑数据库',
                    user_manager: '用户管理',
                    table_list: '查看表',
                    table_create: '新增表',
                    comment: '注释',
                    nginx: '引擎',
                    character_set: '字符集',
                    collation: '字符编码',
                    create_time: '创建时间',
                    avg_row_length: '平均行长度',
                    auto_increment: '自增',
                    row_format: '行格式',
                    data_length: '数据大小',
                    table_name: '表名',
                    // table_rows: '行',
                    index_name: '索引名',
                    index_length: '索引大小',
                    data_free: '数据碎片',
                    reconnect: '重新连接',
                    connect_error: '连接错误',
                    connected: '已连接',
                    loading: '加载中...',
                    confirm_sql: '以下是待执行的 SQL，请确认',
                    column_name: '列名',
                    type: '类型',
                    primary_key: '主键',
                    default: '默认值',
                    nullable: '可空',
                    index_columns: '包含列',
                    table_empty: '没有表格',
                    sql_manage: 'SQL 代码管理',
                    toggle_theme: '切换主题',
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
