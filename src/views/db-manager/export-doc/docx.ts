import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, UnderlineType, AlignmentType, convertInchesToTwip, HeadingLevel, BorderStyle } from "docx";
import saveAs from "file-saver";

function formatValue(value) {
    if (value === null) {
        return 'NULL'
    }
    return value
}

export function exportDocx({exportTables, columns, t, dbName}) {
    const sortedTables = exportTables
        // .filter(item => item.TABLE_NAME == 'address_node')
        .sort((a, b) => {
            return a.TABLE_NAME.localeCompare(b.TABLE_NAME)
        })
    console.log('sortedTables', sortedTables)


    const contents = []

    for (let table of sortedTables) {
        if (table.TABLE_COMMENT?.includes('@deprecated')) {
            continue
        }
        const items = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: table.TABLE_NAME,
                        bold: true,
                    }),
                ],
                heading: HeadingLevel.HEADING_1,
                style: 'tableName',
            }),
        ]
        if (table.TABLE_COMMENT) {
            items.push(new Paragraph({
                children: [
                    new TextRun(table.TABLE_COMMENT),
                ],
                style: 'comment',
            }))
        }
        
        const tableColumns = columns.filter(item => item.TABLE_NAME == table.TABLE_NAME)

        const borders = {
            top: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "999999",
            },
            bottom: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "999999",
            },
            left: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "999999",
            },
            right: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "999999",
            },
        }

        const headCells = [
            t('column_name'),
            t('type'),
            t('nullable'),
            t('primary_key'),
            t('auto_increment'),
            t('default'),
            t('comment'),
        ].map(cell => {
            return new TableCell({
                children: [new Paragraph(cell)],
                borders,
            })
        })
        const rows = [
            new TableRow({
                children: headCells,
            })
        ]
        for (let column of tableColumns) {
            const cells = [
                column.COLUMN_NAME,
                column.COLUMN_TYPE,
                column.IS_NULLABLE == 'YES' ? t('yes') : t('no'),
                column.COLUMN_KEY == 'PRI' ? t('yes') : '',
                column.EXTRA == 'auto_increment' ? t('yes') : '',
                formatValue(column.COLUMN_DEFAULT),
                column.COLUMN_COMMENT,
            ].map(cell => {
                return new TableCell({
                    children: [new Paragraph(cell)],
                    borders,
                })
            })

            const row = new TableRow({
                children: cells,
            })
            rows.push(row)
        }

        const tbl = new Table({
            rows: rows,
        })
        items.push(tbl)

        items.push(new Paragraph({
            children: [
                new TextRun(''),
            ],
        }))
        items.push(new Paragraph({
            children: [
                new TextRun(''),
            ],
        }))
        
        contents.push(...items)
    }
    

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 320,
                            bottom: 320,
                            left: 320,
                            right: 320,
                        },
                    },
                },
                children: contents,
            }
        ],
        styles: {
            default: {
                // heading1: {
                //     run: {
                //         size: 28,
                //         bold: true,
                //         italics: true,
                //         color: "FF0000",
                //     },
                //     paragraph: {
                //         spacing: {
                //             after: 120,
                //         },
                //     },
                // },
                // heading2: {
                //     run: {
                //         size: 26,
                //         bold: true,
                //         underline: {
                //             type: UnderlineType.DOUBLE,
                //             color: "FF0000",
                //         },
                //     },
                //     paragraph: {
                //         spacing: {
                //             before: 240,
                //             after: 120,
                //         },
                //     },
                // },
                // listParagraph: {
                //     run: {
                //         color: "#FF0000",
                //     },
                // },
                document: {
                    // run: {
                    //     size: "11pt",
                    //     font: "Calibri",
                    // },
                    // paragraph: {
                    //     alignment: AlignmentType.RIGHT,
                    // },
                },
            },
            paragraphStyles: [
                // {
                //     id: "aside",
                //     name: "Aside",
                //     basedOn: "Normal",
                //     next: "Normal",
                //     run: {
                //         color: "999999",
                //         italics: true,
                //     },
                //     paragraph: {
                //         indent: {
                //             left: convertInchesToTwip(0.5),
                //         },
                //         spacing: {
                //             line: 276,
                //         },
                //     },
                // },
                {
                    id: 'tableName',
                    name: 'Table Name',
                    basedOn: 'Normal',
                    quickFormat: true,
                    run: {
                        size: 48,
                        bold: true,
                        color: "333333",
                    },
                    paragraph: {
                        spacing: {
                            line: 276,
                            before: 80, 
                            after: 20 * 72 * 0.05
                        },
                    },
                },
                {
                    id: 'comment',
                    name: 'Comment',
                    basedOn: 'Normal',
                    quickFormat: true,
                    run: {
                        size: 28,
                        // bold: false,
                        color: "333333",
                    },
                    paragraph: {
                        spacing: {
                            line: 276,
                            before: 20 * 72 * 0.1, 
                            after: 20 * 72 * 0.05
                        },
                    },
                },
                // {
                //     id: "strikeUnderline",
                //     name: "Strike Underline",
                //     basedOn: "Normal",
                //     quickFormat: true,
                //     run: {
                //         strike: true,
                //         underline: {
                //             type: UnderlineType.SINGLE,
                //         },
                //     },
                // },
            ],
            characterStyles: [
                // {
                //     id: "strikeUnderlineCharacter",
                //     name: "Strike Underline",
                //     basedOn: "Normal",
                //     quickFormat: true,
                //     run: {
                //         strike: true,
                //         underline: {
                //             type: UnderlineType.SINGLE,
                //         },
                //     },
                // },
            ],
        },
    })
    Packer.toBlob(doc).then((blob) => {
        saveAs(blob, `${dbName}.docx`)
    })
}