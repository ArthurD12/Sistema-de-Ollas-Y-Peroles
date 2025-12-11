document.addEventListener('DOMContentLoaded', () => {

    const formulario = document.getElementById('formLogin');
    const mensajeError = document.getElementById('mensajeError');

    formulario.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que se recargue la página sola

        // 1. Capturar lo que escribió el usuario
        const usuario = document.getElementById('usuario').value;
        const password = document.getElementById('password').value;

        // Limpiar errores previos
        mensajeError.textContent = 'Verificando datos...';

        // 2. Validación básica (que no esté vacío)
        if (usuario === '' || password === '') {
            mensajeError.textContent = 'Por favor, complete todos los campos.';
            return;
        }

        // =======================================================
        // CÓDIGO NUEVO: CONEXIÓN REAL A TU BASE DE DATOS
        // =======================================================
        fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario: usuario, password: password })
        })
        .then(respuesta => respuesta.json())
        .then(data => {
            console.log("Respuesta del servidor:", data);

            if (data.exito === true) {
                // --- SI LA CONTRASEÑA ES CORRECTA EN POSTGRES ---
                
                // 1. Guardamos el usuario en la memoria del navegador
                localStorage.setItem('usuario_ollas', data.usuario);
                
                // 2. ¡Nos vamos al MENÚ!
                alert('¡Bienvenido ' + data.usuario + '!');
                window.location.href = 'menu.html'; 
                // NOTA: Si prefieres ir directo a los pedidos, cambia 'menu.html' por 'index.html'

            } else {
                // --- SI LA CONTRASEÑA ESTÁ MAL ---
                mensajeError.textContent = '❌ ' + data.mensaje;
                // Borramos la contraseña para que intente de nuevo
                document.getElementById('password').value = '';
            }
        })
        .catch(error => {
            // --- SI EL SERVIDOR ESTÁ APAGADO ---
            console.error('Error:', error);
            mensajeError.textContent = 'Error: No se pudo conectar. Revisa que el servidor (node server.js) esté prendido.';
        });
    });
});