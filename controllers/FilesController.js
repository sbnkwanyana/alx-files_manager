import dbClient from '../utils/db'
import redisClient from '../utils/redis'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs, existsSync } from 'fs';

const { ObjectID } = require('mongodb')

export default class AuthController {
    static async postUpload(req, res) {
        const token = req.headers['x-token']
        const userId = await redisClient.get(`auth_${token}`)
        const user = await dbClient.client.db().collection('users').findOne({ _id: new ObjectID(userId) })
        if (!user) {
          res.status(401).json({ error: 'Unauthorized' })
          return
        }
        const name = req.body ? req.body.name : null
        const type = req.body ? req.body.type : null
        const parentId = req.body && req.body.parentId ? req.body.parentId : 0
        const isPublic = req.body && req.body.isPublic ? req.body.isPublic : false
        const data = req.body && req.body.data ? req.body.data : null
        if (!name) {
            res.status(400).json({ error: 'Missing name' })
            return
        }
        if (!type || !['folder', 'file', 'image'].includes(type)) {
            res.status(400).json({ error: 'Missing type' })
            return
        }
        if (!data && type !== 'folder') {
            res.status(400).json({ error: 'Missing data' })
            return
        }
        if (parentId !== 0) {
            const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectID(parentId), userId: userId})
            if (!file)
            {
                res.status(400).json({ error: "Parent not found" })
                return
            }
            if (file.type !== 'folder')
            {
                res.status(400).json({ error: "Parent is not a folder" })
                return
            }
        }
        if (type === 'folder') {
            const result = await dbClient.client.db().collection('files').insertOne({ userId, name, type, parentId, isPublic })
            if (result) {
                res.status(201).json({ id: result.insertedId, userId, name, type, isPublic, parentId})
                return
            }
        }
        else {
            const directory = (process.env.FOLDER_PATH || '/tmp/files_manager')
            const localPath = `${directory}/${uuidv4()}`
            const buffer = Buffer.from(data, 'base64')
            try {
                try {
                    if (!existsSync(directory)) {
                        await fs.mkdir(directory)
                    }
                }
                catch (error) {
                    return
                }
                await fs.writeFile(localPath, buffer, 'utf-8')
            }
            catch (error) {
                return
            }
            const result = await dbClient.client.db().collection('files').insertOne({ userId, name, type, isPublic, parentId, localPath })
            if (result) {
                res.status(201).json({ id: result.insertedId, userId, name, type, isPublic, parentId })
                return
            }
        }
    }
}
