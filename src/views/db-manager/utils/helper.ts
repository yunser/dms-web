function toArray(obj) {
    return Array.isArray(obj) ? obj : [obj]
}

export function _if(condition, obj, elseObj) {
    return condition ? toArray(obj) : (elseObj || [])
}