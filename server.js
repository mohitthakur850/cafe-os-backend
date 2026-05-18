const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();

// 🛑 1. BULLETPROOF CORS SETUP (Isko sabse upar rakhna zaroori hai)
app.use(cors({
  origin: "*", // Sab allow karega (localhost aur live Vercel dono)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 🛑 2. SOCKET.IO CORS SETUP
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});

// ⚡ Socket Connection Checker
io.on('connection', (socket) => {
  console.log('⚡ A device connected to live sync!');
  socket.on('disconnect', () => {
    console.log('❌ A device disconnected');
  });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mohit85039_db_user:PrnWTmUlUWGEVoWE@cluster0.8bvhtvy.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// ==========================================
// 🗄️ DATABASE SCHEMAS
// ==========================================

const Admin = mongoose.model('Admin', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

const Product = mongoose.model('Product', new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: String, category: String, subCategory: String,
  description: String, image: String, price: { type: Number, default: 0 },
  addons: [{ name: String, price: Number }], selectionType: { type: String, default: 'Multiple' },
  isAvailable: { type: Boolean, default: true }
}));

const Category = mongoose.model('Category', new mongoose.Schema({
  name: String, image: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  id: String, customer_name: String, items: Array, total: Number,
  status: { type: String, default: 'Accepted' }, 
  createdAt: { type: Date, default: Date.now }
}));

// ==========================================
// 🚀 API ROUTES
// ==========================================

app.get('/', (req, res) => res.send("RE:FILL CAFE API is Running! ☕"));

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const adminUser = await Admin.findOne({ username, password });
    if (adminUser) res.json({ success: true, message: "Login Successful!" });
    else res.status(401).json({ success: false, message: "Invalid Credentials" });
  } catch (error) { res.status(500).json({ success: false }); }
});

// Products & Categories
app.get('/products', async (req, res) => res.json(await Product.find()));
app.post('/products', async (req, res) => { const p = new Product(req.body); await p.save(); res.json(p); });
app.put('/products/:id', async (req, res) => res.json(await Product.findOneAndUpdate({ $or: [{ _id: req.params.id }, { id: req.params.id }] }, req.body, { new: true })));
app.delete('/products/:id', async (req, res) => { await Product.findOneAndDelete({ $or: [{ _id: req.params.id }, { id: req.params.id }] }); res.json({ message: 'Deleted' }); });

app.get('/categories', async (req, res) => res.json(await Category.find()));
app.post('/categories', async (req, res) => { const c = new Category(req.body); await c.save(); res.json(c); });
app.put('/categories/:id', async (req, res) => res.json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/categories/:id', async (req, res) => { await Category.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); });

// Orders
app.get('/orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));

app.post('/orders', async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const todayOrderCount = await Order.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
    const newOrderId = (todayOrderCount + 1).toString();
    const newOrder = new Order({ ...req.body, id: newOrderId });
    await newOrder.save();

    io.emit('orderUpdated'); // ⚡ Broadcast update

    res.json(newOrder);
  } catch (error) { res.status(500).send("Error placing order"); }
});

app.put('/orders/:id/status', async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate({ $or: [{ _id: req.params.id }, { id: req.params.id }] }, { status: req.query.status }, { new: true });
    io.emit('orderUpdated'); // ⚡ Broadcast update
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).send("Error updating order status");
  }
});

app.delete('/orders/:id', async (req, res) => { 
  await Order.findOneAndDelete({ $or: [{ _id: req.params.id }, { id: req.params.id }] }); 
  io.emit('orderUpdated'); // ⚡ Broadcast update
  res.json({ message: 'Deleted' }); 
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server and WebSockets running on port ${PORT}`));
