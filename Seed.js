const mongoose = require('mongoose');

// Yahan apni asli string daalein (Password ke sath)
const MONGO_URI = "mongodb+srv://mohit85039_db_user:PrnWTmUlUWGEVoWE@cluster0.8bvhtvy.mongodb.net/?appName=Cluster0";
const ProductSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() + Math.random().toString().slice(2,5) },
  name: String,
  category: String,
  image: String
});

const Product = mongoose.model('Product', ProductSchema);

const cafeProducts = [
  // --- Hot Beverages ---
  { name: "Classic Espresso", category: "Hot Beverages", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" },
  { name: "Creamy Cappuccino", category: "Hot Beverages", image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg" },
  { name: "Caramel Macchiato", category: "Hot Beverages", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" },
  { name: "Rich Hot Chocolate", category: "Hot Beverages", image: "https://images.pexels.com/photos/4146164/pexels-photo-4146164.jpeg" },
  
  // --- Cold Beverages ---
  { name: "Iced Caramel Frappe", category: "Cold Beverages", image: "https://images.pexels.com/photos/1036148/pexels-photo-1036148.jpeg" },
  { name: "Virgin Mint Mojito", category: "Cold Beverages", image: "https://images.pexels.com/photos/12108740/pexels-photo-12108740.jpeg" },
  { name: "Strawberry Milkshake", category: "Cold Beverages", image: "https://images.pexels.com/photos/1092878/pexels-photo-1092878.jpeg" },
  { name: "Cold Coffee with Ice Cream", category: "Cold Beverages", image: "https://images.pexels.com/photos/1556688/pexels-photo-1556688.jpeg" },

  // --- Snacks & Fast Food ---
  { name: "Spicy Paneer Tikka Wrap", category: "Snacks", image: "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg" },
  { name: "Peri Peri French Fries", category: "Snacks", image: "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg" },
  { name: "Double Cheese Veg Burger", category: "Snacks", image: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg" },
  { name: "Classic Margherita Pizza", category: "Snacks", image: "https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg" },
  { name: "Garlic Breadsticks", category: "Snacks", image: "https://images.pexels.com/photos/1750214/pexels-photo-1750214.jpeg" },

  // --- Desserts ---
  { name: "Sizzling Chocolate Brownie", category: "Desserts", image: "https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg" },
  { name: "New York Cheesecake", category: "Desserts", image: "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg" }
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected! Adding products...");

    // Pura data ek sath insert karna
    await Product.insertMany(cafeProducts);
    
    console.log("✅ 15 Products successfully added to your database!");
    process.exit(); // Kaam khatam hone par script band kar do
  } catch (error) {
    console.error("Error saving products:", error);
    process.exit(1);
  }
};

seedDatabase();