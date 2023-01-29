// class SearchHelp {

// }

interface SearchOpts {
    attributes?: string[]
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
    }
}