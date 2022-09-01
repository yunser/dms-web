
import { Button, Tooltip } from 'antd'
import { ButtonProps } from 'antd/es/button'
import React from 'react'
// import styles from './icon-button.less'
import './icon-button.less'
import classnames from 'classnames'

interface IconButtonProps {
    
}
// interface Props extends React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLElement>> {
interface Props extends ButtonProps {
    // onClick?: React.MouseEventHandler<HTMLElement>
    // children?: React.ReactNode
    // onFocus?: React.FocusEventHandler | undefined
    // onMouseEnter?: React.MouseEventHandler | undefined,
    // onMouseLeave?: React.MouseEventHandler | undefined,
}

// 请确保 Tooltip 的子元素能接受 onMouseEnter、onMouseLeave、onFocus、onClick 事件
export function IconButton(props: Props) {
    const {
        children,
        className,
        tooltip,
        ...otherProps
    } = props

    const content = (
        <Button
            className={classnames(className, 'ant-icon-button')}
            // shape="circle"
            {...otherProps}
            // onClick={onClick}
            // onFocus={onFocus}
        >
            {children}
        </Button>
    )
    if (tooltip) {
        return (
            <Tooltip title={tooltip} mouseEnterDelay={1}>
                {content}
            </Tooltip>
        )
    }
    return content
}
