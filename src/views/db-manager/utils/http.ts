import { message } from 'antd'
import axios from 'axios'
// import {apiDomain} from '@/config'

// axios.defaults.withCredentials = true

const instance = axios.create({
    // baseURL: apiDomain
})

// export default instance

export const request = {
    async get(url, opts) {
        try {
            const res = await instance.get(url, opts)
            return res
        }
        catch (err) {
            if (opts?.noMessage !== true) {
                message.error(err.response.data.message)
            }
            return err.response
        }
    },
    async post(url, data, opts?: any) {
        try {
            const res = await instance.post(url, data, opts)
            return res
        }
        catch (err) {
            if (opts?.noMessage !== true) {
                message.error(err.response.data.message)
            }
            return err.response
        }
    }
}
