const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONEXIÓN A LA BASE DE DATOS (POSTGRES) ---
const pool = new Pool({
    user: 'postgres',       
    host: 'localhost',
    database: 'ollas_y_peroles_db', // <--- CAMBIO 1: Nombre correcto de la BD nueva
    password: '1234',        // <--- ¡REVISA QUE ESTA SEA TU CONTRASEÑA REAL!
    port: 5432,
});

// Ruta de Login
app.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    
    try {
        // <--- CAMBIO 2: Usamos 'nombre_usuario' en vez de 'username'
        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE nombre_usuario = $1 AND password = $2', 
            [usuario, password]
        );

        if (resultado.rows.length > 0) {
            // Devolvemos el nombre real que viene de la BD
            res.json({ exito: true, usuario: resultado.rows[0].nombre_usuario });
        } else {
            res.json({ exito: false, mensaje: 'Usuario o clave incorrectos' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ exito: false, mensaje: 'Error de servidor' });
    }
});

app.listen(3000, () => {
    console.log('Servidor de OLLAS corriendo en puerto 3000');
});