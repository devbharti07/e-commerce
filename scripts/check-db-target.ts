import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL || "";
try {
  const parsed = new URL(dbUrl);
  console.log("Database Protocol:", parsed.protocol);
  console.log("Database Host:", parsed.hostname);
  console.log("Database Port:", parsed.port);
  console.log("Database Name:", parsed.pathname.replace("/", ""));
  console.log("Username:", parsed.username);
} catch (e) {
  console.error("Failed to parse DATABASE_URL");
}
