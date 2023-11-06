const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const app =express()
require('dotenv').config();
const port =process.env.PORT || 5000;


const secret ='secrettoken'
// middleware
app.use(cors())
app.use(express.json())
app.use(cookieParser());



// console.log(process.env.HB_USER)
// console.log(process.env.HB_PASS)


const uri = `mongodb+srv://${process.env.HB_USER}:${process.env.HB_PASS}@cluster0.dtfuxds.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const RoomCollection =client.db('RoomDB').collection('room')
    const bookingCollection =client.db('RoomDB').collection('bookings')


    // verify token
    const gateToken=(req,res,next)=>{
      const {token}= req?.cookies;

      if(!token){
        return res.status(401).send({message: 'unauthorized'})
      }

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err,decoded){
        if(err){
          return res.status(401).send({message: 'unauthorized'})
        }
      })
      console.log(decoded)
      req.user=decoded;
      next()
    }
    // hotel room function
    // http://localhost:5000/room?sortField=price&sortOrder=desc
    app.get('/api/v1/room',gateToken , async(req,res)=>{
      // let queryObj={}
      // let sortObj={}

      // // const room =req.query.category
      // const sortField =req.query.sortField;
      // const sortOrder=req.query.sortOrder;

      // if(sortField && sortOrder){
      //   sortObj[sortField]=sortOrder
      // }
        const cursor=RoomCollection.find()
        const result =await cursor.toArray()
        res.send(result)
    })

    // booking
    app.post('/api/v1/user/create-bookings',async(req,res)=>{
      const booking=req.body;
      const result =await bookingCollection.insertOne(booking)
      res.send(result)
    })

    app.delete('/api/v1/user/cancel-bookings/:bookingId',async(req,res)=>{
      const id=req.params.bookingId
      const query={_id:new ObjectId(id)}
      const result=await bookingCollection.deleteOne(query)

      res.send(result)
    })

    // create token
    app.post('/api/v1/auth/access-token', (req,res)=>{
      const user=req.body;
      const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      })
      console.log(token)
      // res.send(token)
      res.cookie('token',token,{
        httpOnly: true,
        secure: false,
        sameSite:'none'
      }).send({success:true})
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('hotel server is running')
})
app.listen(port, ()=>{
    console.log(`hotel server is running on ${port}`)
})