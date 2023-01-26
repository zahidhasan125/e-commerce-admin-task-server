const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8082;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

require('dotenv').config();
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.voxvdqi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        const cartCollection = client.db('eShopTask').collection('cartCollection')
        const usersCollection = client.db('eShopTask').collection('usersCollection')
        const productsCollection = client.db('eShopTask').collection('productsCollection')

        app.get('/products', async (req, res) => {
            const products = await productsCollection.find({}).toArray();
            res.send(products);
        })

        app.get('/cart', async (req, res) => {
            const email = req.query.email;
            const query = { customer: email };
            const cartItems = await cartCollection.find(query).toArray();
            res.send(cartItems);
        })
        app.post('/add-to-cart', async (req, res) => {
            const item = req.body;
            const result = await cartCollection.insertOne(item);
            res.send(result);
        })
        app.delete('/cart', async (req, res) => {
            const itemId = req.query.id;
            const query = { _id: ObjectId(itemId) };
            const result = await cartCollection.deleteOne(query);
            res.send(result)
        })

        app.post('/signup', async (req, res) => {
            const userData = req.body;
            const userEmail = userData.email;
            const query= { email: userEmail}
            const userExist = await usersCollection.findOne(query);
            if (!userExist) {
                const result = await usersCollection.insertOne(userData);
                res.send(result);
            }
        })

        app.get('/orders', async (req, res) => {
            const query = {};
            const orders = await cartCollection.find(query).toArray();
            res.send(orders)
        })

    }
    finally {

    }
}

run();

app.get('/', (req, res) => {
    res.send('Server Running');
});

app.listen(port, () => {
    console.log('Listening on: ' + port);
})