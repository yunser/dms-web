export function getGlobalConfig() {
    let host = `${location.protocol}//${location.host}`
    console.log('host', host)
    if (location.host == 'localhost:12306') {
        host = 'http://localhost:10086'
    }
    return {
        host,
    }
}
