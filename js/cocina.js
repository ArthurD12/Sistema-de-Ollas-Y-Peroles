// ⚠️ IMPORTANTE: CAMBIA ESTA IP POR LA DE TU COMPUTADORA
const API_URL = "http://192.168.100.8:3000/api";

let pedidosActualesIds = [];

// Reloj
setInterval(() => {
    document.getElementById('reloj').textContent = new Date().toLocaleTimeString();
}, 1000);

// --- CARGAR PENDIENTES (ARRIBA) ---
async function cargarPedidos() {
    try {
        const response = await fetch(`${API_URL}/cocina`);
        const pedidos = await response.json();
        const contenedor = document.getElementById('contenedor-pedidos');
        
        if (pedidos.length === 0) {
            contenedor.innerHTML = '<div class="mensaje-vacio">✅ Todo al día.</div>';
            pedidosActualesIds = [];
            return;
        }

        // Alerta de sonido
        const nuevosIds = pedidos.map(p => p.id);
        if (nuevosIds.some(id => !pedidosActualesIds.includes(id))) {
            const audio = document.getElementById('alerta-sonido');
            if(audio) audio.play().catch(e => console.log("Click para activar sonido"));
        }
        pedidosActualesIds = nuevosIds;

        contenedor.innerHTML = "";
        
        pedidos.forEach(pedido => {
            let platos = [];
            try { platos = JSON.parse(pedido.contenido); } catch (e) {}
            const listaPlatos = platos.map(p => `<li>• ${p.nombre}</li>`).join('');

            const card = document.createElement('div');
            card.classList.add('ticket');
            card.innerHTML = `
                <div class="ticket-header">
                    <div><span class="mesa">Mesa ${pedido.mesa}</span><span class="mozo">${pedido.mozo}</span></div>
                    <span class="hora">#${pedido.id}</span>
                </div>
                <div class="ticket-body"><ul>${listaPlatos}</ul></div>
                <div class="ticket-footer">
                    <button class="btn-listo" onclick="terminarPedido(${pedido.id})">
                        <i class="fa-solid fa-check"></i> ¡LISTO!
                    </button>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) { console.error("Error cocina", error); }
}

// --- CARGAR HISTORIAL (ABAJO) ---
async function cargarHistorialVisual() {
    try {
        const response = await fetch(`${API_URL}/historial`);
        const historial = await response.json();
        const contenedor = document.getElementById('contenedor-historial');
        contenedor.innerHTML = "";

        // Mostramos los últimos 5 despachados
        historial.slice(0, 5).forEach(pedido => {
            let platos = [];
            try { platos = JSON.parse(pedido.contenido); } catch (e) {}
            const listaPlatos = platos.map(p => `<li>${p.nombre}</li>`).join('');

            const card = document.createElement('div');
            card.classList.add('ticket');
            card.style.borderLeft = "10px solid #555"; // Borde gris para diferenciar
            card.style.opacity = "0.8";

            card.innerHTML = `
                <div class="ticket-header" style="background:#444; color:#ccc;">
                    <span>Mesa ${pedido.mesa} (${pedido.mozo})</span>
                    <span style="font-size:0.8rem">✅ Despachado</span>
                </div>
                <div class="ticket-body" style="background:#ddd;">
                    <ul style="color:#333; font-size:1rem;">${listaPlatos}</ul>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) { console.error("Error historial", error); }
}

async function terminarPedido(id) {
    if(!confirm("¿Ya salió este pedido?")) return;
    try {
        await fetch(`${API_URL}/pedido/terminar/${id}`, { method: 'POST' });
        cargarPedidos(); 
        cargarHistorialVisual(); // Actualizamos ambas listas
    } catch (error) { alert("Error."); }
}

// INICIO
document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();
    cargarHistorialVisual();
    setInterval(() => {
        cargarPedidos();
        cargarHistorialVisual();
    }, 5000);
});