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
app.get('/licencia/:idCollabo', (req, res) => {
  const { idCollabo } = req.params;

  const query = `
    SELECT id, licNum, licClass, dueDate 
    FROM collaborators_LicenseDrive 
    WHERE idCollabo = ?
  `;

  pool.query(query, [idCollabo], (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err.message);
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }

    if (results.length > 0) {
      return res.json(results[0]);
    } else {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }
  });
});


app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
