import React, {  } from 'react';
import styles from './file-home.module.less';
import _ from 'lodash';
import { FileList } from '../file-list'

interface File {
    name: string
}

export function FileHome({ tabKey, onClone, sourceType, webdavItem, ossItem, s3Item, config, event$, defaultPath }) {

    return (
        <div className={styles.fileLayout}>
            <div className={styles.layoutLeft}>
                <FileList
                    tabKey={tabKey}
                    config={config}
                    event$={event$}
                    sourceType={sourceType || 'local'}
                    showSide={true}
                    webdavItem={webdavItem}
                    ossItem={ossItem}
                    s3Item={s3Item}
                    defaultPath={defaultPath}
                    onClone={onClone}
                />
            </div>
            {/* <div className={styles.layoutRight}>
                <FileList
                    config={config}
                    sourceType="ssh"
                />
            </div> */}
        </div>
    )
}
