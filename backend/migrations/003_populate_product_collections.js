import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const determineCollection = (product) => {
  const category = String(product.category || "")
    .trim()
    .toLowerCase();
  const name = String(product.name || "").toLowerCase();
  const subcategory = String(product.subcategory || "").toLowerCase();
  const brand = String(product.brand || "").toLowerCase();
  const tags = Array.isArray(product.tags)
    ? product.tags.join(" ").toLowerCase()
    : String(product.tags || "").toLowerCase();
  const description = `${String(product.shortDescription || "").toLowerCase()} ${String(
    product.briefDescription || "",
  ).toLowerCase()}`;
  const text = [category, name, subcategory, brand, tags, description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const maleTerms =
    /\b(male|men|man|boys|boy|gent|gents|gentlemen|male-collection)\b/;
  const femaleTerms =
    /\b(female|women|woman|ladies|lady|girl|girls|female-collection)\b/;

  if (maleTerms.test(category)) {
    return "male";
  }
  if (femaleTerms.test(category)) {
    return "female";
  }

  const hasMale = maleTerms.test(text);
  const hasFemale = femaleTerms.test(text);

  if (hasMale && !hasFemale) {
    return "male";
  }
  if (hasFemale && !hasMale) {
    return "female";
  }

  return "both";
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const products = db.collection("products");

  const missingCollectionQuery = {
    $or: [
      { productCollection: { $exists: false } },
      { productCollection: null },
      { productCollection: "" },
    ],
  };

  const cursor = products.find(missingCollectionQuery);
  let updatedCount = 0;

  while (await cursor.hasNext()) {
    const product = await cursor.next();
    const collection = product.productCollection
      ? String(product.productCollection).trim().toLowerCase()
      : product.collection
      ? String(product.collection).trim().toLowerCase()
      : determineCollection(product);

    await products.updateOne(
      { _id: product._id },
      { $set: { productCollection: collection } },
    );

    updatedCount += 1;
  }

  console.log(
    `[Migration] Updated ${updatedCount} existing product(s) with collection values.`,
  );
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("[Migration] Failed:", error.message || error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
