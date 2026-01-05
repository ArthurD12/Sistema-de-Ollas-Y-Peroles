// CONFIGURACIÓN DEL SERVIDOR
// Si estás en la misma PC, usa localhost. Si usas celular, pon tu IP (ej: 192.168.1.15)
const API_URL = "http://localhost:3000/api";

// VARIABLES GLOBALES
let menuGlobal = {}; 
let pedidoActual = [];
let mozoActual = null;

// --- 1. AL CARGAR LA PÁGINA (RECUPERAR SESIÓN) ---
document.addEventListener('DOMContentLoaded', async () => {
    // Intentar recuperar al mozo de la memoria
    const mozoGuardado = localStorage.getItem("mozoSesion");
    
    if (mozoGuardado) {
        mozoActual = JSON.parse(mozoGuardado);
        document.getElementById("display-mozo").textContent = mozoActual.nombre;
        
        // Ir directo a la pantalla de pedidos
        mostrarPantalla("pantalla-pedidos");
        await cargarMenuDesdeDB();
        
        // Intentar recuperar un pedido que estaba a medias
        const pedidoGuardado = localStorage.getItem("pedidoEnCurso");
        if (pedidoGuardado) {
            pedidoActual = JSON.parse(pedidoGuardado);
            actualizarTicket();
        }

        // Iniciar el sistema de vigilancia (Notificaciones)
        setInterval(verificarPedidosListos, 5000);
    }
});

// --- 2. SISTEMA DE LOGIN ---
async function iniciarTurno() {
    const codigoInput = document.getElementById("input-codigo-mozo").value;
    
    if(!codigoInput) return alert("Ingresa un código");

    try {
        const respuesta = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigoInput })
        });
        const datos = await respuesta.json();

        if (datos.success) {
            mozoActual = datos.mozo;
            // Guardar en memoria para que no se salga al recargar
            localStorage.setItem("mozoSesion", JSON.stringify(mozoActual));

            document.getElementById("display-mozo").textContent = mozoActual.nombre;
            mostrarPantalla("pantalla-pedidos");
            await cargarMenuDesdeDB();
            
            // Activar notificaciones
            setInterval(verificarPedidosListos, 5000);
        } else {
            alert("❌ Código incorrecto");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión. Revisa que el servidor esté encendido.");
    }
}

function cerrarSesion() {
    if(confirm("¿Cerrar sesión?")) {
        localStorage.removeItem("mozoSesion");
        localStorage.removeItem("pedidoEnCurso");
        location.reload();
    }
}

// Función auxiliar para navegar entre pantallas
function mostrarPantalla(idPantalla) {
    // Ocultamos todas
    document.getElementById("pantalla-login").classList.add("oculto");
    document.getElementById("pantalla-pedidos").classList.add("oculto");
    document.getElementById("pantalla-historial").classList.add("oculto");
    
    // Mostramos la elegida
    document.getElementById(idPantalla).classList.remove("oculto");
}

function volverAPedidos() {
    mostrarPantalla("pantalla-pedidos");
}

// --- 3. LÓGICA DEL MENÚ ---
async function cargarMenuDesdeDB() {
    try {
        const respuesta = await fetch(`${API_URL}/productos`);
        menuGlobal = await respuesta.json();
        cargarCategoria('comidas'); // Carga inicial por defecto
    } catch (error) {
        console.error("Error cargando menú", error);
    }
}

function cargarCategoria(categoria) {
    const grid = document.getElementById("grid-productos");
    grid.innerHTML = "";
    
    // Estilos de botones (Tabs)
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const btnIndex = categoria === 'comidas' ? 0 : categoria === 'extras' ? 1 : 2;
    if(document.querySelectorAll(".tab")[btnIndex]) {
        document.querySelectorAll(".tab")[btnIndex].classList.add("active");
    }

    const productos = menuGlobal[categoria] || [];

    productos.forEach(prod => {
        const card = document.createElement("div");
        card.classList.add("card-producto");
        card.innerHTML = `
            <h4>${prod.nombre}</h4>
            <div class="precio">S/. ${prod.precio.toFixed(2)}</div>
        `;
        card.onclick = () => agregarAlPedido(prod);
        grid.appendChild(card);
    });
}

