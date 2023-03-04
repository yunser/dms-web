import React, { useEffect, useState } from 'react'
import { AiChat } from './chat'

const host = 'https://xxx.com'

export function OpenAiApp() {
    return (
        <div>
            <AiChat
                host={host}
            />
        </div>
    )
}
