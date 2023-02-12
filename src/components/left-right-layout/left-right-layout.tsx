import React, { useMemo, useState, useEffect, useRef, ReactNode } from 'react'
import styles from './left-right-layout.module.less'

interface VSpacerProps {
    children: ReactNode
}

export function LeftRightLayout(props: VSpacerProps) {
    const { children } = props
    return (
        <div
            className={styles.leftRightLayout}
        >
            {children}
        </div>
    )
}
