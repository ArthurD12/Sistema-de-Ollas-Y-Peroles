document.addEventListener('DOMContentLoaded', () => {
    // 1. SEGURIDAD: ¿Existe la llave?
    const usuarioActivo = localStorage.getItem('usuario_ollas');

    if (!usuarioActivo) {
        // Si no hay llave, te boto al login
        window.location.href = 'index.html';
    } else {
        // Si hay llave, pongo tu nombre
        const etiquetaNombre = document.getElementById('nombreUsuario');
        if (etiquetaNombre) {
            etiquetaNombre.textContent = 'Hola, ' + usuarioActivo;
        }
    }
});

function cerrarSesion() {
    localStorage.removeItem('usuario_ollas');
    window.location.href = 'index.html';
}

function irHerramientasTrabajo() {
    alert("Entrando a Zona de Trabajo...");
    // window.location.href = 'trabajo.html';
}

function irVistaCliente() {
    alert("Entrando a Vista Cliente...");
    // window.location.href = 'cliente.html';
}