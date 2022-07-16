import { Popover } from 'antd'
import React, { useMemo, useState, useEffect, useRef } from 'react'
import { SketchPicker } from 'react-color'
import classes from './color-picker.module.less'

export function ColorPicker({ value, onChange }) {
    return (
        <div
            style={{
                // width: 24,
                // height: 24,
                // backgroundColor: value,
            }}
        >
            <Popover
                content={(
                    <SketchPicker
                        color={value}
                        onChange={color => {
                            onChange && onChange(color)
                        }}
                    />
                )} 
                // title="Title" 
                trigger="click"
            >
                <div 
                    className={classes.view}
                    style={{
                        backgroundColor: value,
                    }}
                ></div>
            </Popover>
        </div>
    )
}