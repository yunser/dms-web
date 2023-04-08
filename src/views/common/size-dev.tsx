import React, { ReactNode, useEffect, useRef, useState } from 'react';

interface Size {
    width: number
    height: number
}

interface SizeDivProps {
    className: string
    render: (size: Size) => ReactNode
}

export function SizeDiv({ className, render }: SizeDivProps) {

    const [size, setSize] = useState<Size | null>(null)
    console.log('SizeDiv/size', size)
    const root = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (root.current) {
            const { width, height } = root.current.getBoundingClientRect()
            setSize({
                width,
                height,
            })
            // setSize()
        }
    }, [])

    return (
        <div
            className={className}
            // className={styles.test}
            ref={root}
            style={{ height: '100%' }}
        >
            {size ? render(size) : '--'}
        </div>
    )
}
