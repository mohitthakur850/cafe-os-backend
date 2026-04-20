const express = require('express');
const mongoose = require('mongoose'); // MongoDB connect karne ke liye
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ================= MONGO_DB CONNECTION =================
// 'APNA_PASSWORD' ki jagah Atlas wala password dalein
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully! ✅"))
  .catch(err => console.log("DB Connection Error:", err));

// --- Database Schemas (Structure) ---
const OrderSchema = new mongoose.Schema({
  id: Number,
  customer_name: String,
  items: Array,
  status: { type: String, default: "Accepted" },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: String,
  category: String,
  image: String
});

const Order = mongoose.model('Order', OrderSchema);
const Product = mongoose.model('Product', ProductSchema);
// =======================================================

const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify(message));
  });
};

// --- PRODUCTS APIs ---
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product({ ...req.body });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Error saving product" });
  }
});

// --- ORDERS APIs ---
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const newOrder = new Order({ 
      id: 100 + totalOrders + 1, 
      ...req.body, 
      status: "Accepted"
    });
    await newOrder.save(); // DB mein save ho gaya
    
    broadcast({ type: "NEW_ORDER", data: newOrder });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: "Error placing order" });
  }
});

app.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { status: req.query.status },
      { new: true } // Updated data wapas dene ke liye
    );
    
    if (order) {
      broadcast({ type: "STATUS_UPDATE", data: order });
      res.json(order);
    } else {
      res.status(404).send("Order not found");
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
});

server.listen(8000, () => console.log(`Server running at http://localhost:8000`));