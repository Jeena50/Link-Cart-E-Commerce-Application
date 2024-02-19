const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");

mongoose.connect("mongodb+srv://admin:admin@cluster0.wdmmjjj.mongodb.net/LinkCart", {
   
})
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB:", error);
    });

app.listen(port, () => {
    console.log(`Server is running on port 8000`);
});

const User = require("./models/User");
const Order = require("./models/Order");

//function to send verification email to teh user
const sendVerificationEmail = async (email, verificationToken) => {
    //create a nodemailer transport 

    const transporter = nodemailer.createTransport({
        //configure the email service
        service: "gmail",
        auth: {
            user: "reejuballabh269@gmail.com",
            pass: "lirpzxsbxbkxisqf"
        }
    })

    // compose the email message
    const mailOptions = {
        from: "LinkCart.com",
        to: email,
        subject: "Email Verification",
        html: `<p>Please click on the following link to verify your email address:</p>
        <a href="http://192.168.1.3:8000/verify/${verificationToken}">Verify Email</a>`

    };

    //send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log("Verification email sent");

    } catch (error) {
        console.log("Error sending verification email:", error);

    }
};


// endpoint to register in the app
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // create a new user and save it to the database
        const newUser = new User({ name, email, password });
        // generate a random verification token
        newUser.verificationToken = crypto.randomBytes(20).toString("hex");
        // save the user to the database
        await newUser.save();
        // send verification email to the user
        await sendVerificationEmail(newUser.email, newUser.verificationToken);

        // send the response after email is sent successfully
        res.status(200).json({ message: "Registration successful" });
    } catch (error) {
        console.log("error registering user", error);
        res.status(500).json({ message: "Registration failed" });
    }
});


//endpoint to verify the email
app.get("/verify/:token", async (req, res) => {
    try {
        const token  = req.params.token;

        //Find the user with the given verification token
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(404).json({ message: "Invalid verification token" });
        }

        //Mark the user as verified
        user.verified = true;
        user.verificationToken = undefined;
        await user.save();
        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.log("error verifying email", error);
        res.status(500).json({ message: "Email verification failed" });
    }
}
);

const generateSecretKey = () => {
    const secretKey = crypto.randomBytes(32).toString("hex");

    return secretKey;
}

const secretKey = generateSecretKey();

//endpoint to login the user!
app.post("/login", async (req, res) => {
    try{
        const { email, password } = req.body;

        //check if the user exists
        const user = await User.findOne({ email});
        if(!user){
            return res.status(400).json({message: "User not found"});
        }
        
        //check if the password is correct
        if(user.password !== password){
            return res.status(400).json({message: "Invalid password"});
        }

        //generate a toekn
        const token = jwt.sign({ userId: user._id }, secretKey);

        res.status(200).json({token});
    }
    catch(error){
        console.log("error logging in", error);
        res.status(500).json({message: "Login failed"});
       }
    })



    //endpoint to store a new address to the backend
app.post("/addresses", async (req, res) => {
    try {
      const { userId, address } = req.body;
  
      //find the user by the Userid
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      //add the new address to the user's addresses array
      user.addresses.push(address);
  
      //save the updated user in te backend
      await user.save();
  
      res.status(200).json({ message: "Address created Successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error addding address" });
    }
  });
  
  //endpoint to get all the addresses of a particular user
  app.get("/addresses/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const addresses = user.addresses;
      res.status(200).json({ addresses });
    } catch (error) {
      res.status(500).json({ message: "Error retrieveing the addresses" });
    }
  });

  //endpoint to store all the orders
app.post("/orders", async (req, res) => {
    try {
      const { userId, cartItems, totalPrice, shippingAddress, paymentMethod } =
        req.body;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      //create an array of product objects from the cart Items
      const products = cartItems.map((item) => ({
        name: item?.title,
        quantity: item.quantity,
        price: item.price,
        image: item?.image,
      }));
  
      //create a new Order
      const order = new Order({
        user: userId,
        products: products,
        totalPrice: totalPrice,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
      });
  
      await order.save();
  
      res.status(200).json({ message: "Order created successfully!" });
    } catch (error) {
      console.log("error creating orders", error);
      res.status(500).json({ message: "Error creating orders" });
    }
  });
  
  //get the user profile
  app.get("/profile/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving the user profile" });
    }
  });
  
  app.get("/orders/:userId",async(req,res) => {
    try{
      const userId = req.params.userId;
  
      const orders = await Order.find({user:userId}).populate("user");
  
      if(!orders || orders.length === 0){
        return res.status(404).json({message:"No orders found for this user"})
      }
  
      res.status(200).json({ orders });
    } catch(error){
      res.status(500).json({ message: "Error"});
    }
  })