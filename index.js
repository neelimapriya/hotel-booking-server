const express = require('express');
const cors = require('cors');
const app =express()
require('dotenv').config();
const port =process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

// hotelBooking
// Yk1377DDUCZpUKh5
console.log(process.env.HB_USER)
console.log(process.env.HB_PASS)

const { MongoClient, ServerApiVersion } = require('mongodb');
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