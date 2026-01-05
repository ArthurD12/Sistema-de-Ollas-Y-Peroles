// CAMBIA LA IP SI USAS CELULAR
const API_URL = "http://localhost:3000/api";
let rangoActual = 'hoy';

document.addEventListener('DOMContentLoaded', () => {
    // 1. SEGURIDAD DE SESIÓN
    const yaIngreso = sessionStorage.getItem("adminLogueado");
    if (yaIngreso === "true") {
        iniciarSistemaAdmin();
    } else {
        const password = prompt("🔒 Contraseña de Administrador:");
        if (password === "admin123") { 
            sessionStorage.setItem("adminLogueado", "true");
            iniciarSistemaAdmin();
        } else {
            alert("Contraseña incorrecta");
            window.location.href = "index.html"; 
        }
    }
});

function iniciarSistemaAdmin() {
    cargarReporte(); 
    cargarListaMozos();
}

// --- REPORTES ---
function filtrar(rango, boton) {
    rangoActual = rango;
    document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');
    cargarReporte();
}

async function cargarReporte() {
    try {
        const res = await fetch(`${API_URL}/reporte/${rangoActual}`);
        const ventas = await res.json();

        let totalDinero = 0;
        let conteoPlatos = {}; 
        let conteoMozos = {};

        ventas.forEach(pedido => {
            totalDinero += pedido.total;
            if (!conteoMozos[pedido.mozo]) conteoMozos[pedido.mozo] = { cantidad: 0, total: 0 };
            conteoMozos[pedido.mozo].cantidad += 1;
            conteoMozos[pedido.mozo].total += pedido.total;

            try {
                const platos = JSON.parse(pedido.contenido);
                platos.forEach(plato => {
                    if (!conteoPlatos[plato.nombre]) conteoPlatos[plato.nombre] = { cantidad: 0, recaudado: 0 };
                    conteoPlatos[plato.nombre].cantidad += 1;
                    conteoPlatos[plato.nombre].recaudado += plato.precio;
                });
            } catch (e) {}
        });

        document.getElementById("total-dinero").textContent = `S/. ${totalDinero.toFixed(2)}`;
        document.getElementById("total-pedidos").textContent = ventas.length;
        document.getElementById("ticket-promedio").textContent = `S/. ${(ventas.length > 0 ? totalDinero/ventas.length : 0).toFixed(2)}`;

        // Tabla Platos con Barras
        const tbodyPlatos = document.getElementById("tabla-productos");
        tbodyPlatos.innerHTML = "";
        const rankingPlatos = Object.keys(conteoPlatos).map(n => ({ nombre: n, ...conteoPlatos[n] }));
        rankingPlatos.sort((a, b) => b.cantidad - a.cantidad);
        const max = rankingPlatos.length > 0 ? rankingPlatos[0].cantidad : 1;

        rankingPlatos.forEach((item, index) => {
            const pct = (item.cantidad / max) * 100;
            const color = index === 0 ? "bg-verde" : "bg-azul";
            const medalla = index === 0 ? "⭐" : "";
            tbodyPlatos.innerHTML += `
                <tr>
                    <td style="font-weight:bold;">${medalla} ${item.nombre}</td>
                    <td style="width:50%;">
                        <div class="info-cantidad"><span>${item.cantidad} Und.</span><span>${Math.round(pct)}%</span></div>
                        <div class="barra-contenedor"><div class="barra-relleno ${color}" style="width:${pct}%"></div></div>
                    </td>
                    <td>S/. ${item.recaudado.toFixed(2)}</td>
                </tr>`;
        });

        // Tabla Mozos (Reporte)
        const tbodyMozos = document.getElementById("tabla-mozos");
        tbodyMozos.innerHTML = "";
        Object.keys(conteoMozos).forEach(mozo => {
            const d = conteoMozos[mozo];
            tbodyMozos.innerHTML += `<tr><td>${mozo}</td><td>${d.cantidad}</td><td>S/. ${d.total.toFixed(2)}</td></tr>`;
        });
    } catch (e) { console.error(e); }
}

// --- GESTIÓN DE PERSONAL ---
async function crearMozo() {
    const nombre = document.getElementById("nuevo-nombre").value;
    const codigo = document.getElementById("nuevo-codigo").value;
    const mensaje = document.getElementById("mensaje-mozo");

    if (!nombre || !codigo) return mensaje.textContent = "⚠️ Completa datos";

    try {
        const res = await fetch(`${API_URL}/crear-mozo`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre, codigo })
        });
        const data = await res.json();
        
        if (data.success) {
            mensaje.style.color = "green";
            mensaje.textContent = "✅ Guardado";
            document.getElementById("nuevo-nombre").value = "";
            document.getElementById("nuevo-codigo").value = "";
            cargarListaMozos();
        } else {
            mensaje.style.color = "red";
            mensaje.textContent = data.message;
        }
    } catch (e) { alert("Error servidor"); }
}

async function cargarListaMozos() {
    try {
        const res = await fetch(`${API_URL}/mozos`);
        const mozos = await res.json();
        const tabla = document.getElementById("lista-mozos-db");
        tabla.innerHTML = "";

        mozos.forEach(m => {
            let estado = '<span style="color:green; font-weight:bold;">Activo</span>';
            let btn = `<button onclick="cambiarEstado(${m.id}, 0)" style="background:#e74c3c; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Dar Baja</button>`;
            
            if (m.activo === 0) {
                estado = '<span style="color:red; font-weight:bold;">Inactivo</span>';
                btn = `<button onclick="cambiarEstado(${m.id}, 1)" style="background:#2ecc71; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Reactivar</button>`;
            }

            tabla.innerHTML += `
                <tr>
                    <td><strong>${m.codigo}</strong></td>
                    <td>${m.nombre}</td>
                    <td>${estado}</td>
                    <td>${btn}</td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

async function cambiarEstado(id, nuevoEstado) {
    if(!confirm("¿Confirmar cambio de estado?")) return;
    try {
        await fetch(`${API_URL}/mozo/estado/${id}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nuevoEstado })
        });
        cargarListaMozos();
    } catch (e) { alert("Error"); }
}