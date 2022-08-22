
import { Button } from 'antd'
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
        ...otherProps
    } = props
    return (
        <Button
            className={classnames(className, 'ant-icon-button')}
            // shape="circle"
            {...otherProps}
            // onClick={onClick}
            // onFocus={onFocus}
        >
            {children}
        </Button>
        // <div>
        // </div>
    )
}
