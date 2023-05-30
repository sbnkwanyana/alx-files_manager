import dbClient from '../utils/db'
import sha1 from 'sha1'
import redisClient from '../utils/redis'

const { ObjectID } = require('mongodb')

export default class AppController {
    static async postNew(req, res) {
        const email = req.body ? req.body.email : null
        const password = req.body ? req.body.password : null
        if (!email) {
            res.status(400).json({ error: 'Missing email' })
            return
        }
        if (!password) {
            res.status(400).json({ error: 'Missing password' })
            return
        }
        const userAlreadyExists = await dbClient.client.db().collection('users').findOne({ email })
        if (userAlreadyExists) {
            res.status(400).json({ error: 'Already exist' })
            return
        }
        const result = await dbClient.client.db().collection('users').insertOne({ email: email, password: sha1(password) })
        res.status(201).json({ id: result.insertedId, email: email })
    }
    static async getMe(req, res) {
        const token = req.headers['x-token']
        const userId = await redisClient.get(`auth_${token}`)
        const user = await dbClient.client.db().collection('users').findOne({ _id: new ObjectID(userId) })
        if (!user) {
          res.status(401).json({ error: 'Unauthorized' })
          return
        }
        res.status(200).json({ id: user._id, email: user.email })
    }
}
