import { Stripe } from "stripe";
import { Order } from "../../models/user/order.js";

const stripe = new Stripe(
  "sk_test_51QhwtjD11tTSXeHktQEk5hKdNk3GryH4rRAkOyl3nvuCw7r0kfFhlHydZQuA1H44JbggGEHhjZthyaO7DvzsdlFf003VmeJ9OB"
);
const endpointSecret =
  "whsec_d1775d4ce0e99249353a0eaad1c77ae849279f74da656b07a622d29872213e19";

export const paymentRequest = async (req, res) => {
  const { amount, userId, item } = req.body;

  console.log(item._id);

  if (!amount || !userId) {
    return res.status(400).json({ message: "Amount and User ID are required" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",

      metadata: {
        user: userId,
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};
