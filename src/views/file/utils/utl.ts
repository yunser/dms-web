export const FileUtil = {

    isImage(path: string) {
        return path.endsWith('.png') 
            || path.endsWith('.jpg') 
            || path.endsWith('.svg')
            || path.endsWith('.gif')
            || path.endsWith('.webp')
            || path.endsWith('.bmp')
    }
}
