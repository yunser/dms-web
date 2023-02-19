// class SearchHelp {

// }

interface SearchOpts {
    attributes?: string[]
}

function isInclude(text: string, subText: string) {
    // console.log('isInclude', text, subText)
    // let subIdx = 0
    // for (let idx = 0; idx < text.length; idx++) {
    //     const char = text.charAt(idx)
    //     if (text.charAt(idx) == subText.charAt(subIdx)) {
    //         subIdx++
    //     }
    // }
    // console.log('isInclude/subIdx', subIdx)
    // return subIdx == subText.length
    const keywords = subText.trim().split(/\s+/)
    for (let keyword of keywords) {
        if (!text.toLowerCase().includes(keyword.toLowerCase())) {
            return false
        }
    }
    return true
}

export const SearchUtil = {

    search(list: any[], keyword: string, opts: SearchOpts = {}) {
        const { attributes = [] } = opts
        if (!keyword) {
            return list
        }
        const lKw = keyword.toLowerCase()
        return list.filter(item => {
            for (let attr of attributes) {
                if (('' + item[attr]).includes(lKw)) {
                    return true
                }
            }
            return false
        })
    },

    searchLike(list: any[], keyword: string, opts: SearchOpts = {}) {
        const { attributes = [] } = opts
        if (!keyword) {
            return list
        }
        const lKw = keyword.toLowerCase()
        return list.filter(item => {
            for (let attr of attributes) {
                if (isInclude('' + item[attr], lKw)) {
                    return true
                }
            }
            return false
        })
    },
}