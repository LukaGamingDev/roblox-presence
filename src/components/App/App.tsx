import React, { useState, useEffect } from 'react'
import classNames from 'classnames'

import './App.css'

declare global {
    interface Window {
        ipc: {
            establishConnectionToBackground: (onMessage: (ev: MessageEvent) => unknown) => void
        }
    }
}

const getAvatar = (userID: string) => (
    `https://www.roblox.com/headshot-thumbnail/image?userId=${userID}&width=420&height=420&format=png`
)

export const App: React.FC = () => {
    const [data, setData] = useState(null)

    useEffect(() => {
        window.ipc.establishConnectionToBackground((msg) => {
            setData(msg)
            console.log(msg)
        })
    }, [])

    const gradient = !data

    return (
        <div className='app'>
            <div className='app__info'>
                <div className='userinfo'>
                    <img
                        alt=""
                        src={data ? getAvatar(data.user.id) : ''}
                        className={classNames('userinfo__avatar', { gradient })}
                    />
                    <div className={classNames('userinfo__username', { gradient })}>
                        {data?.user.name}
                    </div>
                    <div className={classNames('userinfo__status', { gradient })}>
                        {
                            data && (data.activity ? (
                                <><div>{data.activity.details}</div><div>{data.activity.state}</div></>
                            ) : (
                                <div>Offline</div>
                            ))
                        }
                    </div>
                </div>
            </div>
            <pre>
                {JSON.stringify(data, null, 4)}
            </pre>
        </div>
    )
}
