require('dotenv').config(); // Environment variables ke liye
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
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully! ✅"))
  .catch(err => console.log("DB Connection Error:", err));

// ================= DATABASE SCHEMAS =================
const OrderSchema = new mongoose.Schema({
  id: Number,
  customer_name: String,
  items: Array,
  total: Number, // <-- NAYA: Order ka total amount save karne ke liye
  status: { type: String, default: "Accepted" },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: String,
  category: String,      // Main Category (e.g., Burgers)
  subCategory: String,   // Sub Category (e.g., Veg, Chicken)
  description: String,   // Item details
  image: String,
  price: { type: Number, default: 150 },
  addons: [{             // NAYA: Add-ons Array
    name: String,
    price: Number
  }]
});

const Order = mongoose.model('Order', OrderSchema);
const Product = mongoose.model('Product', ProductSchema);

// ================= WEBSOCKETS LOGIC =================
const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify(message));
  });
};

// ================= PRODUCTS APIs =================

// 1. Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

// 2. Add new product
app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product({ ...req.body });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Error saving product" });
  }
});

// 3. Delete product (NAYA ROUTE - Admin Page se delete karne ke liye)
app.delete('/products/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    // Smart delete: _id (Mongo) ya id (Custom) dono check karega
    const deletedItem = await Product.findOneAndDelete({ 
      $or: [
        { _id: itemId.match(/^[0-9a-fA-F]{24}$/) ? itemId : null }, 
        { id: itemId }
      ] 
    });

    if (deletedItem) {
      res.status(200).json({ message: "Product deleted successfully!" });
    } else {
      res.status(404).json({ message: "Product not found!" });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ================= ORDERS APIs =================

// 1. Get all orders
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// 2. Place new order
app.post('/orders', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const newOrder = new Order({ 
      id: 100 + totalOrders + 1, 
      ...req.body, 
      status: "Accepted"
    });
    await newOrder.save(); // DB mein save ho gaya
    
    broadcast({ type: "NEW_ORDER", data: newOrder }); // Kitchen ko real-time signal jayega
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: "Error placing order" });
  }
});

// 3. Update order status (Purana logic)
app.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { status: req.query.status },
      { new: true }
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

// 4. Delete/Complete Order (NAYA ROUTE - Serve dabane par hatane ke liye)
app.delete('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await Order.findOneAndDelete({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { id: parseInt(orderId) || 0 }
      ]
    });

    if (deletedOrder) {
      broadcast({ type: "ORDER_DELETED", data: orderId }); // Real-time hat jayega
      res.status(200).json({ message: "Order completed and removed" });
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    console.error("Order Delete Error:", error);
    res.status(500).json({ message: "Error deleting order" });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`🚀 Cafe Backend Server running at http://localhost:${PORT}`));