// --- 4. GESTIÓN DEL PEDIDO ACTUAL ---
function agregarAlPedido(prod) {
    pedidoActual.push(prod);
    actualizarTicket();
    // Guardar cambio en memoria
    localStorage.setItem("pedidoEnCurso", JSON.stringify(pedidoActual));
}

function eliminarDelPedido(index) {
    pedidoActual.splice(index, 1);
    actualizarTicket();
    // Guardar cambio en memoria
    localStorage.setItem("pedidoEnCurso", JSON.stringify(pedidoActual));
}

function actualizarTicket() {
    const lista = document.getElementById("lista-pedido");
    const txtTotal = document.getElementById("txt-total");
    lista.innerHTML = "";
    let total = 0;

    pedidoActual.forEach((item, index) => {
        total += item.precio;
        lista.innerHTML += `
            <div class="item-ticket">
                <span>${item.nombre}</span>
                <span>
                    S/. ${item.precio.toFixed(2)} 
                    <i class="fa-solid fa-trash btn-borrar" onclick="eliminarDelPedido(${index})"></i>
                </span>
            </div>
        `;
    });

    if(pedidoActual.length === 0) lista.innerHTML = '<div class="mensaje-vacio">Selecciona productos...</div>';
    txtTotal.textContent = "S/. " + total.toFixed(2);
}

