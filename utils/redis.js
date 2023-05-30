import { createClient } from 'redis'
import { promisify } from 'util'

class RedisClient {
    constructor() {
        this.client = createClient()
        this.isConnectionActive = true
        this.client.on('error', (error) => {
            console.log(error)
            this.isConnectionActive = false
        })
        this.client.on('connect', () => {
            this.isConnectionActive = true
        })
    }

    isAlive() {
        return this.isConnectionActive
    }

    async get(key) {
       return await promisify(this.client.GET).bind(this.client)(key)
    }

    async set(key, value, duration) {
        return await promisify(this.client.SETEX).bind(this.client)(key, duration, value)
    }

    async del(key) {
        return await promisify(this.client.DEL).bind(this.client)(key)
    }
}

const redisClient = new RedisClient()
module.exports = redisClient
