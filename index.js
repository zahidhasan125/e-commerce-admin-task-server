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

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized!');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send('Forbidden');
        }
        req.decoded = decoded;
        next();
    })
}

const run = async () => {
    try {
        const cartCollection = client.db('eShopTask').collection('cartCollection')
        const usersCollection = client.db('eShopTask').collection('usersCollection')
        const productsCollection = client.db('eShopTask').collection('productsCollection')

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const userExist = await usersCollection.findOne(query);
            if (userExist) {
                const token = jwt.sign({ email }, process.env.TOKEN_SECRET, { expiresIn: '7 days' });
                return res.send({ accessToken: token })
            }
            res.status(401).send({ accessToken: '' });
        })

        app.get('/products', async (req, res) => {
            const products = await productsCollection.find({}).toArray();
            res.send(products);
        })

        app.get('/cart', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { customer: email };
            const cartItems = await cartCollection.find(query).toArray();
            res.send(cartItems);
        })
        app.patch('/add-to-cart', verifyJWT, async (req, res) => {
            const item = req.body;
            const query = { _id: item._id };
            const itemExits = await cartCollection.findOne(query);
            const option = { upsert: true };
            if (itemExits === null) {
                const result = await cartCollection.insertOne(item);
                res.send(result);
            }
            else {
                const updateDoc = {
                    $set: { quantity: item.quantity + itemExits.quantity, totalPrice: item.totalPrice + itemExits.totalPrice }
                }
                const result = await cartCollection.updateOne(query, updateDoc, option);
                res.send(result)
            }
        })
        app.delete('/cart', verifyJWT, async (req, res) => {
            const itemId = req.query.id;
            const query = { _id: itemId };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })

        app.post('/signup', async (req, res) => {
            const userData = req.body;
            const userEmail = userData.email;
            const query = { email: userEmail }
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
        app.delete('/orders', verifyJWT, async (req, res) => {
            const itemId = req.query.id;
            const query = { _id: ObjectId(itemId) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
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