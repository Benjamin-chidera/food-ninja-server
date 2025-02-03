import { Order } from "../../models/user/order.js";

export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "-password");
    res.status(200).json({ order: orders });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    console.log(order.status);

    const status = order.status;

    res.status(200).json({ status, success: true });
  } catch (error) {
    console.log(error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: "Order status updated" });
  } catch (error) {
    console.log(error);
  }
};
