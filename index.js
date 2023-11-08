const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

const secret = "secrettoken";
// middleware
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      'https://hotel-6de04.web.app',
      'https://hotel-6de04.firebaseapp.com'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// middlewares
const logger =async(req, res, next)=>{
  console.log('called', req.host, req.originalUrl )
  next()
}

// console.log(process.env.HB_USER)
// console.log(process.env.HB_PASS)

const uri = `mongodb+srv://${process.env.HB_USER}:${process.env.HB_PASS}@cluster0.dtfuxds.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
   
    

    const RoomCollection = client.db("RoomDB").collection("room");
    const bookingCollection = client.db("RoomDB").collection("bookings");
    const reviewCollection = client.db("RoomDB").collection("review");
    const photoCollection = client.db("RoomDB").collection("photo");
    const newsCollection = client.db("RoomDB").collection("news");
    const contactCollection = client.db("RoomDB").collection("contact");

    // verify token
    const gateToken = (req, res, next) => {
      const { token } = req?.cookies;

      if (!token) {
        return res.status(401).send({ message: "unauthorized" });
      }

      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
         (err, decoded)=> {
          if (err) {
            return res.status(401).send({ message: "unauthorized" });
          }
          req.user = decoded;
          console.log(decoded);
          next();
        }
      );
    };

    
    // create token jwt
    app.post("/api/v1/auth/access-token",logger, (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10h",
      });
      console.log(token);
      // res.send(token)
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          // sameSite: "none",
        })
        .send({ success: true });
    });

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res
          .clearCookie('token', { maxAge: 0, secure: true })
          .send({ success: true })
   })


    // hotel room function
    // http://localhost:5000/api/v1/room?sortField=price&sortOrder=desc
    app.get("/api/v1/room", async (req, res) => {
      let queryObj = {};
      let sortObj = {};

      // // const room =req.query.category
      const sortField =parseInt(req.query.sortField);
      const sortOrder = req.query.sortOrder;
      console.log(sortField)
      console.log(sortOrder)

      if (sortField && sortOrder) {
        sortObj[sortField] = parseInt(sortOrder);
      }
      console.log(sortObj)
      const cursor = RoomCollection.find(queryObj).sort(sortObj);
      const result = await cursor.toArray();
      res.send(result);
    });

    // room details
    app.get("/api/v1/room/:id", async(req,res)=>{
      const id=req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) };
      // console.log(query)
      const result = await RoomCollection.findOne(query);
      res.send(result);
    })

    // booking
    app.post("/api/v1/user/create-bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // user specific booking
    app.get("/api/v1/user/bookings", gateToken, async (req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;

      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (queryEmail) {
        query.email = queryEmail;
      }

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // update

    app.get('/Booking/:id', async(req,res)=>{
      const id=req.params.id;
      const query={_id :new ObjectId(id)};
      const result =await bookingCollection.findOne(query)
      res.send(result)
    })


    app.put("/updateBooking/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateProduct = req.body;
      const product = {
        $set: {
          title: updateProduct.title,
          checkin: updateProduct.checkin,
          checkout: updateProduct.checkout,
          type: updateProduct.type,
          price: updateProduct.price,
          size: updateProduct.size,
          img1: updateProduct.img1,
          
        },
      };
      const result = await bookingCollection.updateOne(
        filter,
        product,
        options
      );
      res.send(result);
    });

    app.delete("/api/v1/user/cancel-bookings/:bookingId", async (req, res) => {
      const id = req.params.bookingId;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);

      res.send(result);
    });


    // review 

    app.post("/review", async (req, res) => {
      const newReview = req.body;
      // console.log(newProduct)
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });
    app.get("/api/v1/reviewItem", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();
      console.log(result)
      res.send(result);
    });
   
 app.get("/reviewItem/:code", async (req, res) => {
      const code = decodeURIComponent(req.params.code);
      console.log(code);
      const query = { code: code };
      console.log(query);
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // gallery

    app.get("/photo", async (req, res) => {
      const cursor = photoCollection.find();
      const result = await cursor.toArray();
      console.log(result)
      res.send(result);
    });
    // newsLetter
    app.post("/news", async (req, res) => {
      const newUser = req.body;
      // console.log(newProduct)
      const result = await newsCollection.insertOne(newUser);
      res.send(result);
    });

    // contact
    app.post("/contact", async (req, res) => {
      const massege = req.body;
      // console.log(newProduct)
      const result = await contactCollection.insertOne(massege);
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hotel server is running");
});
app.listen(port, () => {
  console.log(`hotel server is running on ${port}`);
});
