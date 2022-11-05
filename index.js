const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v8einb9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("Database connected");
  } catch (error) {
    console.log(error.name, error.message);
  }
}
run();

const serviceCollection = client.db("GeniusBike").collection("services"); 
const ordersCollection = client.db("GeniusBike").collection("orders"); 

app.get("/", (req, res) => {
  res.send("Hello from MongoDB");
});

//verifyJwt MiddleWare
function verifyJwt (req, res, next) {
  const userJwtToken = req.headers.authorization;
  if (!userJwtToken){
    return res.status(401).send({
      success: false,
      message: 'Unauthorized access' 
    })
  }
  const token = userJwtToken.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded){
    if(err) {
      return res.status(401).send({
        success: false,
        message: 'Forbidden access' 
      })
    }
    req.decoded = decoded;
    next();
  })
}

// get all services
app.get("/services", async (req, res) => {
  try {
    const cursor = serviceCollection.find({});
    const services = await cursor.toArray();
    res.send({
        success: true,
        message: 'Successfully got the data',
        data: services
    })
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.get('/services/:id', async (req, res) => {
    try{
        const id = req.params.id;
        const cursor = await serviceCollection.findOne({_id: ObjectId(id)})
        res.send({
            success: true,
            message: 'Successfully got the data',
            data: cursor
        })
    } catch (error) {
        console.log(error.name, error.message);
        res.send({
        success: false,
        error: error.message,
        });
    }
})

app.post('/orders', verifyJwt, async (req, res) => {
    try{
        const order = req.body;
        const result = await ordersCollection.insertOne(order);
        res.send({
            success: true,
            message: 'Order Placed Successfully'
        })
    }
    catch(error) {
        console.log(error.name, error.message);
        res.send({
        success: false,
        error: error.message,
        })
    }

})

app.get('/orders', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const cursor = ordersCollection.find({email:req.query?.email});
    const orders = await cursor.toArray();
    res.send({
      success: true,
      message: 'Orders Found Successfully',
      data: orders
    })
  }
  catch (error) {
    console.log(error.name, error.message);
        res.send({
        success: false,
        error: error.message,
        })
  }
})

app.delete('/orders/:id', verifyJwt, async (req, res)=> {
  try{
      const id = req.params.id;
      const result = await ordersCollection.deleteOne({_id: ObjectId(id)});
      if (result.deletedCount) {
        res.send({
          success: true,
          message: "Successfully deleted",
          data: result 
        })
      }
  }
  catch(error){
    console.log(error.name, error.message);
        res.send({
        success: false,
        error: error.message,
        })
  }
})

app.patch('/orders/:id', verifyJwt, async (req, res) => {
  try{
    const id = req.params.id;
    const status = req.body.status;
    const result = await ordersCollection.updateOne({_id:ObjectId(id)}, {$set:{status}});
    if(result.modifiedCount){
      res.send({
        success: true,
        message: "Successfully Updated",
        data: result 
      })
    }
  }
  catch (error) {
    console.log(error.message);
    res.send({
      success: false,
      error: error.message,
      })
  }
})

app.post('/jwt', async (req, res) => {
  try{
    const user = req.body; 
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
    res.send({token});
  }
  catch (error) {
    console.log(error.message);
    res.send({
      success: false,
      error: error.message,
      })
  }
})

app.listen(port, () => console.log(`listening to port ${port}`));
