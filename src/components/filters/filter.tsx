import React, { ReactNode, useEffect, useState } from 'react';
// import { Table } from 'antd'
import styles from './filter.less';
import { DatePicker, Select } from 'antd';
import {
    ForkOutlined,
    MoreOutlined,
    DownOutlined,
    UpOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { routerPushWithoutPageParams } from '@/utils/router';
// import { useLocation } from 'umi';
import classnames from 'classnames';

function useLocation() {
    return {
        query: {},
        pathname: window.location.pathname,
    }
}

const { Option } = Select;

interface Filter {
    type: string;
    name: string;
    title: string;
    options?: SelectOption[];
    defaultValue?: string;
}

interface SelectOption {
    title: string;
    value: string;
}

interface CommonTableProps {
    // locationQuery: object;
    filters: Filter[];
    onChange?: (data: object) => void;
    children?: JSX.Element | null;
}

const { RangePicker } = DatePicker;

// const { RangePicker } = TimePicker

interface FilterProps {
    children?: ReactNode;
    showCollapse?: boolean | undefined;
}

export function Filter(props: FilterProps) {
    const {
        filters,
        onChange,
        customQuery,
        customOnChange,
        children,
        defaultCollapsed = true,
        showCollapse = false,
    } = props;
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    const location = useLocation();

    const locationQuery = customQuery || location.query;

    let _children;
    if (Array.isArray(children)) {
        _children = children;
    } else {
        _children = [children];
    }
    _children = _children
        .filter((item) => React.isValidElement(item))
        .map((item, index) => {
            // //console.log('item', item)
            return React.cloneElement(
                item,
                {
                    key: index,
                    ...item.props,
                    customOnChange,
                },
                item.props.children,
            );
        });

    return (
        <div className={styles.wrap}>
            <div
                className={classnames(
                    styles.filter,
                    collapsed ? styles.collapsed : '',
                )}
                id={'view-filter'}
            >
                {/* {filters.map((filter) => FilterItem(filter, locationQuery, onChange, props))} */}
                {_children.map((item) => item)}
            </div>
            {showCollapse && (
                <div
                    className={styles.collapseCntr}
                    onClick={() => {
                        // onCollapse
                        setCollapsed(!collapsed);
                    }}
                >
                    {collapsed ? (
                        <a>
                            展开 <DownOutlined />
                        </a>
                    ) : (
                        <a>
                            收起
                            <UpOutlined />
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

interface FilterItemProps {
    label: string;
    name?: string;
    children: ReactNode;
    style?: object;
}

function Item(props: FilterItemProps) {
    const { label, name, children, style, customOnChange } = props;
    // label="在线状态"
    const location = useLocation();

    const locationQuery = location.query;

    const NewElem = React.cloneElement(
        children,
        {
            value: locationQuery[name] || '',
            // loading: loading,
            // disabled: item ? item.receiveStatus : loading,
            onChange(e, elseObj = {}) {
                //console.log('item change', e, elseObj)
                // setModelVisible(true)
                //console.log(name)
                //console.log({
                //     [name]: e,
                //     ...elseObj
                // })
                if (customOnChange) {
                    customOnChange({
                        [name]: e,
                        ...elseObj,
                    });
                } else {
                    routerPushWithoutPageParams(locationQuery, {
                        [name]: e,
                        ...elseObj,
                    });
                }
                // customOnChange()
            },
            ...children.props,
        },
        children.props.children,
    );

    return (
        <div className={styles.item} key={name} style={style}>
            {label && <div className={styles.title}>{label}：</div>}
            {NewElem}
        </div>
    );
}

Filter.Item = Item;

function getToday() {
    return [moment().startOf('day'), moment().endOf('day')];
}
