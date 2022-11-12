import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './commit-item.module.less';
import _, { cloneDeep } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';

export function CommitItem({ commit }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    return (
        <div className={styles.item}>
            <div className={styles.msg}>{commit.message}</div>
            <div className={styles.hash}>{commit.hash}</div>
        </div>
    )
}
