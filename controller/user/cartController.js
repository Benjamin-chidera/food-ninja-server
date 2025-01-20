import { Food } from "../../models/admin/food.js";
import { Auth } from "../../models/user/auth.js";

export const addToCart = async (req, res) => {
  try {
    const { userId, foodId, quantity } = req.body;

    const food = await Food.findById(foodId);
    const user = await Auth.findById(userId);

    if (!food || !user) {
      return res.status(404).json({ message: "Food or User not found" });
    }

    // Check if the food is already in the cart
    const existingItem = user.cart.find(
      (item) => item.foodId.toString() === foodId
    );

    if (existingItem) {
      // If food is already in the cart, update the quantity
      existingItem.quantity += quantity || 1;
    } else {
      // If food is not in the cart, add it with the given or default quantity
      user.cart.push({ foodId, quantity: quantity || 1 });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Food item added to cart successfully",
      cart: user.cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const checkUserId = await Auth.findById(userId);

    if (!checkUserId) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const cart = await Food.find({
      _id: { $in: checkUserId.cart.map((item) => item.foodId) },
    });

    res.json({ success: true, cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { userId, foodId } = req.body;

    // Find the user by ID
    const user = await Auth.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if the food exists in the user's cart
    const existingItem = user.cart.find(
      (item) => item.foodId.toString() === foodId
    );

    if (!existingItem) {
      return res.status(404).json({
        message: "Food not found in cart",
      });
    }

    // Remove the food item from the cart
    user.cart = user.cart.filter(
      (item) => item.foodId.toString() !== foodId
    );

    // Save the updated user document
    await user.save();

    // Fetch the updated cart items from the Food collection
    const updatedCart = await Food.find({
      _id: { $in: user.cart.map((item) => item.foodId) },
    });

    return res.status(200).json({
      success: true,
      message: "Food removed from cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


// stripe listen --forward-to localhost:3000/webhook

export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Auth.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.cart = [];

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
