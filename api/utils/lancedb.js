/**
 * LanceDB Connection Utility
 * Manages connection to LanceDB for vector search
 */

import { connect } from '@lancedb/lancedb';
import { download } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

let dbConnection = null;

/**
 * Get LanceDB connection (singleton pattern)
 */
export async function getLanceDB() {
  if (dbConnection) {
    return dbConnection;
  }

  // Local path in Vercel serverless function (/tmp)
  const localPath = '/tmp/lancedb_data';

  // Download from Vercel Blob if not exists
  if (!fs.existsSync(localPath)) {
    console.log('📥 Downloading LanceDB from Vercel Blob...');
    await downloadFromBlob(localPath);
  }

  // Connect to local database
  dbConnection = await connect(localPath);
  console.log('✅ Connected to LanceDB');

  return dbConnection;
}

/**
 * Download LanceDB files from Vercel Blob
 */
async function downloadFromBlob(localPath) {
  const { list } = await import('@vercel/blob');

  try {
    // List all blobs with prefix
    const { blobs } = await list({
      prefix: 'rag-databases/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    if (blobs.length === 0) {
      throw new Error('No LanceDB files found in Vercel Blob. Please run upload script first.');
    }

    console.log(`  Found ${blobs.length} files to download`);

    // Create local directory
    fs.mkdirSync(localPath, { recursive: true });

    // Download each file
    for (const blob of blobs) {
      // Remove prefix to get relative path
      const relativePath = blob.pathname.replace('rag-databases/', '');
      const filePath = path.join(localPath, relativePath);

      // Create parent directory if needed
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Download file
      const response = await fetch(blob.url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));

      console.log(`    ✓ ${relativePath}`);
    }

    console.log('✅ Download complete');
  } catch (error) {
    console.error('❌ Error downloading from Blob:', error.message);
    throw error;
  }
}

/**
 * Search in a specific table
 */
export async function searchTable(tableName, embedding, limit = 10, filters = {}) {
  try {
    const db = await getLanceDB();
    const table = await db.openTable(tableName);

    let query = table.search(embedding).limit(limit);

    // Apply metadata filters if provided
    if (Object.keys(filters).length > 0) {
      // LanceDB filter syntax: column_name = 'value'
      const filterStrings = Object.entries(filters).map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key} = '${value}'`;
        }
        return `${key} = ${value}`;
      });

      if (filterStrings.length > 0) {
        query = query.where(filterStrings.join(' AND '));
      }
    }

    const results = await query.execute();
    return results;
  } catch (error) {
    console.error(`Error searching table ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Get table info
 */
export async function getTableInfo(tableName) {
  try {
    const db = await getLanceDB();
    const table = await db.openTable(tableName);
    const count = await table.countRows();

    return {
      name: tableName,
      count
    };
  } catch (error) {
    console.error(`Error getting table info for ${tableName}:`, error.message);
    return {
      name: tableName,
      count: 0,
      error: error.message
    };
  }
}

/**
 * Close database connection (cleanup)
 */
export async function closeLanceDB() {
  if (dbConnection) {
    dbConnection = null;
    console.log('🔌 Closed LanceDB connection');
  }
}
