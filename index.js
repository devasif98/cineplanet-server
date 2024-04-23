const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors");

app.use(cors());
app.use(express.json());
require("dotenv").config();

// firebase
const multer = require("multer");
const firebase = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const { query } = require("express");

const firebaseConfig = {
  apiKey: process.env.DB_api,
  authDomain: process.env.DB_authDomain,
  projectId: process.env.DB_projectId,
  storageBucket: process.env.DB_storageBucket,
  messagingSenderId: process.env.DB_messagingSenderId,
  appId: process.env.DB_appId,
};
firebase.initializeApp(firebaseConfig);
const storage = getStorage();
const upload = multer({ storage: multer.memoryStorage() });

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0iyuemt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  // client.connect()
  console.log("database connected");
  const moviesCollection = client.db("Cineplanet").collection("movies");
  const usersCollection = client.db("Cineplanet").collection("users");
  const favoriteCollection = client.db("Cineplanet").collection("favorite");
  const reviewCollection = client.db("Cineplanet").collection("review");
  const categoriesCollection = client.db("Cineplanet").collection("categories");
  const upcomingCollection = client.db("Cineplanet").collection("upcoming");

  // user
  app.post("/users", async (req, res) => {
    const user = req.body;
    console.log(user);
    const result = await usersCollection.insertOne(user);
    res.send(result);
  });

  app.get("/users", async (req, res) => {
    const query = {};
    const result = await usersCollection.find(query).toArray();
    res.send(result);
  });

  //   movies
  app.get("/movies", async (req, res) => {
    const query = {};
    const result = await moviesCollection.find(query).toArray();
    res.send(result);
  });

  app.get("/mostViewed", async (req, res) => {
    const query = req.body;
    const cursor = moviesCollection.find(query).sort({ viewed: -1 });
    const result = await cursor.limit(16).toArray();
    res.send(result);
  });
  app.get("/topViewed", async (req, res) => {
    const query = req.body;
    const cursor = moviesCollection.find(query).sort({ viewed: -1 });
    const result = await cursor.toArray();
    res.send(result);
  });
  app.get("/topRated", async (req, res) => {
    const query = req.body;
    const cursor = moviesCollection.find(query).sort({ rate: -1 });
    const result = await cursor.toArray();
    res.send(result);
  });
  app.get("/popular", async (req, res) => {
    const query = req.body;
    const cursor = moviesCollection.find(query);
    const result = await cursor.limit(8).toArray();
    res.send(result);
  });

  app.get("/allsearch", async (req, res) => {
    const result = await moviesCollection.find().toArray();
    res.send(result);
  });

  app.put("/viewed/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updateDoc = {
      $inc: {
        viewed: 1,
      },
    };
    const result = await moviesCollection.updateOne(filter, updateDoc, options);
    res.send(result);
  });

  app.get("/movies/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await moviesCollection.find(query).toArray();
    res.send(result);
  });

  // favorite notification
  app.post("/favorite", async (req, res) => {
    const query = req.body;
    const result = await favoriteCollection.insertOne(query);
    res.send(result);
  });

  app.get("/favorite", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const result = await favoriteCollection.find(query).toArray();
    res.send(result);
  });

  app.delete("/favorite/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await favoriteCollection.deleteOne(query);
      res.send({
        success: true,
        data: result,
      });
    } catch (error) {
      res.send({
        success: false,
        error: error.message,
      });
    }
  });

  // like
  // app.put("/movieLike/:id", async (req, res) => {
  //   const id = req.params.id;
  //   const userEmail = req.body.email;
  //   const filter = { _id: new ObjectId(id) };
  //   const movie = await moviesCollection.findOne(filter);

  //   if (!movie) {
  //     return res.status(404).json({ message: "Movie not found" });
  //   }

  //   let likedBy = movie.likedBy || [];

  //   if (likedBy.includes(userEmail)) {
  //     // User has already liked the movie, so remove the like
  //     const updateDoc = {
  //       $inc: { like: -1 },
  //       $pull: { likedBy: userEmail },
  //     };
  //     const result = await moviesCollection.updateOne(filter, updateDoc);
  //     if (result.modifiedCount > 0) {
  //       return res.json({ message: "movie unliked successfully" });
  //     } else {
  //       return res.status(500).json({ message: "Unable to unlike movie" });
  //     }
  //   } else {
  //     // User has not liked the movie, so add the like
  //     const updateDoc = {
  //       $inc: { like: 1 },
  //       $addToSet: { likedBy: userEmail },
  //     };
  //     const result = await moviesCollection.updateOne(filter, updateDoc);
  //     if (result.modifiedCount > 0) {
  //       return res.json({ message: "movie liked successfully" });
  //     } else {
  //       return res.status(500).json({ message: "Unable to like movie" });
  //     }
  //   }
  // });

  //get movie review
  app.get("/review/:id", async (req, res) => {
    const id = req.params.id;
    const query = { postId: id };
    const result = reviewCollection.find(query);
    const cursor = await result.sort({ $natural: -1 }).toArray();
    res.send(cursor);
  });

  app.get("/review", async (req, res) => {
    const query = req.body;
    const cursor = reviewCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  });

  app.post("/review", async (req, res) => {
    const user = req.body;
    const result = await reviewCollection.insertOne(user);
    console.log(result);
    res.send(result);
  });

  // upload
  app.post("/uploadVideo", upload.single("filename"), (req, res) => {
    if (!req.file) {
      // No file was uploaded with the request
      res.status(400).send("No file uploaded.");
      return;
    }
    const storageRef = ref(storage, req.file.originalname);
    const metadata = {
      contentType: "video/mp4",
    };
    uploadBytes(storageRef, req.file.buffer, metadata)
      .then(() => {
        getDownloadURL(storageRef).then((url) => {
          res.send({ url });
        });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send(error);
      });
  });

  //  upload image------------------------------------------------------------------------

  app.post("/uploadPhoto", upload.single("imageFile"), (req, res) => {
    if (!req.file) {
      // No file was uploaded with the request
      res.status(400).send("No file uploaded.");
      return;
    }
    const storageRef = ref(storage, req.file.originalname);
    const metadata = {
      contentType: "image/jpeg",
    };
    uploadBytes(storageRef, req.file.buffer, metadata)
      .then(() => {
        getDownloadURL(storageRef).then((url) => {
          res.send({ url });
        });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send(error);
      });
  });

  app.post("/addMovie", async (req, res) => {
    const upLoaded = req.body;
    const result = await moviesCollection.insertOne(upLoaded);
    res.send(result);
  });

  // add to upcoming movie
  app.post("/upcoming", async (req, res) => {
    const upLoaded = req.body;
    const result = await upcomingCollection.insertOne(upLoaded);
    res.send(result);
  });
  app.get("/upcoming", async (req, res) => {
    const query = {};
    const result = await upcomingCollection.find(query).toArray();
    res.send(result);
  });
  app.get("/upcoming/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await upcomingCollection.find(query).toArray();
    res.send(result);
  });

  // category
  app.get("/category", async (req, res) => {
    const query = {};
    const result = await categoriesCollection.find(query).toArray();
    res.send(result);
  });
}
run();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
