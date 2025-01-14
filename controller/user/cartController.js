import { Food } from "../../models/admin/food.js";
import { Cart } from "../../models/user/cart.js";

export const addToCart = async (req, res) => {
  try {
    const { userId, foodId, quantity } = req.body;

    if (!userId || !foodId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const food = await Food.findById(foodId);

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    //   check if food is already in the cart

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // create new cart if it doesn't exist
      cart = new Cart({ user: userId, items: [] });
    }

    //   check if food is already in the cart

    const existingItem = cart.items.find(
      (item) => item.food.toString() === foodId
    );

    if (existingItem) {
      // if food is already in the cart, update the quantity
      existingItem.quantity += quantity;
    } else {
      // if food is not in the cart, add it
      cart.items.push({ food: foodId, quantity });
    }

    await cart.save();
    res.json({ success: true, message: "Food added to cart", cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCart = async (req, res) => {
  const { userId } = req.body;
  try {
    const cart = await Cart.findOne({ user: userId }).populate("items.food");

    res.json({ success: true, cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeFromCart = async (req, res) => {
    try {
      const { userId, foodId } = req.body; // Get userId and foodId from the request body
  
      // Validate input
      if (!userId || !foodId) {
        return res.status(400).json({ message: 'User ID and Food ID are required' });
      }
  
      // Find the user's cart
      const cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
  
      // Find the index of the item to remove
      const itemIndex = cart.items.findIndex(item => item.food.toString() === foodId);
  
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
  
      // Remove the item from the cart
      cart.items.splice(itemIndex, 1);
  
      // Save the updated cart
      await cart.save();
  
      res.status(200).json({ message: 'Item removed from cart', cart });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  };
