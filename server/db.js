import mysql from 'mysql';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectTimeout: 20000, // 20 seconds
  timeout: 10000 // 2 minutes
});

pool.getConnection((err, connection) => {
  if (err) throw err;
  console.log('Connected to the MySQL database.');
  connection.release(); // Release the connection back to the pool
});

export default pool;

