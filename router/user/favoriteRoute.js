import { Router } from "express";
import {
  addFavorite,
  getAllFavorite,
  removeFavorite,
} from "../../controller/user/favoriteController.js";

const router = Router();

router.post("/add-to-favorite", addFavorite);
router.get("/get-all-favorite/:userId", getAllFavorite);
router.delete("/remove-favorites", removeFavorite);

export const FavoriteRouter = router;
