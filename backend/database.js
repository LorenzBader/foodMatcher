require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

class Database {
    constructor() {
        const uri = process.env.DB_URL || `mongodb://${process.env.DB_USER}:${process.env.DB_PW}@localhost:27017/foodMatcherDB`

        if (!uri) {
            throw new Error('MONGODB_URI env var missing');
        }
        // Keep a modest pool size
        this.client = new MongoClient(uri, { maxPoolSize: 10 });
        this.dbName = uri.split('/').pop().split('?')[0] || 'foodMatcherDB';
        this.db = null;
        this.users = null;
        this.recipes = null;
        this.votings = null;
        this.connected = false;
    }

    async connect() {
        if (this.connected) return;
        try {
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            this.users = this.db.collection('users');
            this.recipes = this.db.collection('recipes');
            this.votings = this.db.collection('votings');
            // Ensure unique indexes for faster lookups & constraints
            await this.users.createIndex({ mail: 1 }, { unique: true });
            await this.users.createIndex({ username: 1 }, { unique: true });
            this.connected = true;
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }

    // User helpers
    async addUser(user) {
        await this.connect();
        const doc = { mail: user.mail, username: user.username, pw: user.pw, createdAt: new Date(), active: true };
        const result = await this.users.insertOne(doc);
        doc._id = result.insertedId;
        return doc;
    }

    async getUserByMail(mail) { await this.connect(); return await this.users.findOne({ mail }); }
    async getUserByUsername(username) { await this.connect(); return await this.users.findOne({ username }); }
    async getUserByMailAndPw(mail, pw) { await this.connect(); return await this.users.findOne({ mail, pw }); }
    async updateUserByMail(mail, newData) { await this.connect(); const result = await this.users.updateOne({ mail }, { $set: newData }); return result.modifiedCount; }
    async updateUserByUsername(username, newData) { await this.connect(); const result = await this.users.updateOne({ username }, { $set: newData }); return result.modifiedCount; }
    async getAllUsers() { await this.connect(); return await this.users.find({}).toArray(); }
    async getUserById(id) { await this.connect(); return await this.users.findOne({ _id: id }); }

    // Recipe helpers (unchanged logic, ensure connection)
    async getAllRecipes() { await this.connect(); return await this.recipes.find({}).toArray(); }
    async addRecipe(recipe) { await this.connect(); return await this.recipes.insertOne(recipe); }
    async deleteRecipe(id) { await this.connect(); return await this.recipes.deleteOne({ _id: id }); }
    async getRecipeByTitle(title) { await this.connect(); return await this.recipes.find({ title }).toArray(); }
    async getRecipesByContributor(username) { await this.connect(); return await this.recipes.find({ username }).toArray(); }
    async updateRecipe(title, username, newData) { await this.connect(); return await this.recipes.findOneAndUpdate({ title, username }, { $set: newData }, { returnDocument: 'after' }); }
    async getRecipeById(id) { await this.connect(); return await this.recipes.findOne({ _id: id }); }

    // Voting helpers
    async getVotingByDate(votingDate) { await this.connect(); return await this.votings.findOne({ date: votingDate }); }
    async addNewVoting(voting) { await this.connect(); return await this.votings.insertOne(voting); }
    async addUserToVoting(votingDate, user) { await this.connect(); const result = await this.votings.updateOne({ date: votingDate }, { $addToSet: { users: user } }); return result.modifiedCount; }
    async getLastVotings() { await this.connect(); const result = await this.votings.find({}).sort({ date: -1 }).limit(5).toArray(); return result; }
    async updateRecipeVoteCount(votingDate, recipeId, mean) { await this.connect(); const result = await this.votings.updateOne({ date: votingDate, 'votes.recipe': ObjectId.createFromHexString(recipeId) }, { $set: { 'votes.$.mean': mean } }); return result.modifiedCount; }
    async getVoteById(id) { await this.connect(); return await this.votings.findOne({ _id: id }); }

    async close() {
        if (this.client) {
            await this.client.close();
            this.connected = false;
            this.db = null; this.users = null; this.recipes = null; this.votings = null;
        }
    }
}

module.exports = Database;
