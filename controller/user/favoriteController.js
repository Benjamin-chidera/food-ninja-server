import { Food } from "../../models/admin/food.js";
import { Auth } from "../../models/user/auth.js";

export const addFavorite = async (req, res) => {
  const { foodId, userId } = req.body;

  const checkFoodId = await Food.findById(foodId);
  const checkUserId = await Auth.findById(userId);

  if (!checkFoodId || !checkUserId) {
    return res.status(404).json({
      message: "Food or User not found",
    });
  }

  if (!checkFoodId) {
    return res.status(404).json({
      message: "Food not found",
    });
  }

  if (!checkUserId) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  //   check if user already added this food to favorites
  if (checkUserId.favorites.includes(foodId)) {
    return res.status(400).json({
      message: "Food already added to favorites",
    });
  }

  //   add food to user favorites
  checkUserId.favorites.push(foodId);
  await checkUserId.save();

  return res.status(200).json({
    success: true,
    message: "Food added to favorites",
    favorites: checkUserId.favorites,
  });
};

export const getAllFavorite = async (req, res) => {
  const { userId } = req.params;

  const checkUserId = await Auth.findById(userId);

  if (!checkUserId) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const favoriteFoods = await Food.find({
    _id: { $in: checkUserId.favorites },
  });

  return res.status(200).json({
    success: true,
    message: "Favorite foods",
    favoriteFoods,
  });
};

export const removeFavorite = async (req, res) => {
  try {
    const { userId, foodId } = req.body;

    const checkUserId = await Auth.findById(userId);

    if (!checkUserId) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if food exists in the user's favorites before removing
    if (!checkUserId.favorites.includes(foodId)) {
      return res.status(404).json({
        message: "Food not found in favorites",
      });
    }

    // Remove the food from the favorites array
    checkUserId.favorites = checkUserId.favorites.filter(
      (fav) => fav.toString() !== foodId
    );

    // Save the updated user document
    await checkUserId.save();

    // Fetch the updated list of favorites to ensure it's updated
    const updatedUser = await Auth.findById(userId);

    // Fetch the updated list of favorite foods
    const favoriteFoods = await Food.find({
      _id: { $in: updatedUser.favorites },
    });

    return res.status(200).json({
      success: true,
      message: "Food removed from favorites",
      favorites: favoriteFoods,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error,
    });
  }
};
