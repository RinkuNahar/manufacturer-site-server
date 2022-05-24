const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.x29pt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productsCollection = client.db('manufacture-capital').collection('product');
        const ordersCollection = client.db('manufacture-capital').collection('order');

        // Product collection
        app.get('/purchase', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        // to go from home page to purchase page for each product with product id
        app.get('/purchase/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const supply = await productsCollection.findOne(query);
            res.send(supply);
        });

        // to show data in my order
        app.get('/order', async (req, res) => {
            const customer = req.query.customer;   
              const query = { customer:customer };
              const orders = await ordersCollection.find(query).toArray();
              return res.send(orders);
            
        });

        // to send data to database
        app.post('/order', async(req, res)=>{
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });


    }
    finally{

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running  Manufacture Capital');
});

app.listen(port, () => {
    console.log('backend working', port);
});
