import React, {  } from 'react';
import styles from './file-home.module.less';
import _ from 'lodash';
import { FileList } from '../file-list'

interface File {
    name: string
}

export function FileHome({ tabKey, sourceType, webdavItem, ossItem, config, event$, defaultPath }) {

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
                    defaultPath={defaultPath}
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
