import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { createPoolConfig } from "../src/config/databaseSsl.js";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool(createPoolConfig(connectionString));
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedCategories() {
  const categories = [
    {
      name: "General",
      slug: "general",
      description: "General discussion topics",
      color: "#60A5FA",
      order: 1,
    },
    {
      name: "Technical",
      slug: "technical",
      description: "Technical questions and troubleshooting",
      color: "#8B5CF6",
      order: 2,
    },
    {
      name: "Assignments",
      slug: "assignments",
      description: "Discussion about assignments",
      color: "#EC4899",
      order: 3,
    },
    {
      name: "Course Content",
      slug: "course-content",
      description: "Questions about course material",
      color: "#F59E0B",
      order: 4,
    },
    {
      name: "Resources",
      slug: "resources",
      description: "Sharing and requesting resources",
      color: "#10B981",
      order: 5,
    },
    {
      name: "Off-Topic",
      slug: "off-topic",
      description: "Off-topic conversations",
      color: "#6B7280",
      order: 6,
    },
  ];

  try {
    console.log("🌱 Seeding discussion categories...");

    for (const category of categories) {
      const existing = await prisma.discussionCategory.findUnique({
        where: { slug: category.slug },
      });

      if (existing) {
        console.log(`  ✓ ${category.name} (already exists)`);
      } else {
        await prisma.discussionCategory.create({
          data: category,
        });
        console.log(`  ✓ ${category.name}`);
      }
    }

    console.log("✅ Seeding complete!");

    // Show all categories
    const allCategories = await prisma.discussionCategory.findMany({
      orderBy: { order: "asc" },
    });

    console.log("\n📊 Current categories:");
    allCategories.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seedCategories();
