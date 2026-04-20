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
  {
    "id": "1",
    "name": "Signature Burger",
    "category": "Burgers",
    "image": "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "2",
    "name": "Spicy Paneer Burger",
    "category": "Burgers",
    "image": "https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "3",
    "name": "Crispy Veggie Burger",
    "category": "Burgers",
    "image": "https://images.pexels.com/photos/2271107/pexels-photo-2271107.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "4",
    "name": "Double Cheese Burger",
    "category": "Burgers",
    "image": "https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "5",
    "name": "Margherita Pizza",
    "category": "Pizzas",
    "image": "https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "6",
    "name": "Farmhouse Pizza",
    "category": "Pizzas",
    "image": "https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "7",
    "name": "Crispy Pizza",
    "category": "Pizzas",
    "image": "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "8",
    "name": "Peri Peri Paneer Pizza",
    "category": "Pizzas",
    "image": "https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "9",
    "name": "Iced Coffee",
    "category": "Beverages",
    "image": "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "10",
    "name": "Hot Cappuccino",
    "category": "Beverages",
    "image": "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "11",
    "name": "Fresh Lime Soda",
    "category": "Beverages",
    "image": "https://images.pexels.com/photos/4051410/pexels-photo-4051410.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "12",
    "name": "Mango Smoothie",
    "category": "Beverages",
    "image": "https://images.pexels.com/photos/1092878/pexels-photo-1092878.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "13",
    "name": "Classic French Fries",
    "category": "Snacks & Sides",
    "image": "https://images.pexels.com/photos/115740/pexels-photo-115740.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "14",
    "name": "Peri Peri Fries",
    "category": "Snacks & Sides",
    "image": "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "15",
    "name": "Garlic Bread",
    "category": "Snacks & Sides",
    "image": "https://images.pexels.com/photos/1750214/pexels-photo-1750214.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "16",
    "name": "Cheesy Nachos",
    "category": "Snacks & Sides",
    "image": "https://images.pexels.com/photos/1135148/pexels-photo-1135148.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "17",
    "name": "Sizzling Brownie",
    "category": "Desserts",
    "image": "https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "18",
    "name": "Vanilla Ice Cream",
    "category": "Desserts",
    "image": "https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "19",
    "name": "Red Velvet Cake",
    "category": "Desserts",
    "image": "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "20",
    "name": "Masala Dosa",
    "category": "South Indian",
    "image": "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "21",
    "name": "Soft Idli Sambar",
    "category": "South Indian",
    "image": "https://images.pexels.com/photos/4331490/pexels-photo-4331490.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "22",
    "name": "Medu Vada",
    "category": "South Indian",
    "image": "https://images.pexels.com/photos/12739345/pexels-photo-12739345.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "23",
    "name": "Paneer Tikka Wrap",
    "category": "Wraps & Rolls",
    "image": "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "24",
    "name": "Veg Falafel Roll",
    "category": "Wraps & Rolls",
    "image": "https://images.pexels.com/photos/2955819/pexels-photo-2955819.jpeg?auto=compress&cs=tinysrgb&w=500"
  },
  {
    "id": "25",
    "name": "Cheesy Corn Wrap",
    "category": "Wraps & Rolls",
    "image": "https://images.pexels.com/photos/13814030/pexels-photo-13814030.jpeg?auto=compress&cs=tinysrgb&w=500"
  }
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
