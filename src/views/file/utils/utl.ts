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
        return path.endsWith('.png') 
            || path.endsWith('.jpg') 
            || path.endsWith('.svg')
            || path.endsWith('.gif')
            || path.endsWith('.webp')
            || path.endsWith('.bmp')
            || path.endsWith('.ico')
    },
    getLang,
}
