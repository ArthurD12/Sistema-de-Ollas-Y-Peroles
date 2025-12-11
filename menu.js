document.addEventListener('DOMContentLoaded', () => {
    // Recuperar el nombre del usuario guardado en el Login
    const usuario = localStorage.getItem('usuario_ollas');
    
    // Si no hay usuario, significa que no se logueó -> Lo botamos al login
    if (!usuario) {
        window.location.href = 'index.html'; // O login.html según como lo hayas llamado
    } else {
        document.getElementById('nombreUsuario').textContent = 'Hola, ' + usuario;
    }
});

function cerrarSesion() {
    localStorage.removeItem('usuario_ollas');
    window.location.href = 'index.html';
}

function irAPedidos() {
    // Aquí redirigimos a la pantalla de pedidos que hicimos antes
    // Asegúrate de que tu archivo anterior se llame 'pedidos.html' o similar
    window.location.href = 'pedidos.html'; 
}

function irACocina() {
    window.location.href = 'pedidos.html'; 
}