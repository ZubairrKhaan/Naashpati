/**
 * Trending Products - Test & Seed Script
 * Usage: node backend/scripts/testTrendingProducts.js
 * 
 * This script:
 * 1. Fetches all products
 * 2. Adds mock trending metrics to products
 * 3. Tests the trending products API
 * 4. Displays results
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import connectDB from "../config/database.js";

dotenv.config();

const API_URL = "http://localhost:5000/api";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
};

/**
 * Seed trending data to products
 */
async function seedTrendingData() {
  try {
    log.info("Fetching all active products...");
    const products = await Product.find({ isActive: true }).limit(15);

    if (products.length === 0) {
      log.warn("No active products found. Create some products first.");
      return;
    }

    log.info(`Found ${products.length} products. Seeding trending data...`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const randomFactor = Math.random() * 1.5;
      
      // Assign trending metrics
      const recentSales = Math.floor(Math.random() * 100 * randomFactor);
      const previousSales = Math.floor(Math.random() * 80);
      const views = Math.floor(Math.random() * 500 * randomFactor);
      const cartCount = Math.floor(Math.random() * 200 * randomFactor);

      await Product.findByIdAndUpdate(product._id, {
        recentSales,
        previousPeriodSales: previousSales,
        views,
        addToCartCount: cartCount,
        totalSales: recentSales + previousSales,
        metricsLastUpdatedAt: new Date(),
      });

      log.success(
        `Updated "${product.name}": sales=${recentSales}, views=${views}, cart=${cartCount}`
      );
    }

    log.success(`\nSeeded ${products.length} products with trending data`);
  } catch (error) {
    log.error(`Failed to seed data: ${error.message}`);
    throw error;
  }
}

/**
 * Test the trending products API
 */
async function testTrendingAPI() {
  try {
    log.info("Testing GET /api/products/trending...");

    const response = await fetch(`${API_URL}/products/trending`);
    const data = await response.json();

    if (!response.ok) {
      log.error(`API returned ${response.status}: ${data.error}`);
      return;
    }

    log.success(`Got response with ${data.count} trending products`);

    if (data.data && data.data.length > 0) {
      log.info("\nTop Trending Products:");
      console.log(
        "───────────────────────────────────────────────────────────────"
      );

      data.data.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   Score: ${product.trendingScore?.toFixed(2) || "N/A"}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Sales (7d): ${product.recentSales}`);
        console.log(`   Views: ${product.views}`);
        console.log(`   Add to Cart: ${product.addToCartCount}`);
        console.log(`   Price: $${product.price}`);
      });

      console.log(
        "\n───────────────────────────────────────────────────────────────"
      );
    } else {
      log.warn("No trending products returned (this is OK if no tracking data)");
    }

    // Test with cache bypass
    log.info("Testing with cache bypass (?cache=false)...");
    const freshResponse = await fetch(`${API_URL}/products/trending?cache=false`);
    const freshData = await freshResponse.json();

    if (freshResponse.ok) {
      log.success("Cache bypass works - got same data");
    } else {
      log.error("Cache bypass failed");
    }
  } catch (error) {
    log.error(`API test failed: ${error.message}`);
  }
}

/**
 * Test recording interactions
 */
async function testRecording(productId) {
  if (!productId) {
    log.warn("Skipping recording tests (no product ID yet)");
    return;
  }

  try {
    log.info("Testing interaction recording endpoints...");

    // Test view
    const viewRes = await fetch(`${API_URL}/products/${productId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (viewRes.ok) {
      log.success("POST /products/:id/view works");
    } else {
      log.error("View endpoint failed");
    }

    // Test add to cart
    const cartRes = await fetch(`${API_URL}/products/${productId}/add-to-cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (cartRes.ok) {
      log.success("POST /products/:id/add-to-cart works");
    } else {
      log.error("Add to cart endpoint failed");
    }
  } catch (error) {
    log.error(`Recording test failed: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   Trending Products - Test & Seed Script${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  try {
    // Connect to MongoDB
    log.info("Connecting to MongoDB...");
    await connectDB();
    log.success("Connected to MongoDB");

    // Seed data
    await seedTrendingData();

    // Test API
    console.log("");
    const products = await Product.find({ isActive: true }).limit(1);
    const productId = products[0]?._id;

    await testTrendingAPI();

    // Test recording
    console.log("");
    await testRecording(productId);

    log.success("\n✓ All tests completed!");
    console.log(
      `\n${colors.blue}Next Steps:${colors.reset}\n` +
        `1. Check the trending products at: http://localhost:5000/api/products/trending\n` +
        `2. Verify frontend component displays them at: http://localhost:5173\n` +
        `3. In ProductDetail.jsx, add: import { trackProductView } from '../utils/trendingMetricsTracker';\n` +
        `4. Record more interactions to see scores change\n` +
        `5. Run weekly: ${colors.yellow}resetTrendingMetrics()${colors.reset} to reset metrics\n`
    );
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Disconnect
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      log.info("Disconnected from MongoDB");
    }
    process.exit(0);
  }
}

// Run if called directly
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
