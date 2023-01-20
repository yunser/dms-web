import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Spin, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './full-center-box.module.less';
import _ from 'lodash';

export function FullCenterBox(props) {
    const { children, height } = props
    return (
        <div
            className={styles.fullCenterBox}
            style={{
                // width: '100%',
                // height: '100%',
                height,
            }}
        >
            {children}
        </div>
    )
}
