const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- BASE DE DATOS ---
const db = new sqlite3.Database('./restaurante.db', (err) => {
    if (err) console.error(err.message);
    console.log('📦 Conectado a la base de datos SQLite.');
});

db.serialize(() => {
    // 1. Tablas
    db.run(`CREATE TABLE IF NOT EXISTS mozos (id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT UNIQUE, nombre TEXT, activo INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS productos (id INTEGER PRIMARY KEY AUTOINCREMENT, categoria TEXT, nombre TEXT, precio REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (id INTEGER PRIMARY KEY AUTOINCREMENT, mesa TEXT, mozo TEXT, contenido TEXT, total REAL, estado TEXT DEFAULT 'pendiente', fecha DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    // 2. Mozos por defecto
    db.get("SELECT count(*) as count FROM mozos", (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO mozos (codigo, nombre, activo) VALUES ('101', 'Juan Perez', 1), ('102', 'Maria Lopez', 1)`);
            console.log("✅ Mozos creados.");
        }
    });

    // 3. MENÚ COMPLETO (Aquí agregué todos los platos que me dijiste antes)
    db.get("SELECT count(*) as count FROM productos", (err, row) => {
        if (row.count === 0) {
            const stmt = db.prepare("INSERT INTO productos (categoria, nombre, precio) VALUES (?, ?, ?)");
            
            // --- COMIDAS ---
            stmt.run('comidas', 'Arroz con Pollo', 28.00);
            stmt.run('comidas', 'Lomo Saltado', 35.00);
            stmt.run('comidas', 'Ají de Gallina', 25.00);
            stmt.run('comidas', 'Ceviche Mixto', 30.00);
            stmt.run('comidas', 'Seco de Cabrito', 38.00);
            stmt.run('comidas', 'Tallarín Saltado', 35.00);
            stmt.run('comidas', 'Ceviche de Pescado', 25.00);
            stmt.run('comidas', 'Ceviche + Chicharrón', 30.00);
            stmt.run('comidas', 'Causa Rellena', 35.00);
            stmt.run('comidas', 'Chupe de Camarones', 40.00);
            stmt.run('comidas', 'Tallarines Rojos', 35.00);
            // Especiales
            stmt.run('comidas', 'Pachamanca', 30.00);
            stmt.run('comidas', 'Caja China', 25.00);
            stmt.run('comidas', 'Picante de Cuy (Entero)', 60.00);
            stmt.run('comidas', 'Picante de Cuy (1/2)', 30.00);

            // --- EXTRAS ---
            stmt.run('extras', 'Porción de Arroz', 5.00);
            stmt.run('extras', 'Papas Fritas', 8.00);
            stmt.run('extras', 'Sarsa Criolla', 3.00);
            stmt.run('extras', 'Cancha Serrana', 4.00);
            stmt.run('extras', 'Porción de Camote', 5.00);
            stmt.run('extras', 'Porción de Habas', 4.00);

            // --- BEBIDAS ---
            stmt.run('bebidas', 'Chicha Morada (Jarra)', 15.00);
            stmt.run('bebidas', 'Inca Kola 1.5L', 10.00);
            stmt.run('bebidas', 'Limonada', 8.00);
            stmt.run('bebidas', 'Cerveza Cusqueña', 9.00);
            stmt.run('bebidas', 'Jarra de Refresco (Muña)', 12.00);

            stmt.finalize();
            console.log("✅ MENÚ COMPLETO cargado correctamente.");
        }
    });
});

// --- RUTAS API ---

// Login
app.post('/api/login', (req, res) => {
    const { codigo } = req.body;
    db.get("SELECT * FROM mozos WHERE codigo = ?", [codigo], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            row.activo === 1 ? res.json({ success: true, mozo: row }) 
                             : res.json({ success: false, message: "🚫 Usuario inactivo." });
        } else {
            res.json({ success: false, message: "❌ Código incorrecto." });
        }
    });
});

// Productos
app.get('/api/productos', (req, res) => {
    db.all("SELECT * FROM productos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const menu = { comidas: [], extras: [], bebidas: [] };
        rows.forEach(prod => { if(menu[prod.categoria]) menu[prod.categoria].push(prod); });
        res.json(menu);
    });
});

// Pedidos
app.post('/api/pedido', (req, res) => {
    const { mesa, mozo, contenido, total } = req.body;
    const contenidoString = JSON.stringify(contenido);
    db.run(`INSERT INTO pedidos (mesa, mozo, contenido, total) VALUES (?, ?, ?, ?)`, 
        [mesa, mozo, contenidoString, total], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id_pedido: this.lastID });
        }
    );
});

// Cocina
app.get('/api/cocina', (req, res) => {
    db.all("SELECT * FROM pedidos WHERE estado = 'pendiente' ORDER BY id ASC", [], (err, rows) => res.json(rows));
});

app.post('/api/pedido/terminar/:id', (req, res) => {
    db.run("UPDATE pedidos SET estado = 'completado' WHERE id = ?", [req.params.id], (err) => res.json({ success: true }));
});

// Historial
app.get('/api/historial', (req, res) => {
    db.all("SELECT * FROM pedidos WHERE estado IN ('completado', 'entregado') ORDER BY id DESC LIMIT 20", [], (err, rows) => res.json(rows));
});

// Mozo Notificaciones
app.get('/api/pedidos/mozo/:nombre', (req, res) => {
    db.all("SELECT * FROM pedidos WHERE mozo = ? ORDER BY id DESC LIMIT 50", [req.params.nombre], (err, rows) => res.json(rows));
});

app.post('/api/pedido/entregar/:id', (req, res) => {
    db.run("UPDATE pedidos SET estado = 'entregado' WHERE id = ?", [req.params.id], (err) => res.json({ success: true }));
});

// Reportes
app.get('/api/reporte/:rango', (req, res) => {
    const rango = req.params.rango;
    let cond = "date(fecha, 'localtime') = date('now', 'localtime')";
    if (rango === 'semana') cond = "date(fecha, 'localtime') >= date('now', 'localtime', '-7 days')";
    else if (rango === 'mes') cond = "date(fecha, 'localtime') >= date('now', 'localtime', '-1 month')";
    else if (rango === 'anio') cond = "date(fecha, 'localtime') >= date('now', 'localtime', '-1 year')";

    db.all(`SELECT * FROM pedidos WHERE ${cond} AND estado IN ('completado', 'entregado') ORDER BY id DESC`, [], (err, rows) => res.json(rows));
});

// Gestión Mozos
app.post('/api/crear-mozo', (req, res) => {
    const { nombre, codigo } = req.body;
    db.run(`INSERT INTO mozos (nombre, codigo) VALUES (?, ?)`, [nombre, codigo], function(err) {
        if (err) return res.json({ success: false, message: "Código ya existe." });
        res.json({ success: true });
    });
});

app.get('/api/mozos', (req, res) => {
    db.all("SELECT * FROM mozos", [], (err, rows) => res.json(rows));
});

app.post('/api/mozo/estado/:id', (req, res) => {
    const { nuevoEstado } = req.body;
    db.run("UPDATE mozos SET activo = ? WHERE id = ?", [nuevoEstado, req.params.id], (err) => res.json({ success: true }));
});

app.listen(PORT, () => console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`));