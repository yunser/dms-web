import React, { useMemo, useState } from 'react'
// import logo from './logo.svg'
// import '@yunser/style-reset/dist/index.css'
// import 'antd/dist/antd.less'
// import 'antd/dist/antd.css';
// import './App.less'
import { Button, ConfigProvider, Table } from 'antd';
import classes from './table.module.less'

export function CommonTable(props) {
    // const [count, setCount] = useState(0)

    const { columns, ...restProps } = props

    const _columns = useMemo(() => {
        const resultColumns = [
            ...columns.map((column) => {
                let render;
                if (column.render) {
                    render = column.render;
                } else {
                    const emptyText = '--';

                    render = (value, item, index) => {
                        const textCellStyle: any = {};
                        if (column?.cellStyle?.maxWidth) {
                            textCellStyle.maxWidth =
                                column?.cellStyle?.maxWidth;
                        }
                        const cellContent = (
                            <div
                                className={classes.textCell}
                                style={textCellStyle}
                            >
                                <div className={classes.text}>
                                    {value || emptyText}
                                </div>
                            </div>
                        );
                        // if (column.link) {
                        //     const {
                        //         href,
                        //         target = '_self',
                        //         to,
                        //         query,
                        //     } = column.link(value, item, index);

                        //     // if (to) {
                        //     //     return (
                        //     //         <div>
                        //     //             <Link
                        //     //                 to={`${to}?${qs.stringify(query)}`}
                        //     //             >
                        //     //                 {cellContent}
                        //     //             </Link>
                        //     //         </div>
                        //     //     );
                        //     // }

                        //     return (
                        //         <div>
                        //             <a href={href} target={target}>
                        //                 {cellContent}
                        //             </a>
                        //         </div>
                        //     );
                        // } else {
                        // }
                        return <div>{cellContent}</div>;
                    };
                }
                return {
                    ...column,
                    render,
                };
            })
        ];

        return resultColumns
    }, [columns])

    // console.log('_columns', _columns)
    return (
        <Table
            // showTotal={}
            bordered
            pagination={{
                showTotal: total => `共 ${total} 条`
            }}
            {...restProps}
            // columns={columns}
            columns={_columns}
        />
    )
}
