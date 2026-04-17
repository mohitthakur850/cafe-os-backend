const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs'); // File system for storage

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Data Load/Save Logic
let orders_db = [];
const ORDERS_FILE = './orders.json';

if (fs.existsSync(ORDERS_FILE)) {
  orders_db = JSON.parse(fs.readFileSync(ORDERS_FILE));
}

const saveOrders = () => {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders_db, null, 2));
};

let products_db = [
  { id: 1, name: "Signature Burger", category: "Burger", image: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400" }
];

const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify(message));
  });
};

// APIs
app.get('/products', (req, res) => res.json(products_db));

app.post('/products', (req, res) => {
  const newProduct = { id: Date.now(), ...req.body, price: 0 };
  products_db.push(newProduct);
  res.status(201).json(newProduct);
});

app.get('/orders', (req, res) => res.json(orders_db));

app.post('/orders', (req, res) => {
  const newOrder = { 
    id: 100 + orders_db.length + 1, 
    ...req.body, 
    status: "Accepted",
    createdAt: new Date().toISOString() // Rojana ka data track karne ke liye
  };
  orders_db.push(newOrder);
  saveOrders(); // Save to file
  broadcast({ type: "NEW_ORDER", data: newOrder });
  res.status(201).json(newOrder);
});

app.put('/orders/:id/status', (req, res) => {
  const order = orders_db.find(o => o.id === parseInt(req.params.id));
  if (order) {
    order.status = req.query.status;
    saveOrders();
    broadcast({ type: "STATUS_UPDATE", data: order });
    res.json(order);
  } else {
    res.status(404).send("Order not found");
  }
});

server.listen(8000, () => console.log(`Server running at http://localhost:8000`));