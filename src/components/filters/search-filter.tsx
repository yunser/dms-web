import React, { useState } from 'react';
import _ from 'lodash';
import { DatePicker, Select, Input } from 'antd';
import moment from 'moment';
import styles from './index.less';
// import { useLocation } from 'umi';
import { routerPushWithoutPageParams } from '@/utils/router';
const Search = Input.Search;

function useLocation() {
    return {
        query: {},
        pathname: window.location.pathname,
    }
}

export function SearchFilter(props) {
    const {
        searchType,
        searchKeyword,
        searchTypes,
        onChange,
        value,
        inputWidth,
    } = props;

    //console.log(props)
    const location = useLocation();

    const [_searchType, setSearchType] = useState(
        value || searchTypes[0].value,
    );
    const [_searchKeyword, setSearchKeyword] = useState(
        location.query.searchKeyword,
    );

    // const onSearch = value => //console.log(value);

    //console.log(searchTypes.find(val => val.value === _searchType))

    return (
        <div className={styles.searchBox}>
            <Select
                defaultValue={_searchType}
                style={{ width: 120 }}
                onChange={(value) => {
                    setSearchType(value);
                }}
            >
                {searchTypes.map((item, index) => {
                    return (
                        <Select.Option value={item.value} key={item.value}>
                            {item.title}
                        </Select.Option>
                    );
                })}

                {/* <Option value="lucy">Lucy</Option> */}
                {/* <Option value="disabled" disabled>
                    Disabled
                </Option> */}
                {/* <Option value="Yiminghe">yiminghe</Option> */}
            </Select>
            <Search
                className={styles.search}
                placeholder={
                    searchTypes.find((val) => val.value === _searchType)
                        ?.placeholder || '搜索'
                }
                allowClear
                // enterButton="Search"
                // size="large"
                // suffix={suffix}
                style={{ width: inputWidth || 200 }}
                value={_searchKeyword}
                onChange={(e) => {
                    //console.log('change', e.target.value);
                    setSearchKeyword(e.target.value);
                }}
                onSearch={(value) => {
                    //console.log('on search', _searchType, value);
                    onChange(_searchType, {
                        searchKeyword: value ? value.trim() : '',
                    });
                    // routerPushWithoutPageParams(location.pathname, {
                    //     [name]: _searchType,
                    //     searchKeyword: value,
                    // })
                }}
            />
        </div>
    );
}