async function enviarCocina() {
    const mesa = document.getElementById("input-mesa").value;
    
    if (pedidoActual.length === 0) return alert("⚠️ El pedido está vacío.");
    if (!mesa) return alert("⚠️ Falta indicar el número de MESA.");

    const total = pedidoActual.reduce((acc, el) => acc + el.precio, 0);

    const orden = {
        mesa: mesa,
        mozo: mozoActual.nombre,
        contenido: pedidoActual, 
        total: total
    };

    try {
        const respuesta = await fetch(`${API_URL}/pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orden)
        });
        const resultado = await respuesta.json();

        if (resultado.success) {
            alert(`✅ ¡Orden enviada a cocina! ID: ${resultado.id_pedido}`);
            
            // Limpiar pedido y memoria
            pedidoActual = [];
            localStorage.removeItem("pedidoEnCurso");
            
            document.getElementById("input-mesa").value = "";
            actualizarTicket();
        }
    } catch (error) {
        console.error(error);
        alert("Error al enviar pedido.");
    }
}

// --- 5. HISTORIAL Y NOTIFICACIONES ---

async function verificarPedidosListos() {
    if (!mozoActual) return;

    try {
        const res = await fetch(`${API_URL}/pedidos/mozo/${mozoActual.nombre}`);
        const pedidos = await res.json();

        // Buscamos pedidos que estén "completados" (Listos en cocina)
        const listos = pedidos.filter(p => p.estado === 'completado');

        if (listos.length > 0) {
            alert(`🔔 ¡PEDIDO LISTO PARA RECOGER!\n\nMesa: ${listos.map(p => p.mesa).join(', ')}`);
            
            // Marcar como entregados automáticamente para no repetir la alerta
            listos.forEach(p => fetch(`${API_URL}/pedido/entregar/${p.id}`, { method: 'POST' }));
            
            // Si el mozo está viendo el historial, recargarlo para ver el cambio de color
            if(!document.getElementById("pantalla-historial").classList.contains("oculto")){
                verHistorialMozo();
            }
        }
    } catch (error) {}
}

async function verHistorialMozo() {
    if (!mozoActual) return;
    
    mostrarPantalla("pantalla-historial");

    try {
        const res = await fetch(`${API_URL}/pedidos/mozo/${mozoActual.nombre}`);
        const pedidos = await res.json();
        
        const lista = document.getElementById("lista-historial-mozo");
        lista.innerHTML = "";

        if(pedidos.length === 0) {
            lista.innerHTML = "<p style='text-align:center; margin-top:20px;'>No has realizado pedidos hoy.</p>";
            return;
        }

        // Ordenar: Los más recientes arriba
        pedidos.sort((a, b) => b.id - a.id);

        pedidos.forEach(p => {
            // Decodificar contenido del pedido
            let descripcion = "Varios";
            let itemsArray = [];
            try { 
                itemsArray = JSON.parse(p.contenido);
                descripcion = itemsArray.map(i => i.nombre).join(", ");
            } catch(e){}

            // Configurar colores según estado
            let colorEstado = "#ffc107"; // Amarillo
            let textoEstado = "⏳ Pendiente";
            
            if(p.estado === 'completado') { 
                colorEstado = "#28a745"; // Verde
                textoEstado = "✅ Listo en Cocina"; 
            } else if (p.estado === 'entregado') { 
                colorEstado = "#007bff"; // Azul
                textoEstado = "🚀 Entregado"; 
            }

            // Preparar datos para el botón de imprimir
            const datosTicket = encodeURIComponent(JSON.stringify({
                id: p.id,
                mesa: p.mesa,
                mozo: p.mozo,
                fecha: p.fecha,
                total: p.total,
                items: itemsArray
            }));

            // Crear la tarjeta visual
            const card = document.createElement("div");
            card.style = `background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 5px solid ${colorEstado};`;
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size: 1.1rem;">
                    <span>Mesa ${p.mesa}</span>
                    <span>S/. ${p.total.toFixed(2)}</span>
                </div>
                <div style="color: #666; font-size: 0.9rem; margin: 8px 0; font-style:italic;">${descripcion}</div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid #eee;">
                    <span style="font-size:0.9rem; color:${colorEstado}; font-weight:bold;">${textoEstado}</span>
                    
                    <button onclick="imprimirTicketMozo('${datosTicket}')" style="background: #333; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; display:flex; align-items:center; gap:5px;">
                        <i class="fa-solid fa-print"></i> Ticket
                    </button>
                </div>
            `;
            lista.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        alert("Error cargando historial");
    }
}

// --- 6. IMPRESIÓN DE TICKET ---
function imprimirTicketMozo(datosString) {
    // 1. Recuperar datos
    const pedido = JSON.parse(decodeURIComponent(datosString));

    // 2. Construir filas de productos
    let itemsHtml = "";
    pedido.items.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.nombre}</td>
                <td class="t-derecha">S/. ${item.precio.toFixed(2)}</td>
            </tr>
        `;
    });

    // 3. Crear HTML del Ticket
    const ticketHtml = `
        <div class="t-header">
            <div class="t-titulo">OLLAS Y PEROLES</div>
            <div class="t-info">RUC: 20601234567</div>
            <div class="t-info">Av. Principal 123 - El Bosque</div>
        </div>
        <div class="t-info" style="margin-top:10px;">
            <strong>Ticket #: ${pedido.id}</strong><br>
            Fecha: ${new Date().toLocaleString()}<br>
            Mozo: ${pedido.mozo}<br>
            <strong>MESA: ${pedido.mesa}</strong>
        </div>
        <br>
        <table class="t-tabla">
            <thead>
                <tr>
                    <th>DESCRIPCIÓN</th>
                    <th class="t-derecha">IMPORTE</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        <div class="t-total">
            TOTAL: S/. ${pedido.total.toFixed(2)}
        </div>
        <div class="t-footer">
            ¡Gracias por su preferencia!<br>
            Propina no incluida
        </div>
    `;

    // 4. Inyectar y Mandar a Imprimir
    document.getElementById("ticket-impresion").innerHTML = ticketHtml;
    window.print();
}