const bcrypt = require("bcryptjs");
const { pool, initDatabase } = require("./db");

function validateConfiguration() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  if (!process.env.ADMIN_EMAIL?.trim()) {
    throw new Error("ADMIN_EMAIL environment variable is required");
  }
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }

  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address");
  }

  const password = process.env.ADMIN_PASSWORD;
  if (
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 12 characters and include upper, lower, numeric, and special characters",
    );
  }

  return { email, password };
}

async function seedAdmin() {
  const { email: adminEmail, password: adminPassword } =
    validateConfiguration();

  console.log("Initializing database...");
  await initDatabase();

  console.log("Checking for existing admin...");
  const existingAdmin = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [adminEmail.toLowerCase()],
  );

  if (existingAdmin.rows.length > 0) {
    console.log("Admin user already exists");
    return false;
  }

  console.log("Creating admin user...");
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `INSERT INTO users (email, password_hash, role, name)
     VALUES ($1, $2, $3, $4)`,
    [adminEmail.toLowerCase(), passwordHash, "admin", "Admin User"],
  );

  console.log(`Admin user created successfully!`);
  console.log(
    "Admin credentials were provisioned from the configured environment.",
  );
  return true;
}

seedAdmin()
  .then(() => {
    console.log("Seed completed");
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
