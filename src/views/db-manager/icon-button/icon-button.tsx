// 无依赖的图标按钮组件
import { Button, Tooltip } from 'antd'
import { ButtonProps } from 'antd/es/button'
import React, { ReactElement, useState } from 'react'
import './icon-button.less'
import classnames from 'classnames'

interface IconButtonProps extends ButtonProps {
    tooltip?: string
    children: ReactElement
}

// antd: 请确保 Tooltip 的子元素能接受 onMouseEnter、onMouseLeave、onFocus、onClick 事件
// 对 tooptip 做了优化，点击后不再提示，减少干扰
export function IconButton(props: IconButtonProps) {
    const {
        children,
        className,
        tooltip,
        ...otherProps
    } = props

    const [tooltipEnable, setTooltipEnable] = useState(true)
    const childrenProps = children.props as ButtonProps
    const { onMouseLeave, onClick } = childrenProps
    const NewElem = React.cloneElement(children,
        {
            ...children.props,
            onClick(e: React.MouseEvent<HTMLElement>) {
                setTooltipEnable(false)
                onClick && onClick(e)
            },
            onMouseLeave(e: React.MouseEvent<HTMLElement>) {
                onMouseLeave && onMouseLeave(e)
                if (!tooltipEnable) {
                    setTooltipEnable(true)
                }
            },
        },
        children.props.children
    )

    const content = (
        <Button
            onMouseEnter={() => {}}
            className={classnames(className, 'ant-icon-button')}
            {...otherProps}
        >
            {NewElem}
        </Button>
    )
    if (tooltip && tooltipEnable) {
        return (
            <Tooltip
                title={tooltip}
                mouseEnterDelay={1}>
                {content}
            </Tooltip>
        )
    }
    return content
}
