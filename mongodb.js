// CRUD 
const { MongoClient } = require('mongodb')
const mongoose = require('mongoose');

const connectionURL = 'mongodb://127.0.0.1:27017';
const databaseName = 'task-manager';

MongoClient.connect(connectionURL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
    if (error) {
        return console.log('Unable to connect to database!');
    }

    const db = client.db(databaseName);

    db.collection('tasks').deleteOne({ description: 'feed the kitty' })
        .then(result => console.log(result))
        .then(error => console.log(error));

});