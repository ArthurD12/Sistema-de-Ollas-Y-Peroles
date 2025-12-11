const formulario = document.getElementById('formLogin');
const mensajeError = document.getElementById('mensajeError');

formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    mensajeError.textContent = 'Verificando...';
    mensajeError.style.color = 'blue';

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario, password: password })
    })
    .then(respuesta => respuesta.json())
    .then(data => {
        if (data.exito === true) {
            // 1. Guardar sesión
            localStorage.setItem('usuario_ollas', data.usuario);
            
            // 2. REDIRIGIR AL MENÚ
            window.location.href = 'menu.html'; 

        } else {
            mensajeError.textContent = '❌ ' + data.mensaje;
            mensajeError.style.color = 'red';
            document.getElementById('password').value = '';
        }
    })
    .catch(error => {
        console.error(error);
        mensajeError.textContent = 'Error: No se conecta al servidor (Revisa que node server.js esté prendido)';
        mensajeError.style.color = 'red';
    });
});