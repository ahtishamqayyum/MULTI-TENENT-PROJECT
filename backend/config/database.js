/**
 * SQLite database layer with PostgreSQL-style pool.query() compatibility.
 * Converts $1 placeholders and RETURNING clauses for existing route SQL.
 */
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Create SQLite database file
const dbPath = path.join(__dirname, '..', 'multitenant.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Test database connection
const testConnection = () => {
  try {
    db.prepare('SELECT 1').get();
    return true;
  } catch (error) {
    console.error('\n❌ Database Connection Error:');
    console.error('Error:', error.message);
    return false;
  }
};

// Initialize database tables (make it async for compatibility)
const initializeDatabase = async () => {
  try {
    // Test connection first
    const connected = testConnection();
    if (!connected) {
      throw new Error('Database connection failed.');
    }

    // Create tenants table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create users table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // Add role column to existing users table if it doesn't exist
    try {
      db.prepare('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"').run();
    } catch (error) {
      // Column already exists, ignore error
    }

    // Create projects table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create indexes for better performance
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)
    `).run();
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id)
    `).run();

    // Insert sample tenants and users for demo
    const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get();
    
    if (tenantCount.count === 0) {
      // Insert sample tenants
      const tenant1 = db.prepare('INSERT INTO tenants (name) VALUES (?)').run('Acme Corp');
      const tenant2 = db.prepare('INSERT INTO tenants (name) VALUES (?)').run('Tech Solutions');

      // Insert sample users (password is 'password123' hashed)
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('password123', 10);
      const adminPassword = bcrypt.hashSync('admin123', 10);

      // Insert admin user with admin1@gmail.com
      db.prepare(`
        INSERT INTO users (email, password, name, tenant_id, role) 
        VALUES (?, ?, ?, ?, ?)
      `).run('admin1@gmail.com', adminPassword, 'Admin User', tenant1.lastInsertRowid, 'admin');

      db.prepare(`
        INSERT INTO users (email, password, name, tenant_id) 
        VALUES (?, ?, ?, ?)
      `).run('admin@acme.com', hashedPassword, 'Admin User', tenant1.lastInsertRowid);

      db.prepare(`
        INSERT INTO users (email, password, name, tenant_id) 
        VALUES (?, ?, ?, ?)
      `).run('user@tech.com', hashedPassword, 'Tech User', tenant2.lastInsertRowid);

      console.log('Sample data inserted successfully');
    }
    
    // Always ensure admin1@gmail.com has admin role (for existing databases)
    try {
      db.prepare(`
        UPDATE users SET role = 'admin' WHERE email = 'admin1@gmail.com'
      `).run();
    } catch (error) {
      // Ignore if update fails
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Maps route SQL ($1, RETURNING, CURRENT_TIMESTAMP) to SQLite (? , lastInsertRowid)
const convertQuery = (sql, params = []) => {
  // Convert $1, $2, etc. to ? placeholders
  let convertedSql = sql;
  const paramMap = {};
  
  // Replace $1, $2, etc. with ?
  convertedSql = convertedSql.replace(/\$(\d+)/g, (match, num) => {
    const index = parseInt(num) - 1;
    paramMap[index] = params[index];
    return '?';
  });
  
  // Handle RETURNING clause (SQLite doesn't support it, we'll get lastInsertRowid separately)
  const hasReturning = /RETURNING\s+.*$/i.test(convertedSql);
  let returningColumns = [];
  if (hasReturning) {
    const returningMatch = convertedSql.match(/RETURNING\s+(.*)$/i);
    if (returningMatch) {
      returningColumns = returningMatch[1].split(',').map(col => col.trim());
    }
    convertedSql = convertedSql.replace(/\s+RETURNING\s+.*$/i, '');
  }
  
  // Convert CURRENT_TIMESTAMP to datetime('now') for SQLite
  convertedSql = convertedSql.replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");
  
  const orderedParams = Object.keys(paramMap).sort((a, b) => parseInt(a) - parseInt(b)).map(k => paramMap[k]);
  
  return { sql: convertedSql, params: orderedParams, hasReturning, returningColumns };
};

// Helper function to convert SQLite results to match PostgreSQL format
// Returns a Promise for compatibility with async/await
const query = (sql, params = []) => {
  return Promise.resolve((() => {
  try {
    const { sql: convertedSql, params: convertedParams, hasReturning, returningColumns } = convertQuery(sql, params);
    const stmt = db.prepare(convertedSql);
    
    const sqlUpper = sql.trim().toUpperCase();
    const isSelect = sqlUpper.startsWith('SELECT');
    const isInsert = sqlUpper.startsWith('INSERT');
    const isUpdate = sqlUpper.startsWith('UPDATE');
    const isDelete = sqlUpper.startsWith('DELETE');
    
    if (isSelect) {
      const results = convertedParams.length > 0 ? stmt.all(convertedParams) : stmt.all();
      return { rows: results };
    } else if (isInsert) {
      const result = convertedParams.length > 0 ? stmt.run(convertedParams) : stmt.run();
      if (hasReturning && returningColumns.length > 0) {
        // Fetch the inserted row
        const insertedRow = db.prepare(`SELECT * FROM ${sql.match(/INTO\s+(\w+)/i)?.[1]} WHERE id = ?`).get(result.lastInsertRowid);
        return { rows: [insertedRow] };
      }
      return { rows: [{ id: result.lastInsertRowid }] };
    } else if (isUpdate) {
      const result = convertedParams.length > 0 ? stmt.run(convertedParams) : stmt.run();
      if (hasReturning && returningColumns.length > 0) {
        // For UPDATE, we need to get the table name and id
        const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
        const idMatch = sql.match(/WHERE\s+id\s*=\s*\$(\d+)/i);
        if (tableMatch && idMatch) {
          const tableName = tableMatch[1];
          const idParamIndex = parseInt(idMatch[1]) - 1;
          const id = params[idParamIndex];
          const updatedRow = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
          return { rows: [updatedRow] };
        }
      }
      return { rows: [] };
    } else if (isDelete) {
      const result = convertedParams.length > 0 ? stmt.run(convertedParams) : stmt.run();
      return { rows: [] };
    } else {
      const result = convertedParams.length > 0 ? stmt.run(convertedParams) : stmt.run();
      return { rows: [] };
    }
  } catch (error) {
    console.error('Query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
  })());
};

// pool.query() — same interface routes expect from pg
const pool = {
  query: query
};

module.exports = {
  db,
  pool,
  query,
  initializeDatabase,
};
