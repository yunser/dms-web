function isNumSame(num1, num2) {
    console.log('--', num1 - num2)
    return Math.abs(num1 - num2) < 0.000000001
}

function isPointSame(pt, pt2) {
    console.log('same', isNumSame(pt.x, pt2.x))
    return isNumSame(pt.x, pt2.x) && isNumSame(pt.y, pt2.y)
}

export const DesignUtil = {
    isNumSame,
    isPointSame,
}
