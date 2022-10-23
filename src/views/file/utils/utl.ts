function getLang(path: string) {
    if (path.endsWith('.yaml')) {
        return 'yaml'
    }
    if (path.endsWith('.html')) {
        return 'html'
    }
    if (path.endsWith('.css')) {
        return 'css'
    }
    if (path.endsWith('.js')) {
        return 'typescript'
    }
    if (path.endsWith('.ts')) {
        return 'typescript'
    }
    if (path.endsWith('.xml')) {
        return 'xml'
    }
    if (path.endsWith('.md')) {
        return 'markdown'
    }
    if (path.endsWith('.less')) {
        return 'less'
    }
    if (path.endsWith('.scss')) {
        return 'scss'
    }
    if (path.endsWith('.sql')) {
        return 'sql'
    }
    if (path.endsWith('.php')) {
        return 'php'
    }
    if (path.endsWith('.java')) {
        return 'java'
    }
    if (path.endsWith('.sh')) {
        return 'shell'
    }
    
    const isJson = path.endsWith('.json')
    return isJson ? 'json' : 'plain'
}

export const FileUtil = {

    isImage(path: string) {
        const _path = path.toLowerCase()
        return _path.endsWith('.png') 
            || _path.endsWith('.jpg') 
            || _path.endsWith('.jpeg')
            || _path.endsWith('.svg')
            || _path.endsWith('.gif')
            || _path.endsWith('.webp')
            || _path.endsWith('.bmp')
            || _path.endsWith('.ico')
            || _path.endsWith('.pic')
    },
    getLang,
}
