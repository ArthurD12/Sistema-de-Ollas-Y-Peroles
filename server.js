const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// --- ¡ESTA ES LA LÍNEA QUE TE FALTA! ---
// Esto hace que el servidor pueda mostrar tus archivos index.html y menu.html
app.use(express.static(__dirname)); 
// ---------------------------------------

app.use(cors());
app.use(express.json());

// Conexión a Base de Datos
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ollas_y_peroles_db', 
    password: '1234',
    port: 5432,
});

// Ruta de Login
app.post('/login', async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const query = 'SELECT * FROM usuarios WHERE nombre_usuario = $1 AND clave = $2';
        const result = await pool.query(query, [usuario, password]);

        if (result.rows.length > 0) {
            res.json({ exito: true, usuario: result.rows[0].nombre_usuario });
        } else {
            res.json({ exito: false, mensaje: "Usuario o contraseña incorrectos" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ exito: false, mensaje: "Error de servidor/BD" });
    }
});

app.listen(3000, () => {
    console.log('✅ Servidor listo en: http://localhost:3000/index.html');
});