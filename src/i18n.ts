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
                    delete_all: 'Delete all',
                    // delete_all_confirm: 'Delete all history?',
                    delete_all_confirm: 'Delete all?',
                    export: 'Export',
                    export_json: 'Export JSON',
                    export_csv: 'Export CSV',
                    db_name: 'Database Name',
                    new_query: 'New Query',
                    refresh: 'Refresh',
                    exec_result: 'Result',
                    history: 'History',
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
                    schemas: 'Schemas',
                    schema_name: 'Schema Name',
                    sql: 'SQL',
                    status: 'Status',
                    message: 'Message',
                    duraion: 'Duraion',
                    exec_time: 'Duraion(ms)',
                    actions: 'Actions',
                    use: 'Use',
                    content: 'Content',
                    no_content: 'No Content',
                    limit: 'Limit',
                    no_limit: 'Don\'t limit',
                    list_view: 'List view',
                    index: 'Index',
                    indexes: 'Indexes',
                    column: 'Column',
                    columns: 'Columns',
                    partition: 'Partitioning',
                    options: 'Options',
                    connection_create: 'New connection',
                    connection_update: 'Update connection',
                    connection_export: 'Export connection',
                    db_create: 'New Schema',
                    db_edit: 'Edit Schema',
                    user_manager: 'Users',
                    table: 'Table',
                    tables: 'Tables',
                    table_list: 'View tables',
                    table_create: 'New table',
                    comment: 'Comment',
                    nginx: 'Nginx',
                    character_set: 'Character Set',
                    collation: 'Collation',
                    create_time: 'Create Time',
                    update_time: 'Update Time',
                    avg_row_length: 'Avg Row Length',
                    auto_increment: 'Auto Increment',
                    row_format: 'Row Format',
                    data_length: 'Data Length',
                    // table_rows: 'Table Rows',
                    table_name: 'Table Name',
                    index_name: 'Index',
                    index_length: 'Index Length',
                    data_free: 'Data Free',
                    reconnect: 'Reconnect',
                    connect_error: 'Connect Error',
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
                    welcome: 'Welcome to use DMS',
                    saved: 'Saved',
                    more: 'More',
                    query: 'Query',
                    partition_info: 'Partitions',
                    folder: 'Folder',
                    expression: 'Expression',
                    truncate: 'Truncate',
                    description: 'Description',
                    drop: 'Drop',
                    success: 'Success',
                    fail: 'Fail',
                    unnamed: 'Unnamed',
                    untitled: 'Untitled',
                    untitled_query: 'Untitled Query',
                    lower_case: 'Lower Case',
                    upper_case: 'Upper Case',
                    server_version: 'Server Version',
                    info: 'Infomation',
                    copy_key_name: 'Copy key name',
                    copied: 'Copied',
                    update: 'Update',
                    num_keys: 'Keys',
                    db: 'DB',
                    encoding: 'Encoding',
                    mem_size: 'Size',
                    item_add: 'Add item',
                    item_update: 'Update item',
                    insert_into: 'Insert into',
                    front: 'Font',
                    last: 'Last',
                    score: 'Score',
                    field: 'Field',
                    key_name: 'Key Name',
                    string: 'String',
                    list: 'List',
                    set: 'Set',
                    zset: 'Sorted Set',
                    hash: 'Hash',
                    match: 'Match',
                    fuzzy: 'Include',
                    command: 'Command',
                    setting: 'Setting',
                    no_expire: 'No Expire',
                    cancel: 'Cancel',
                    ok: 'OK',
                    unit: 'Unit',
                    msecond: 'ms',
                    second: 'Second',
                    minute: 'Minutes',
                    hour: 'Hours',
                    day: 'Days',
                    month: 'Months',
                    year: 'Years',
                    favorite_key: 'Favorite key',
                    favorite_keys: 'Favorite Keys',
                    view: 'View',
                    user_name: 'User Name',
                    test_connection: 'Test Connection',
                    default_database: 'Default DB',
                    user_name_helper: 'Username are only supported in Redis 6 and later',
                    rename: 'Rename',
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
                    delete_all: '删除所有',
                    // delete_all_confirm: '删除所有历史记录？',
                    delete_all_confirm: '删除所有？',
                    export: '导出',
                    export_json: '导出 JSON',
                    export_csv: '导出 CSV',
                    db_name: '数据库名称',
                    new_query: '新建查询',
                    refresh: '刷新',
                    exec_result: '执行结果',
                    history: '历史记录',
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
                    schemas: '数据库',
                    schema_name: '数据库名',
                    sql: 'SQL',
                    status: '状态',
                    message: '信息',
                    duraion: '耗时',
                    exec_time: '耗时(毫秒)',
                    actions: '操作',
                    use: '使用',
                    content: '内容',
                    no_content: '没有内容',
                    limit: '限制',
                    no_limit: '不限制',
                    list_view: '列表视图',
                    index: '索引',
                    indexes: '索引',
                    column: '字段',
                    columns: '字段',
                    partition: '分区',
                    options: '配置',
                    connection_create: '新增连接',
                    connection_update: '编辑连接',
                    connection_export: '导出连接',
                    db_create: '新增数据库',
                    db_edit: '编辑数据库',
                    user_manager: '用户管理',
                    table: '表',
                    tables: '表',
                    table_list: '查看表',
                    table_create: '新增表',
                    comment: '注释',
                    nginx: '引擎',
                    character_set: '字符集',
                    collation: '字符编码',
                    create_time: '创建时间',
                    update_time: '更新时间',
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
                    welcome: '这里是工作台，将会放置快捷入口',
                    saved: '已保存',
                    more: '更多',
                    query: '查询',
                    partition_info: '查询分区信息',
                    folder: '文件夹',
                    expression: '表达式',
                    truncate: '清空',
                    description: '描述',
                    drop: '删除',
                    success: '成功',
                    fail: '失败',
                    unnamed: '未命名',
                    untitled: '未命名',
                    untitled_query: '未命名查询',
                    lower_case: '小写',
                    upper_case: '大写',
                    server_version: '服务器版本',
                    info: '信息',
                    copy_key_name: '复制键名',
                    copied: '已复制',
                    update: '修改',
                    num_keys: '个键',
                    db: '数据库',
                    encoding: '编码',
                    mem_size: '占用内存',
                    item_add: '新增行',
                    item_update: '编辑行',
                    insert_into: '插入到',
                    front: '最前面',
                    last: '最后面',
                    score: '分数',
                    field: '字段',
                    key_name: '键名',
                    string: '字符串',
                    list: '列表',
                    set: '集合',
                    zset: '有序集合',
                    hash: '哈希',
                    match: '匹配',
                    fuzzy: '包含',
                    command: '命令',
                    setting: '设置',
                    no_expire: '设为永不过期',
                    cancel: '取消',
                    ok: '确定',
                    unit: '单位',
                    msecond: '毫秒',
                    second: '秒',
                    minute: '分钟',
                    hour: '小时',
                    day: '天',
                    month: '月',
                    year: '年',
                    favorite_key: '收藏键',
                    favorite_keys: '我的收藏',
                    view: '查看',
                    user_name: '用户名',
                    test_connection: '测试连接',
                    default_database: '默认数据库',
                    user_name_helper: '用户名仅在 Redis 6 及之后的版本支持',
                    rename: '重命名',
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

export { i18n }

