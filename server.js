require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
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
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: String
});

const OrderSchema = new mongoose.Schema({
  id: Number,
  customer_name: String,
  items: Array,
  total: Number,
  status: { type: String, default: "Accepted" },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: String,
  category: String,      
  subCategory: String,   
  description: String,   
  image: String,
  price: { type: Number, default: 150 },
  addons: [{             
    name: String,
    price: Number
  }]
});

const Category = mongoose.model('Category', CategorySchema);
const Order = mongoose.model('Order', OrderSchema);
const Product = mongoose.model('Product', ProductSchema);

// ================= WEBSOCKETS LOGIC =================
const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify(message));
  });
};

// ================= CATEGORIES APIs =================
app.get('/categories', async (req, res) => {
  const cats = await Category.find();
  res.json(cats);
});

app.post('/categories', async (req, res) => {
  try {
    const newCat = new Category(req.body);
    await newCat.save();
    res.status(201).json(newCat);
  } catch(e) { res.status(500).json({error: "Category exist or error"}); }
});

app.delete('/categories/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Category deleted" });
});

// ================= PRODUCTS APIs =================
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (error) { res.status(500).json({ message: "Error fetching products" }); }
});

app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product({ ...req.body });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) { res.status(500).json({ message: "Error saving product" }); }
});

app.put('/products/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) { res.status(500).json({ message: "Error updating product" }); }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const deletedItem = await Product.findOneAndDelete({ 
      $or: [ { _id: itemId.match(/^[0-9a-fA-F]{24}$/) ? itemId : null }, { id: itemId } ] 
    });
    if (deletedItem) res.status(200).json({ message: "Deleted!" });
    else res.status(404).json({ message: "Not found!" });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// ================= ORDERS APIs =================
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) { res.status(500).json({ message: "Error fetching orders" }); }
});

app.post('/orders', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const newOrder = new Order({ id: 100 + totalOrders + 1, ...req.body, status: "Accepted" });
    await newOrder.save(); 
    broadcast({ type: "NEW_ORDER", data: newOrder }); 
    res.status(201).json(newOrder);
  } catch (error) { res.status(500).json({ message: "Error placing order" }); }
});

app.delete('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await Order.findOneAndDelete({
      $or: [ { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }, { id: parseInt(orderId) || 0 } ]
    });
    if (deletedOrder) {
      broadcast({ type: "ORDER_DELETED", data: orderId });
      res.status(200).json({ message: "Order completed" });
    } else { res.status(404).json({ message: "Order not found" }); }
  } catch (error) { res.status(500).json({ message: "Error deleting order" }); }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`🚀 Cafe Backend Server running at port ${PORT}`));
