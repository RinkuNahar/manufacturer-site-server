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


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }

async function run(){
    try{
        await client.connect();
        const productsCollection = client.db('manufacture-capital').collection('product');
        const ordersCollection = client.db('manufacture-capital').collection('order');
        const reviewsCollection = client.db('manufacture-capital').collection('reviews');
        const userCollection = client.db('manufacture-capital').collection('users');

        // verify Admin
        // const verifyAdmin = async(req, res, next) =>{
        //     const requester = req.decoded.email;
        //     const requesterAccount = await userCollection.findOne({email: requester});
        //     if(requesterAccount.role === 'admin'){
        //         next();
        //     }
        //     else{
        //         res.status(403).send({message: 'forbidden'});
        //     }
        // }

        // Product collection
        app.get('/purchase', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        // reviews collection
        app.get('/myReviews', async (req, res) => {
            const query = {};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });
        
        // get all users
        // app.get('/user', verifyJWT, async(req,res)=>{
        //     const users = await userCollection.find().toArray();
        //     res.send(users);
        // })
       
        // google sign in 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            //   JAWT Token
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ result, token });
        });

        // add reviews to home
        app.post('/myReviews', async(req,res)=>{
            const newReviews = req.body;
            const result = await reviewsCollection.insertOne(newReviews);
            res.send(result);
        })

        // to go from home page to purchase page for each product with product id
        app.get('/purchase/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const supply = await productsCollection.findOne(query);
            res.send(supply);
        });

        // to show data in my reviews
        app.get('/review', async (req, res) => {
            const review = req.query.review;   
              const query = { review:review.email };
              const reviews = await reviewsCollection.find(query).toArray();
              return res.send(reviews);
        });

        // to show data in my order
        app.get('/order', verifyJWT, async (req, res) => {
            const customer = req.query.customer;   
            const decodedEmail = req.decoded.email;
            if (customer === decodedEmail){
                const query = { customer:customer };
                const orders = await ordersCollection.find(query).toArray();
                return res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
              }    
        });

        // to send data to database
        app.post('/order', async(req, res)=>{
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });

        // delete my order
        app.delete('/order/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })

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
