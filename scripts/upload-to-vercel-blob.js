/**
 * Upload LanceDB to Vercel Blob Storage
 * Uploads the local LanceDB database files to Vercel Blob for serverless access
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put, list } from '@vercel/blob';
import dotenv from 'dotenv';

// ES Module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const DB_PATH = path.join(__dirname, '..', 'lancedb_data');
const BLOB_PREFIX = 'rag-databases';

/**
 * Get all files in a directory recursively
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Upload a single file to Vercel Blob
 */
async function uploadFile(localPath, blobPath) {
  const fileStream = fs.createReadStream(localPath);
  const stats = fs.statSync(localPath);

  try {
    const blob = await put(blobPath, fileStream, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      success: true,
      size: stats.size,
      url: blob.url
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload all LanceDB files to Vercel Blob
 */
async function uploadLanceDB() {
  console.log('🚀 Starting LanceDB upload to Vercel Blob\n');
  console.log('━'.repeat(50));

  // Check if DB exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ LanceDB directory not found: ${DB_PATH}`);
    console.error('Please run `npm run generate:embeddings` first');
    process.exit(1);
  }

  // Check Blob token
  if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN === 'your_blob_token_here') {
    console.error('❌ BLOB_READ_WRITE_TOKEN not set in .env.local');
    console.error('Get it from: Vercel Dashboard → Storage → Blob → .env.local tab');
    process.exit(1);
  }

  // Get all files
  const files = getAllFiles(DB_PATH);
  console.log(`\n📁 Found ${files.length} files to upload\n`);

  let uploaded = 0;
  let failed = 0;
  let totalSize = 0;

  for (const file of files) {
    const relativePath = path.relative(DB_PATH, file);
    const blobPath = `${BLOB_PREFIX}/${relativePath.replace(/\\/g, '/')}`;

    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(1);

    process.stdout.write(`  ${relativePath} (${sizeKB} KB)... `);

    const result = await uploadFile(file, blobPath);

    if (result.success) {
      console.log('✅');
      uploaded++;
      totalSize += result.size;
    } else {
      console.log(`❌ ${result.error}`);
      failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '━'.repeat(50));
  console.log('📊 Upload Summary:\n');
  console.log(`Uploaded: ${uploaded} files`);
  console.log(`Failed:   ${failed} files`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('');

  if (failed === 0) {
    console.log('✅ All files uploaded successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set environment variables in Vercel Dashboard');
    console.log('2. Deploy your application: vercel --prod');
    console.log('3. Set VITE_USE_RAG=true in Vercel environment variables');
  } else {
    console.log(`⚠️  ${failed} files failed to upload. Please check errors above.`);
  }

  return {
    uploaded,
    failed,
    totalSize
  };
}

/**
 * List existing blobs (optional check)
 */
async function listExistingBlobs() {
  console.log('\n📋 Checking existing blobs...\n');

  try {
    const { blobs } = await list({
      prefix: BLOB_PREFIX,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    if (blobs.length === 0) {
      console.log('  No existing blobs found');
    } else {
      console.log(`  Found ${blobs.length} existing blobs:`);
      blobs.slice(0, 5).forEach(blob => {
        console.log(`    - ${blob.pathname}`);
      });
      if (blobs.length > 5) {
        console.log(`    ... and ${blobs.length - 5} more`);
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Could not list blobs: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await listExistingBlobs();
    await uploadLanceDB();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
