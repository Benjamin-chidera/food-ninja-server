import { Order } from "../../models/user/order.js";

// get the order

export const getOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ user: userId }).populate("item");

    console.log(orders);
    

    if (!orders || !orders.length === 0) {
      return res.status(400).json({ message: "No orders found" });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: error });
  }
};
