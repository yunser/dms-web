import React, { useEffect, useMemo, useRef, useState } from 'react'
// import './global.css'
// import './iconfont.css'
import { DeleteOutlined } from '@ant-design/icons';
import styles from './chat.module.less'
import { Button, Input, message, Popover, Space } from 'antd';
import axios from 'axios'
import classNames from 'classnames';
import { uid } from 'uid'

export function AiChat({ host }) {
    const chatBoxRef = useRef(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [userInput, setUserInput] = useState('')
    // const [userInput, setUserInput] = useState('帮我写一篇面包打折的超市公告，50字左右')
    // const [userInput, setUserInput] = useState('帮我写一篇文章，500字左右')
    // const [userInput, setUserInput] = useState('你是谁？')
    const listRef = useRef([
        {
            id: '0',
            "role": "system",
            content: '你好，我是 ChatGPT 3.5 AI，你可以问我一些问题',
        },
        // {
        //     "role": "user",
        //     "content": "广州的人口多少？"
        // },
        // {
        //     "role": "assistant",
        //     "content": "截至2021年，广州的人口约为1500万。"
        // },
        // {
        //     "role": "assistant",
        //     content: "\n §§ --- JavaScript/print-123.js\n §§ 1000\n+console.log(123);\n",
        // },
        // {
        //     id: '0',
        //     content: '你好，我是 ChatGPT，你可以问我一些问题',
        // },
    ])
    const templates = [
        {
            id: '1',
            content: '为以下文章生成10个微信公众号文章标题，要求最大程度地吸引人点击，而且长度不超30字。\n (在这里补充文章内容)'
        },
        {
            id: '2',
            content: '帮我写一篇手机评测的文章，第一段介绍红米K40，第二段对比一下苹果12'
        },
        {
            id: '3',
            content: '帮我写个网页，使用 React 和 antd 开发。有一个按钮，点击弹窗，弹窗里面可以输入出生年月，计算出年龄'
        },
    ]
    const [list, setList] = useState(listRef.current)
    // const totalToken = useMemo(() => {
    //     const allText = userInput
    //     return allText.length
    // }, [userInput])

    function listAdd(item) {
        listRef.current.push({
            ...item,
            id: uid(32),
        })
        setList([...listRef.current])
        // setList([
        //     ...list,
        //     {
        //         ...item,
        //         id: uid(32),
        //     }
        // ])
        setTimeout(() => {
            scrollToBottom()
        }, 10)
    }

    function removeItem(index) {
        listRef.current.splice(index, 1)
        setList([...listRef.current])
    }
  
    const handleChange = (e) => {
        setUserInput(e.target.value);
    }

    function newChat() {
        listRef.current = []
        setList([...listRef.current])
        setUserInput('')
    }

    function scrollToBottom() {
        const chatBox = chatBoxRef.current
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight
        }
    }

    async function send() {
        if (!userInput) {
            message.error('请输入内容')
            return
        }
        setError('')
        listAdd({
            "role": "user",
            content: userInput,
        })
        
        // return
        setLoading(true)
        try {
            console.log('发送', )
            const messages = listRef.current.filter(item => item.id != 0).map(item => {
                return {
                    role: item.role,
                    content: item.content,
                }
            })
            console.log('messages', messages)
            // return
            const res = await axios.post(`${host}/openApi/chatNew`, {
                model: 'gpt-3.5-turbo',
                // content: userInput,
                // max_tokens: 50,
                messages,
            })
            setLoading(false)
            console.log('res', res.status, res.data)
            // setResponse(res.data.choices[0].text);
            listAdd(res.data.choices[0].message)
            setUserInput('')
        }
        catch (err) {
            console.log('err', err)
            console.log('err.response', err.response)
            const data = (err.response?.data) ? err.response.data : {}
            setLoading(false)
            let message = data?.message || data?.error?.message || '抱歉，系统繁忙，请稍后再试'
            // listAdd({
            //     content: message,
            // })
            setError(message)
        }
    }
        
    return (
        <div className={styles.container}>
            <div className={styles.chatBox} ref={chatBoxRef}>
                <div className={styles.list}>
                    {list.map((item, index) => {
                        return (
                            <div className={styles.item}
                                key={item.id}
                            >
                                {item.role == 'user' ?
                                    <div className={classNames(styles.avatar, styles.mine)}>{item.role == 'user' ? '我' : 'AI'}</div>
                                :
                                    <div className={classNames(styles.avatar, styles.ai)}>{item.role == 'user' ? '我' : 'AI'}</div>
                                }
                                <div 
                                    className={classNames(styles.content, item.role == 'user' ? styles.mine : styles.ai)}
                                    dangerouslySetInnerHTML={{
                                        __html: item.content.trim().replace(/\n/g, '<br />'),
                                    }}
                                    onClick={() => {
                                        setUserInput(item.content)
                                    }}
                                >
                                    {/* {item.content} */}
                                </div>
                                <Button
                                    className={styles.deleteIcon}
                                    onClick={() => {
                                        removeItem(index)
                                    }}
                                >
                                    <DeleteOutlined />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </div>
            {!!error &&
                <div className={styles.errorBox}>
                    {error}
                </div>
            }
            <div className={styles.sendBox}>
                <Input.TextArea
                    placeholder="可以问我一些问题（建议 1000 字内）"
                    value={userInput}
                    onChange={handleChange}
                    rows={4}
                    showCount
                    // maxLength={100}
                    
                />
                {/* <div className={styles.statBox}>总计约 {totalToken} tokens</div> */}
                <div className={styles.tool}>
                    <Space>
                        <Button
                            onClick={() => {
                                newChat()
                            }}
                            disabled={!(list.length > 0)}
                        >
                            新的对话
                        </Button>
                        {/* <Popover
                            title="常用示例"
                            content={
                                <div className={styles.templates}>
                                    {templates.map((item, index) => {
                                        return (
                                            <div
                                                className={styles.item}
                                                key={index}
                                                onClick={() => {
                                                    setUserInput(item.content)
                                                }}
                                            >
                                                {item.content}
                                            </div>
                                        )
                                    })}
                                </div>
                            }
                        >
                            <Button>
                                ?
                            </Button>

                        </Popover> */}
                        <Popover
                            title="介绍"
                            content={
                                <div className={styles.templates}>
                                    <div>本工具由 ChatGPT 3.5 提供 AI 支持，阿里云函数提供代理服务。</div>
                                    <div>每次发送，历史对话都会提交到服务器，因 API 限制，历史对话加起来总文本数不能超过 4000 tokens。</div>
                                    <div>支持开启新的对话，或者手动删除某几条对话内容。</div>
                                </div>
                            }
                        >
                            <Button>
                                ?
                            </Button>

                        </Popover>
                        
                        {/* <Link>
                        </Link> */}
                        {/* <a
                            onClick={() => {
                                window.location = '/article'
                            }}
                        >文章版</a> */}
                    </Space>
                    <Button
                        loading={loading}
                        type="primary"
                        onClick={() => {
                            send()
                        }}
                    >发送</Button>
                </div>
            </div>
            {/* <div>
                <form onSubmit={handleSubmit}>
                    <input type="text" value={userInput} onChange={handleChange} />
                </form>
            </div> */}
            {/* <p>{response}</p> */}
            

        </div>
    )
}
