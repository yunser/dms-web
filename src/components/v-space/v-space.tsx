import { Popover } from 'antd'
import React, { useMemo, useState, useEffect, useRef } from 'react'
import { SketchPicker } from 'react-color'
import classes from './color-picker.module.less'

interface VSpacerProps {
    size?: number
}

export function VSplit(props: VSpacerProps) {
    const { size = 16 } = props
    return (
        <div
            ui-v-space={size}
            style={{
                height: size,
            }}
        ></div>
    )
}
