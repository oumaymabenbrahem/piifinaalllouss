const express = require("express");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const {
  addToCart,
  fetchCartItems,
  deleteCartItem,
  updateCartItemQty,
} = require("../../controllers/shop/cart-controller");

const router = express.Router();

// Apply auth middleware to all cart routes
router.use(authMiddleware);

// Add to cart
router.post("/add", (req, res) => {
  const { productId, quantity } = req.body;
  addToCart(req, res);
});

// Get cart items
router.get("/get", (req, res) => {
  fetchCartItems(req, res);
});

// Update cart item quantity
router.put("/update-cart", (req, res) => {
  updateCartItemQty(req, res);
});

// Delete cart item
router.delete("/:productId", (req, res) => {
  deleteCartItem(req, res);
});

module.exports = router;
