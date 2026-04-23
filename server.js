const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = "mongodb+srv://mohit85039_db_user:PrnWTmUlUWGEVoWE@cluster0.8bvhtvy.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// ==========================================
// 🗄️ DATABASE SCHEMAS
// ==========================================

// 1. Admin Schema
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', AdminSchema);

// 2. Product Schema (Menu Items)
const ProductSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: String,
  category: String,
  subCategory: String,
  description: String,
  image: String,
  price: { type: Number, default: 0 },
  addons: [{ name: String, price: Number }],
  isAvailable: { type: Boolean, default: true } // 📦 Stock Management
});
const Product = mongoose.model('Product', ProductSchema);

// 3. Category Schema
const CategorySchema = new mongoose.Schema({
  name: String,
  image: String
});
const Category = mongoose.model('Category', CategorySchema);

// 4. Order Schema
const OrderSchema = new mongoose.Schema({
  id: { type: String, default: () => Math.floor(100 + Math.random() * 900).toString() },
  customer_name: String,
  items: Array,
  total: Number,
  status: { type: String, default: 'Preparing' }, // Preparing, Ready, Completed
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// ==========================================
// 🚀 API ROUTES
// ==========================================

app.get('/', (req, res) => {
  res.send("RE:FILL CAFE API is Running! ☕");
});

// --- ADMIN AUTH ROUTES ---
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const adminUser = await Admin.findOne({ username, password });
    if (adminUser) {
      res.json({ success: true, message: "Login Successful!" });
    } else {
      res.status(401).json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// --- PRODUCT ROUTES ---
app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/products', async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.json(newProduct);
});

app.put('/products/:id', async (req, res) => {
  try {
    // Supports updating by MongoDB _id OR custom id
    const product = await Product.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { id: req.params.id }] }, 
      req.body, 
      { new: true }
    );
    res.json(product);
  } catch (err) {
    res.status(500).send("Error updating product");
  }
});

app.delete('/products/:id', async (req, res) => {
  await Product.findOneAndDelete({ $or: [{ _id: req.params.id }, { id: req.params.id }] });
  res.json({ message: 'Product Deleted' });
});

// --- CATEGORY ROUTES ---
app.get('/categories', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

app.post('/categories', async (req, res) => {
  const newCategory = new Category(req.body);
  await newCategory.save();
  res.json(newCategory);
});

app.put('/categories/:id', async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
});

app.delete('/categories/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category Deleted' });
});

// --- ORDER ROUTES ---
app.get('/orders', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }); // Naye orders pehle
  res.json(orders);
});

app.post('/orders', async (req, res) => {
  const newOrder = new Order(req.body);
  await newOrder.save();
  res.json(newOrder);
});

// Order Status Update Route (Live to Completed)
app.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { id: req.params.id }] },
      { status: req.query.status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).send("Error updating status");
  }
});

app.delete('/orders/:id', async (req, res) => {
  await Order.findOneAndDelete({ $or: [{ _id: req.params.id }, { id: req.params.id }] });
  res.json({ message: 'Order Deleted' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
