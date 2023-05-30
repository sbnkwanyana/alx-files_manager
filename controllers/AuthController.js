import dbClient from '../utils/db'
import redisClient from '../utils/redis'
import { v4 as uuidv4 } from 'uuid'
import sha1 from 'sha1'

const { ObjectID } = require('mongodb')

export default class AuthController {
    static async getConnect(req, res) {
        const authorizationHeader = req.headers.authorization;
        const decodedCredentials = Buffer.from(authorizationHeader.split(' ')[1], 'base64').toString('utf-8')
        const [email, password] = decodedCredentials.split(':')
        const user = await dbClient.client.db().collection('users').findOne({ email })
        if (!user) {
           res.status(401).json({ error: 'Unauthorized' })
           return
        }
        if (user.password === sha1(password)) {
          const token = uuidv4()
          await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60)
          res.status(200).json({ token })
        }
        else {
          res.status(401).json({ error: 'Unauthorized' })
        }
    }

    static async getDisconnect(req, res) {
        const token = req.headers['x-token']
        const userId = await redisClient.get(`auth_${token}`)
        const user = dbClient.client.db().collection('users').findOne({ _id: new ObjectID(userId) })
        if (!user) {
          res.status(401).json({ error: 'Unauthorized' })
          return
        }
        await redisClient.del(`auth_${token}`)
        res.status(204).send()
    }
}
