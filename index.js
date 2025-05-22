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

// Ruta raíz para probar conexión a la base
app.get('/', (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error conectando a la base de datos:', err.message);
      return res.status(500).send('Error conectando a la base de datos');
    }
    connection.ping(error => {
      connection.release();
      if (error) {
        console.error('Ping a la base falló:', error.message);
        return res.status(500).send('Error haciendo ping a la base');
      }
      res.send('Conexión a la base de datos exitosa');
    });
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
