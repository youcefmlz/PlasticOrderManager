const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3001;

const requiredEnvironment = ["DATABASE_URL", "SESSION_SECRET"];
const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name]?.trim(),
);
if (missingEnvironment.length > 0) {
  console.error(
    `CRITICAL: Required environment configuration is missing (${missingEnvironment.join(", ")})`,
  );
  process.exit(1);
}

if (process.env.SESSION_SECRET.length < 32) {
  console.error("CRITICAL: SESSION_SECRET must be at least 32 characters");
  process.exit(1);
}

const JWT_SECRET = process.env.SESSION_SECRET;

const configuredOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ||
  process.env.ALLOWED_ORIGINS ||
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

for (const origin of configuredOrigins) {
  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    console.error("CRITICAL: CORS_ALLOWED_ORIGINS contains an invalid origin");
    process.exit(1);
  }

  if (
    !["http:", "https:"].includes(parsedOrigin.protocol) ||
    parsedOrigin.origin !== origin
  ) {
    console.error(
      "CRITICAL: CORS_ALLOWED_ORIGINS must contain explicit HTTP(S) origins",
    );
    process.exit(1);
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    // Native mobile clients commonly omit Origin. They are authenticated by JWT.
    if (!origin) {
      return callback(null, true);
    }
    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

const { pool, initDatabase } = require("./db");

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function formatOrder(order, items) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    date: order.created_at,
    status: order.status,
    totalAmount: parseFloat(order.total_amount),
    deliveryAddress: order.delivery_address,
    specialInstructions: order.special_instructions,
    wholesalerName: order.wholesaler_name,
    wholesalerCompany: order.wholesaler_company,
    wholesalerPhone: order.wholesaler_phone,
    items: items
      .filter((item) => item.product_id)
      .map((item) => ({
        product: {
          id: item.product_id,
          name: item.product_name,
          price: parseFloat(item.unit_price),
        },
        quantity: item.quantity,
      })),
  };
}

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${timestamp}${random}`;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    typeof authHeader === "string" && /^Bearer\s+(\S+)$/i.test(authHeader)
      ? authHeader.match(/^Bearer\s+(\S+)$/i)[1]
      : null;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } =
      req.body && typeof req.body === "object" ? req.body : {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      email.length > 255 ||
      password.length > 1024
    ) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      normalizedEmail,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        company: user.company,
        phone: user.phone,
        address: user.address,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, role, name, company, phone, address FROM users WHERE id = $1",
      [req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.patch("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { name, company, phone, address } = req.body;

    const result = await pool.query(
      `UPDATE users SET name = $1, company = $2, phone = $3, address = $4
       WHERE id = $5
       RETURNING id, email, role, name, company, phone, address`,
      [name, company, phone, address, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { category, active } = req.query;

    let query = "SELECT * FROM products WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (active !== "all") {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(active !== "false");
    }

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);

    const products = result.rows.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: parseFloat(p.price),
      description: p.description,
      image: p.image_data,
      specifications: p.specifications || {},
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    res.json({ products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const p = result.rows[0];
    res.json({
      product: {
        id: p.id,
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        description: p.description,
        image: p.image_data,
        specifications: p.specifications || {},
        isActive: p.is_active,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/api/products", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { name, category, price, description, image, specifications } =
      req.body;

    if (!name || !category || !price) {
      return res
        .status(400)
        .json({ error: "Name, category, and price are required" });
    }

    if (price <= 0) {
      return res.status(400).json({ error: "Price must be greater than 0" });
    }

    const result = await pool.query(
      `INSERT INTO products (name, category, price, description, image_data, specifications)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        category,
        price,
        description || null,
        image || null,
        JSON.stringify(specifications || {}),
      ],
    );

    const p = result.rows[0];
    res.status(201).json({
      success: true,
      product: {
        id: p.id,
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        description: p.description,
        image: p.image_data,
        specifications: p.specifications || {},
        isActive: p.is_active,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.put("/api/products/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const {
      name,
      category,
      price,
      description,
      image,
      specifications,
      isActive,
    } = req.body;

    if (!name || !category || !price) {
      return res
        .status(400)
        .json({ error: "Name, category, and price are required" });
    }

    const result = await pool.query(
      `UPDATE products SET 
        name = $1, 
        category = $2, 
        price = $3, 
        description = $4, 
        image_data = $5, 
        specifications = $6,
        is_active = $7,
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name,
        category,
        price,
        description || null,
        image || null,
        JSON.stringify(specifications || {}),
        isActive !== false,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const p = result.rows[0];
    res.json({
      success: true,
      product: {
        id: p.id,
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        description: p.description,
        image: p.image_data,
        specifications: p.specifications || {},
        isActive: p.is_active,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

app.get("/api/products/categories/list", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category",
    );

    res.json({ categories: result.rows.map((r) => r.category) });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/orders", authenticateToken, async (req, res) => {
  let client;
  let transactionStarted = false;
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      throw new HttpError(400, "Invalid request body");
    }

    const { items, deliveryAddress, specialInstructions } = req.body;
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      throw new HttpError(400, "Items must contain between 1 and 100 entries");
    }
    if (
      typeof deliveryAddress !== "string" ||
      !deliveryAddress.trim() ||
      deliveryAddress.length > 2000
    ) {
      throw new HttpError(400, "Delivery address is required");
    }
    if (
      specialInstructions !== undefined &&
      specialInstructions !== null &&
      (typeof specialInstructions !== "string" ||
        specialInstructions.length > 5000)
    ) {
      throw new HttpError(400, "Invalid special instructions");
    }

    const requestedItems = items.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new HttpError(
          400,
          "Each item must include a product and quantity",
        );
      }
      const productId = item.productId || item.product?.id;
      if (!isUuid(productId)) {
        throw new HttpError(400, "Each item must include a valid product ID");
      }
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > 2147483647
      ) {
        throw new HttpError(
          400,
          "Each item quantity must be a positive integer",
        );
      }
      return { productId, quantity: item.quantity };
    });

    const userResult = await pool.query(
      "SELECT id, name, company, phone, address FROM users WHERE id = $1",
      [req.user.userId],
    );
    if (userResult.rows.length === 0) {
      throw new HttpError(401, "Authenticated user not found");
    }
    const customer = userResult.rows[0];

    const productIds = [
      ...new Set(requestedItems.map((item) => item.productId.toLowerCase())),
    ];
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const productsResult = await client.query(
      `SELECT id, name, price
       FROM products
       WHERE is_active = TRUE AND id = ANY($1::uuid[])`,
      [productIds],
    );
    const productsById = new Map(
      productsResult.rows.map((product) => [product.id.toLowerCase(), product]),
    );
    if (productsById.size !== productIds.length) {
      throw new HttpError(400, "One or more products are unavailable");
    }

    // Work in cents to avoid floating point rounding and derive all amounts from
    // the active product rows returned by the database.
    let totalCents = 0;
    const pricedItems = requestedItems.map((item) => {
      const product = productsById.get(item.productId.toLowerCase());
      const priceCents = Math.round(Number(product.price) * 100);
      if (!Number.isFinite(priceCents) || priceCents <= 0) {
        throw new HttpError(400, "One or more products are unavailable");
      }
      totalCents += priceCents * item.quantity;
      if (!Number.isSafeInteger(totalCents) || totalCents > 999999999999) {
        throw new HttpError(400, "Order total is too large");
      }
      return { product, quantity: item.quantity, priceCents };
    });
    if (totalCents <= 0) {
      throw new HttpError(400, "Order total must be greater than zero");
    }
    const totalAmount = (totalCents / 100).toFixed(2);

    const orderNumber = generateOrderNumber();
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, user_id, total_amount, delivery_address, special_instructions, wholesaler_name, wholesaler_company, wholesaler_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        orderNumber,
        customer.id,
        totalAmount,
        deliveryAddress.trim(),
        specialInstructions?.trim() || null,
        customer.name,
        customer.company,
        customer.phone,
      ],
    );
    const order = orderResult.rows[0];

    for (const item of pricedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          item.product.id,
          item.product.name,
          (item.priceCents / 100).toFixed(2),
          item.quantity,
          null,
        ],
      );
    }

    const customerLabel = customer.company || customer.name || "Customer";
    await client.query(
      `INSERT INTO admin_notifications (order_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        order.id,
        "new_order",
        "New Order Received",
        `Order ${orderNumber} from ${customerLabel} - Total: $${totalAmount}`,
        JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          wholesalerName: order.wholesaler_name,
          wholesalerCompany: order.wholesaler_company,
          itemCount: pricedItems.length,
        }),
      ],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    const itemsResult = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [order.id],
    );
    const formattedOrder = formatOrder(order, itemsResult.rows);

    console.log(
      `Order ${orderNumber} placed successfully. Admin notification created.`,
    );
    res.status(201).json({
      success: true,
      order: formattedOrder,
      message: "Order placed successfully. Admin has been notified.",
    });
  } catch (err) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK").catch(() => {});
    }
    console.error("Error creating order:", err);
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : "Failed to create order" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const { all } = req.query;
    const requestAll = all === "true";
    if (requestAll && req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    let ordersQuery = `
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'productName', oi.product_name,
          'unitPrice', oi.unit_price,
          'quantity', oi.quantity
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;

    const params = [];
    if (!requestAll) {
      ordersQuery += " WHERE o.user_id = $1";
      params.push(req.user.userId);
    }

    ordersQuery += " GROUP BY o.id ORDER BY o.created_at DESC";

    const result = await pool.query(ordersQuery, params);

    const orders = result.rows.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      date: order.created_at,
      status: order.status,
      totalAmount: parseFloat(order.total_amount),
      deliveryAddress: order.delivery_address,
      specialInstructions: order.special_instructions,
      wholesalerName: order.wholesaler_name,
      wholesalerCompany: order.wholesaler_company,
      wholesalerPhone: order.wholesaler_phone,
      items: order.items
        .filter((item) => item.productName)
        .map((item) => ({
          product: {
            id: item.productId,
            name: item.productName,
            price: parseFloat(item.unitPrice),
          },
          quantity: item.quantity,
        })),
    }));

    res.json({ orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/orders/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [
      id,
    ]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];
    if (req.user.role !== "admin" && order.user_id !== req.user.userId) {
      return res.status(404).json({ error: "Order not found" });
    }
    const itemsResult = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [id],
    );
    const formattedOrder = formatOrder(order, itemsResult.rows);

    res.json({ order: formattedOrder });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

app.patch("/api/orders/:id/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Confirmed", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

app.get("/api/admin/notifications", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const result = await pool.query(
      "SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50",
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.patch(
  "/api/admin/notifications/:id/read",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;

      await pool.query(
        "UPDATE admin_notifications SET is_read = TRUE WHERE id = $1",
        [id],
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
      res.status(500).json({ error: "Failed to update notification" });
    }
  },
);

app.get(
  "/api/admin/notifications/unread-count",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const result = await pool.query(
        "SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = FALSE",
      );

      res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
      console.error("Error fetching unread count:", err);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  },
);

app.get("/api/admin/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const ordersResult = await pool.query(
      "SELECT COUNT(*) as count FROM orders",
    );
    const pendingResult = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'",
    );
    const productsResult = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE is_active = true",
    );
    const usersResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'wholesaler'",
    );

    res.json({
      totalOrders: parseInt(ordersResult.rows[0].count),
      pendingOrders: parseInt(pendingResult.rows[0].count),
      totalProducts: parseInt(productsResult.rows[0].count),
      totalWholesalers: parseInt(usersResult.rows[0].count),
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/admin/customers", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const result = await pool.query(
      `SELECT id, email, name, company, phone, address, created_at 
       FROM users 
       WHERE role = 'wholesaler' 
       ORDER BY created_at DESC`,
    );

    const customers = result.rows.map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      company: c.company,
      phone: c.phone,
      address: c.address,
      createdAt: c.created_at,
    }));

    res.json({ customers });
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.get("/api/admin/customers/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, name, company, phone, address, created_at 
       FROM users 
       WHERE id = $1 AND role = 'wholesaler'`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const c = result.rows[0];
    res.json({
      customer: {
        id: c.id,
        email: c.email,
        name: c.name,
        company: c.company,
        phone: c.phone,
        address: c.address,
        createdAt: c.created_at,
      },
    });
  } catch (err) {
    console.error("Error fetching customer:", err);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

app.post("/api/admin/customers", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { email, password, name, company, phone, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, name, company, phone, address)
       VALUES ($1, $2, 'wholesaler', $3, $4, $5, $6)
       RETURNING id, email, name, company, phone, address, created_at`,
      [
        email.toLowerCase(),
        passwordHash,
        name || null,
        company || null,
        phone || null,
        address || null,
      ],
    );

    const c = result.rows[0];
    res.status(201).json({
      success: true,
      customer: {
        id: c.id,
        email: c.email,
        name: c.name,
        company: c.company,
        phone: c.phone,
        address: c.address,
        createdAt: c.created_at,
      },
    });
  } catch (err) {
    console.error("Error creating customer:", err);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

app.put("/api/admin/customers/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { name, company, phone, address } = req.body;

    const result = await pool.query(
      `UPDATE users SET name = $1, company = $2, phone = $3, address = $4
       WHERE id = $5 AND role = 'wholesaler'
       RETURNING id, email, name, company, phone, address, created_at`,
      [name || null, company || null, phone || null, address || null, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const c = result.rows[0];
    res.json({
      success: true,
      customer: {
        id: c.id,
        email: c.email,
        name: c.name,
        company: c.company,
        phone: c.phone,
        address: c.address,
        createdAt: c.created_at,
      },
    });
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

app.post(
  "/api/admin/customers/:id/reset-password",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `UPDATE users SET password_hash = $1
       WHERE id = $2 AND role = 'wholesaler'
       RETURNING id`,
        [passwordHash, id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({ success: true, message: "Password reset successfully" });
    } catch (err) {
      console.error("Error resetting password:", err);
      res.status(500).json({ error: "Failed to reset password" });
    }
  },
);

app.delete("/api/admin/customers/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;

    // Check if customer has any orders
    const ordersCheck = await pool.query(
      "SELECT COUNT(*) FROM orders WHERE user_id = $1",
      [id],
    );

    const orderCount = parseInt(ordersCheck.rows[0].count);
    if (orderCount > 0) {
      // Set user_id to NULL on orders to preserve order history, then delete customer
      await pool.query("UPDATE orders SET user_id = NULL WHERE user_id = $1", [
        id,
      ]);
    }

    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 AND role = 'wholesaler' RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Keep framework and CORS failures from returning stack traces or database
// details to clients. Route handlers above intentionally return compatibility
// error messages for their own expected failures.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON request body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large" });
  }
  if (err.message === "Origin is not allowed") {
    return res.status(403).json({ error: "Origin is not allowed" });
  }
  console.error("Unhandled server error:", err);
  return res.status(err.status || 500).json({
    error:
      err.status && err.status < 500 ? err.message : "Internal server error",
  });
});

initDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
