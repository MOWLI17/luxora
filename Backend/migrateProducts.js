const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Define temporary product schema for migration
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

async function migrateProducts() {
  try {
    console.log('🔄 Starting product migration...\n');

    // Find all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Check if product already has images array
      if (Array.isArray(product.images) && product.images.length >= 4) {
        console.log(`⏭️  Skipping: ${product.name} (already has images array)`);
        skippedCount++;
        continue;
      }

      // Migrate from single image to images array
      let newImages = [];
      
      if (product.image) {
        // If single image exists, replicate it 4 times
        newImages = [
          product.image,
          product.image,
          product.image,
          product.image
        ];
      } else if (Array.isArray(product.images) && product.images.length > 0) {
        // If images array exists but has less than 4, pad it
        newImages = [...product.images];
        while (newImages.length < 4) {
          newImages.push(product.images[0] || 'https://via.placeholder.com/300');
        }
      } else {
        // No image at all, use placeholders
        newImages = [
          'https://via.placeholder.com/300',
          'https://via.placeholder.com/300',
          'https://via.placeholder.com/300',
          'https://via.placeholder.com/300'
        ];
      }

      // Update the product
      await Product.updateOne(
        { _id: product._id },
        {
          $set: { images: newImages },
          $unset: { image: "" } // Remove old single image field
        }
      );

      console.log(`✅ Migrated: ${product.name} (${newImages.length} images)`);
      migratedCount++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);
    console.log(`   📦 Total: ${products.length} products`);
    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateProducts();