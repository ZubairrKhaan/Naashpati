import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import {
  deductStockFIFO,
  getStockTotalsByProductIds,
} from "../services/inventoryService.js";
import {
  isCompletionTransition,
  isRefundOrCancelTransition,
} from "../services/bestsellerMetricUtils.js";
import { processOrderMetricEvents } from "../eventHandlers/orderMetricsEventHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

const getGuestNameFromShipping = (shippingAddress = {}) => {
  const firstName = (shippingAddress.firstName || "").trim();
  const lastName = (shippingAddress.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  return fullName || "Guest Customer";
};

const getGuestEmailFromShipping = (shippingAddress = {}) => {
  return (shippingAddress.email || "").trim();
};

const withCustomerFallback = (order) => {
  const orderObject =
    typeof order.toObject === "function" ? order.toObject() : order;

  const snapshotName = (orderObject.customerSnapshot?.name || "").trim();
  const snapshotEmail = (orderObject.customerSnapshot?.email || "").trim();
  const resolvedGuestName =
    snapshotName && snapshotName !== "Guest Customer"
      ? snapshotName
      : getGuestNameFromShipping(orderObject.shippingAddress);
  const resolvedEmail =
    snapshotEmail || (orderObject.shippingAddress?.email || "").trim();

  if (!orderObject.user && orderObject.customerSnapshot) {
    orderObject.user = {
      name: resolvedGuestName,
      email: resolvedEmail,
    };
  }

  return orderObject;
};

const buildOrderConfirmationEmail = (customerName, order) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  // Modern card style for bought products
  const itemRows = (order.orderItems || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:0 0 24px 0; border:none;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;border-radius:12px;padding:0;margin:0;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
              <tr>
                <!-- Product Image -->
                <td style="width:90px;padding:16px 0 16px 16px;vertical-align:middle;">
                  <div style="width:64px;height:64px;background:#fff;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                    <img src="${item.image || ""}" alt="${item.name}" style="max-width:100%;max-height:100%;display:block;object-fit:contain;">
                  </div>
                </td>
                <!-- Product Details (no color/size) -->
                <td style="padding:16px 12px 16px 20px;vertical-align:middle;">
                  <div style="font-size:15px;font-weight:600;color:#222;">${item.name}</div>
                </td>
                <!-- Quantity -->
                <td style="padding:16px 12px 16px 0;text-align:center;vertical-align:middle;min-width:40px;">
                  <span style="font-size:15px;color:#444;">${item.quantity}</span>
                </td>
                <!-- Price -->
                <td style="padding:16px 20px 16px 0;text-align:right;vertical-align:middle;min-width:80px;">
                  <span style="font-size:16px;font-weight:700;color:#222;">Rs. ${Number(item.price).toFixed(2)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join("");

  const subtotal =
    Number(order.totalPrice) -
    Number(order.taxPrice || 0) -
    Number(order.shippingPrice || 0);
  const addr = order.shippingAddress || {};
  const firstName = addr.firstName || "";
  const lastName = addr.lastName || "";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || customerName;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .naashpati-btn-row { display: block !important; }
      .naashpati-btn-cell { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; text-align: center !important; }
      .naashpati-btn-cell:last-child { padding-bottom: 0 !important; }
    }
    @media only screen and (min-width: 601px) {
      .naashpati-btn-row { display: table-row !important; }
      .naashpati-btn-cell { display: table-cell !important; width: auto !important; padding: 0 8px !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Arial,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 0;">
    <tr><td align="center">
      <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        
        <!-- Hero Header with Text Branding -->
        <tr>
          <td style="background:#68a300;padding:48px 0 36px 0;text-align:center;">
            <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:2rem;font-weight:700;letter-spacing:2px;color:#fff;">NAASHPATI</span>
          </td>
        </tr>

        <!-- Main Content -->
        <tr>
          <td style="padding:48px 40px;">
            <p style="margin:16px 0 0;color:#0F172A;font-size:18px;font-weight:400;">
              Hey <span style="font-weight:700; color:#0F172A;">${firstName || "there"}</span>,
            </p>
            <!-- Message -->
            <p style="margin:0 0 8px;font-size:16px;color:#555;line-height:1.6;">Thank you for your order! We've received it and will process it shortly. We will notify you when it's on its way.</p>
            <!-- Order Summary Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:32px;border-left:4px solid #68a300;">
              <tr>
                <td>
                  <p style="margin:0 0 12px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Order ID #${orderId}</p>
                </td>
              </tr>
            </table>

            <!-- Order Items Table (Modern Card Style) -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 0;margin-bottom:24px;">
              <tbody>${itemRows}</tbody>
            </table>

            <!-- Pricing Section -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:10px 20px;font-size:14px;color:#666;">Subtotal</td>
                <td style="padding:10px 20px;text-align:right;font-size:14px;color:#666;">Rs. ${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:10px 20px;font-size:14px;color:#666;">Shipping</td>
                <td style="padding:10px 20px;text-align:right;font-size:14px;color:#666;">Rs. ${Number(order.shippingPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:10px 20px;font-size:14px;color:#666;font-weight:600;">Tax amount</td>
                <td style="padding:10px 20px;text-align:right;font-size:14px;color:#666;font-weight:600;">Rs. ${Number(order.taxPrice || 0).toFixed(2)}</td>
              </tr>
              <tr style="border-top:2px solid #e0e0e0;">
                <td style="padding:16px 20px;font-size:18px;font-weight:700;color:#2d5a27;">Total</td>
                <td style="padding:16px 20px;text-align:right;font-size:18px;font-weight:700;color:#2d5a27;">Rs. ${Number(order.totalPrice || 0).toFixed(2)}</td>
              </tr>
            </table>

            <!-- CTA Buttons -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr class="naashpati-btn-row">
                      <td class="naashpati-btn-cell" style="padding:0 8px; text-align:center;">
                        <a href="${process.env.FRONTEND_URL || "https://www.naashpati.com"}/profile?tab=orders&orderId=${order._id}" style="display:inline-block;padding:12px 32px;background:#68a300;color:#fff;text-decoration:none;border-radius:4px;font-size:14px;font-weight:600;border:2px solid #68a300;min-width:160px;">View your order</a>
                      </td>
                      <td class="naashpati-btn-cell" style="padding:0 8px; text-align:center;">
                        <a href="${process.env.FRONTEND_URL || "https://www.naashpati.com"}/products" style="display:inline-block;padding:12px 32px;background:#fff;color:#2d5a27;text-decoration:none;border-radius:4px;font-size:14px;font-weight:600;border:2px solid #68a300;min-width:160px;">Continue shopping</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Customer Information Section -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td colspan="2" style="padding-bottom:16px;font-size:15px;font-weight:600;color:#2d5a27;text-transform:uppercase;letter-spacing:0.5px;">Customer information</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0 0 20px;vertical-align:top;">
                  <p style="margin:0 0 12px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Shipping address</p>
                  <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">
                    ${fullName}<br>
                    ${addr.street || ""}<br>
                    ${addr.city || ""}, ${addr.state || ""} ${addr.zipCode || ""}<br>
                    ${addr.country || ""}
                  </p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:20px 0 20px;vertical-align:top;border-top:1px solid #eee; border-bottom:1px solid #eee;">
                  <p style="margin:0 0 12px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Shipping method</p>
                  <p style="margin:0 0 12px;font-size:14px;color:#333;">${order.shippingPrice === 0 ? "Free Shipping" : "Standard Shipping"}</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:32px 0 0;vertical-align:top;border-top:1px solid #eee;">
                  <p style="margin:0 0 12px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Payment method</p>
                  <p style="margin:0;font-size:14px;color:#333;">${order.paymentMethod || "N/A"}</p>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:0;">
              <tr>
                <td style="background:#f8f9fa;padding:48px 40px 32px;text-align:center;border-top:1px solid #eee;">
                  <p style="margin:0 0 4px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Naashpati</p>
                  <p style="margin:0;font-size:11px;color:#bbb;">© ${new Date().getFullYear()} Naashpati. All rights reserved.</p>
                </td>
              </tr>
            </table>

            <style>
              @media only screen and (max-width: 600px) {
                .naashpati-btn-row { display: block !important; }
                .naashpati-btn-cell { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; text-align: center !important; }
                .naashpati-btn-cell:last-child { padding-bottom: 0 !important; }
              }
            </style>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No order items",
      });
    }

    const session = await mongoose.startSession();
    let createdOrder;

    await session.withTransaction(async () => {
      const productIds = orderItems.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } }).session(
        session,
      );
      const productMap = new Map(
        products.map((product) => [String(product._id), product]),
      );
      const stockMap = await getStockTotalsByProductIds(productIds, session);
      const allocationMap = new Map();

      for (const item of orderItems) {
        const product = productMap.get(String(item.product));
        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.name}`);
        }

        const availableStock = stockMap.get(String(item.product)) || 0;
        if (availableStock < Number(item.quantity)) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }
      }

      for (const item of orderItems) {
        const allocations = await deductStockFIFO(
          item.product,
          Number(item.quantity),
          session,
        );
        allocationMap.set(String(item.product), allocations);
      }

      const orderItemsWithBatches = orderItems.map((item) => {
        const allocations = allocationMap.get(String(item.product)) || [];
        return {
          ...item,
          batchAllocations: allocations.map((allocation) => ({
            batchId: allocation.batchId,
            batchNumber: allocation.batchNumber,
            quantity: allocation.deducted,
          })),
        };
      });

      const order = new Order({
        user: req.user?._id || null,
        customerSnapshot: {
          name: req.user?.name || getGuestNameFromShipping(shippingAddress),
          email: req.user?.email || getGuestEmailFromShipping(shippingAddress),
        },
        orderItems: orderItemsWithBatches,
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      createdOrder = await order.save({ session });
    });

    session.endSession();

    // Send order confirmation email (fire-and-forget)
    const customerEmail = shippingAddress.email || req.user?.email;
    const customerName =
      getGuestNameFromShipping(shippingAddress) || req.user?.name || "Customer";
    if (customerEmail) {
      sendEmail({
        email: customerEmail,
        subject: `Order Confirmed - #${createdOrder._id.toString().slice(-8).toUpperCase()}`,
        html: buildOrderConfirmationEmail(customerName, createdOrder),
      }).catch((err) =>
        console.warn("[Order Email] Failed to send confirmation:", err.message),
      );
    }

    res.status(201).json({
      success: true,
      data: createdOrder,
    });
  } catch (error) {
    if (typeof error?.message === "string") {
      if (error.message.startsWith("PRODUCT_NOT_FOUND:")) {
        return res.status(404).json({
          success: false,
          error:
            error.message.replace("PRODUCT_NOT_FOUND:", "Product ") +
            " not found",
        });
      }

      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${error.message.replace("INSUFFICIENT_STOCK:", "")}`,
        });
      }
    }

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "orderItems.product",
        select: "name image images",
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if user owns the order or is admin
    if (req.user.role !== "admin") {
      if (
        !order.user ||
        order.user._id.toString() !== req.user._id.toString()
      ) {
        return res.status(401).json({
          success: false,
          error: "Not authorized to view this order",
        });
      }
    }

    res.json({
      success: true,
      data: withCustomerFallback(order),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: "orderItems.product",
        select: "name images price",
      })
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      data: orders.map(withCustomerFallback),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .populate("user", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments();

    res.json({
      success: true,
      data: orders.map(withCustomerFallback),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const previousStatus = order.status;
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = "delivered";

    const updatedOrder = await order.save();

    if (isCompletionTransition(previousStatus, updatedOrder.status)) {
      await processOrderMetricEvents({
        order: updatedOrder,
        eventType: "sale",
        fromStatus: previousStatus,
        toStatus: updatedOrder.status,
        occurredAt: updatedOrder.deliveredAt || new Date(),
      });
    }

    res.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const { status } = req.body;
    const previousStatus = order.status;

    if (
      ![
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    order.status = status;
    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    if (isCompletionTransition(previousStatus, updatedOrder.status)) {
      await processOrderMetricEvents({
        order: updatedOrder,
        eventType: "sale",
        fromStatus: previousStatus,
        toStatus: updatedOrder.status,
        occurredAt: updatedOrder.deliveredAt || new Date(),
      });
    }

    if (isRefundOrCancelTransition(previousStatus, updatedOrder.status)) {
      await processOrderMetricEvents({
        order: updatedOrder,
        eventType: "refund",
        fromStatus: previousStatus,
        toStatus: updatedOrder.status,
        occurredAt: new Date(),
      });
    }

    res.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create Stripe payment intent
// @route   POST /api/orders/create-payment-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: req.user._id.toString(),
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Payment intent creation failed",
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/orders/confirm-payment
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        error: "Not authorized",
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: paymentIntentId,
      status: "succeeded",
    };

    await order.save();

    res.json({
      success: true,
      message: "Payment confirmed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Payment confirmation failed",
    });
  }
};
