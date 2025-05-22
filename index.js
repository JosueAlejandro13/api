import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Ruta simple para probar conexión
app.get('/acco_Users', (req, res) => {
  pool.query('SELECT * FROM acco_Users LIMIT 10', (err, results) => {
    if (err) {
      console.error('Error en consulta:', err.message);
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
