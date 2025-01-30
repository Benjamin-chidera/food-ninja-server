import { Order } from "../../models/user/order.js";

export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "-password");
    res.status(200).json({ order: orders });
  } catch (error) {
    res.status(500).json(error);
  }
};
