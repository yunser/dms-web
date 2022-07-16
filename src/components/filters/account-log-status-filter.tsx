import React, { ReactNode, useEffect, useState } from 'react';
import { SelectorFilter } from './selector-filter';

export function AccountLogStatusFilter(props) {
    return (
        <SelectorFilter
            options={[
                {
                    title: '未处理',
                    value: 0,
                },
                {
                    title: '已处理',
                    value: 1,
                },
            ]}
            {...props}
        />
    );
}
