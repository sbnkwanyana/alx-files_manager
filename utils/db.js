import {MongoClient } from 'mongodb'

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost'
        const port = process.env.DBPORT || 27017
        const database = process.env.DB_DATABASE || 'files_manager'
        this.client = new MongoClient(`mongodb://${host}:${port}/${database}`, { useUnifiedTopology: true })
        this.client.connect()
    }

    isAlive() {
        return this.client.isConnected()
    }

    async nbUsers() {
        return this.client.db().collection('users').countDocuments()
    }

    async nbFiles() {
        return this.client.db().collection('files').countDocuments()
    }
}

const dbClient = new DBClient()
module.exports = dbClient
