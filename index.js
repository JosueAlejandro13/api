import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();

app.use(express.json());

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

app.get('/userData/:id/:idUs', (req, res) => {
  const { id, idUs } = req.params;

  const query = `
    SELECT * FROM collaborators_data 
    WHERE id = ? AND idUs = ?
  `;

  pool.query(query, [id, idUs], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err.message);
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }

    if (results.length > 0) {
      return res.json(results[0]); // Envía solo el primer resultado
    } else {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
  });
});

app.put('/updateUserData', (req, res) => {
  const {
    userId,
    firstName,
    lastName,
    email,
    phone,
    mobilPhone,
    address,
    dateOfBirth,
    employeeNum,
    idJobTitle,
    idMainAccount
  } = req.body;

  if (!firstName || !lastName || !phone || !mobilPhone || !dateOfBirth) {
    return res.status(400).json({ error: 'Campos requeridos vacíos' });
  }

  const selectQuery = `
    SELECT firstName, lastName, email, phone, mobilPhone, address, dateBirth, employeeNum, idJobTitle 
    FROM collaborators_data 
    WHERE id = ?
  `;

  pool.query(selectQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error al consultar usuario:', err.message);
      return res.status(500).json({ error: 'Error al consultar usuario' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const currentData = results[0];

    const oldData = {
      id: parseInt(userId),
      firstName: currentData.firstName,
      lastName: currentData.lastName,
      email: currentData.email,
      phone: currentData.phone,
      mobilPhone: currentData.mobilPhone,
      address: currentData.address,
      dateBirth: currentData.dateBirth,
      employeeNum: currentData.employeeNum,
      idJobTitle: currentData.idJobTitle,
    };

    const newData = {
      id: parseInt(userId),
      firstName,
      lastName,
      email,
      phone,
      mobilPhone,
      address,
      dateBirth: dateOfBirth,
      employeeNum,
      idJobTitle,
    };

    const updateQuery = `
      UPDATE collaborators_data 
      SET firstName = ?, lastName = ?, email = ?, phone = ?, mobilPhone = ?, address = ?, dateBirth = ?, employeeNum = ?, idJobTitle = ?
      WHERE id = ?
    `;

    pool.query(updateQuery, [
      firstName,
      lastName,
      email,
      phone,
      mobilPhone,
      address,
      dateOfBirth,
      employeeNum,
      idJobTitle,
      userId
    ], (err) => {
      if (err) {
        console.error('Error al actualizar usuario:', err.message);
        return res.status(500).json({ error: 'Error al actualizar usuario' });
      }

      const insertModificationQuery = `
        INSERT INTO aux_HistoricalModifications (tableName, idTable, idUsUpdate, fecHor, type, data)
        VALUES (?, ?, ?, NOW(), ?, ?)
      `;

      const jsonData = JSON.stringify({
        ["-"]: oldData,
        ["--"]: newData,
      });

      pool.query(insertModificationQuery, [
        'collaborators_data',
        parseInt(userId),
        parseInt(idMainAccount),
        0,
        jsonData
      ], (err) => {
        if (err) {
          console.error('Error al insertar modificación:', err.message);
          return res.status(500).json({ error: 'Error al guardar modificación' });
        }

        return res.json({ message: 'Usuario actualizado correctamente' });
      });
    });
  });
});

app.put('/updatePassword', (req, res) => {
  const {
    usuario,
    currentPassword,
    newPassword,
    idMainAccount
  } = req.body;

  if (!usuario || !currentPassword || !newPassword || !idMainAccount) {
    return res.status(400).json({ error: 'Campos requeridos vacíos' });
  }

  const hashedCurrentPassword = crypto.createHash('md5').update(currentPassword).digest('hex');
  const hashedNewPassword = crypto.createHash('md5').update(newPassword).digest('hex');

  const selectQuery = `
    SELECT id, password 
    FROM acco_Users 
    WHERE usuario = ? AND password = ?
  `;

  pool.query(selectQuery, [usuario, hashedCurrentPassword], (err, results) => {
    if (err) {
      console.error('Error al consultar usuario:', err.message);
      return res.status(500).json({ error: 'Error al consultar usuario' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const userId = results[0].id;

    const updateQuery = `
      UPDATE acco_Users 
      SET password = ?
      WHERE usuario = ?
    `;

    pool.query(updateQuery, [hashedNewPassword, usuario], (err) => {
      if (err) {
        console.error('Error al actualizar contraseña:', err.message);
        return res.status(500).json({ error: 'Error al actualizar contraseña' });
      }

      const insertModificationQuery = `
        INSERT INTO aux_HistoricalModifications (
          tableName, idTable, idUsUpdate, fecHor, type, data
        ) VALUES (?, ?, ?, NOW(), ?, ?)
      `;

      const oldData = { password: hashedCurrentPassword };
      const newData = { password: hashedNewPassword };

      const jsonData = JSON.stringify({
        ['-']: oldData,
        ['--']: newData,
      });

      pool.query(insertModificationQuery, [
        'acco_Users',
        userId,
        parseInt(idMainAccount),
        0,
        jsonData
      ], (err) => {
        if (err) {
          console.error('Error al insertar modificación:', err.message);
          return res.status(500).json({ error: 'Error al guardar modificación' });
        }

        return res.json({ message: 'Contraseña actualizada correctamente' });
      });
    });
  });
});

app.post('/addLicense', (req, res) => {
  const {
    idCollaborator,
    licNum,
    licClass,
    dueDate,
  } = req.body;

  if (!idCollaborator || !licNum || !licClass || !dueDate) {
    return res.status(400).json({ error: 'Campos requeridos vacíos' });
  }

  const insertQuery = `
    INSERT INTO collaborators_LicenseDrive (idCollabo, licNum, licClass, dueDate)
    VALUES (?, ?, ?, ?)
  `;

  pool.query(
    insertQuery,
    [idCollaborator, licNum, licClass, dueDate],
    (err, result) => {
      if (err) {
        console.error('Error al insertar licencia:', err.message);
        return res.status(500).json({ error: 'Error al insertar licencia' });
      }

      const newLiceId = result.insertId;

      const jsonData = JSON.stringify({
        0: {
          idCollaborator,
          '1:licNum': licNum,
          '2:licClass': licClass,
          '3:dueDate': dueDate,
        },
      });

      const insertModificationQuery = `
        INSERT INTO aux_HistoricalModifications (
          tableName, idTable, idUsUpdate, fecHor, type, data
        ) VALUES (?, ?, ?, NOW(), ?, ?)
      `;

      pool.query(
        insertModificationQuery,
        ['collaborators_LicenseDrive', newLiceId, idCollaborator, 2, jsonData],
        (err) => {
          if (err) {
            console.error(
              'Error al insertar modificación en el historial:',
              err.message
            );
            return res
              .status(500)
              .json({ error: 'Error al guardar en historial' });
          }

          return res.json({
            message: 'Licencia agregada y modificacion registrada con éxito',
          });
        }
      );
    }
  );
});





app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
