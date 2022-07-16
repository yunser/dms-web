import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import {
    Select,
    Dropdown,
    Menu,
    Input,
    Skeleton,
    Tree,
    message,
    Modal,
    Form,
} from 'antd';

const FormItem = Form.Item;

const { confirm } = Modal;

export function SelectorFilter(props) {
    const { options, onChange, allText = '全部', ...restProps } = props;

    return (
        <Select
            onChange={(obj) => {
                // //console.log('change', file, fileList)
                // const {file, fileList } = obj
                onChange && onChange(obj);
                // setFileList([file])
            }}
            // fileList={fileList}
            // showUploadList={true}
            style={{ width: 120 }}
            allowClear
            {...restProps}
        >
            {[{ title: allText, value: '' }, ...options].map((val) => {
                return (
                    <Select.Option key={val.value} value={'' + val.value}>
                        {/*<div style={{ color: val.title === '全部' ? '#ccc' : '#333'}}>{val.title}</div>*/}
                        <div
                            style={{
                                color: val.title === '全部' ? '#999' : '#333',
                            }}
                        >
                            {val.title || val.label}
                        </div>
                    </Select.Option>
                );
            })}
        </Select>
    );
}
