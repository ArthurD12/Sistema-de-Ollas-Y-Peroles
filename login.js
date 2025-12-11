document.addEventListener('DOMContentLoaded', () => {
    
    const formulario = document.getElementById('formLogin');
    const mensajeError = document.getElementById('mensajeError');

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Capturar datos
        const usuario = document.getElementById('usuario').value;
        const password = document.getElementById('password').value;

        // Limpiar mensajes anteriores
        mensajeError.textContent = '';

        // 2. Validación simple (Frontend)
        if (usuario === '' || password === '') {
            mensajeError.textContent = 'Por favor, complete todos los campos.';
            return;
        }

        // ---------------------------------------------------------
        // AQUÍ CONECTAREMOS LA BASE DE DATOS LUEGO
        // Por ahora, simulamos que verificamos credenciales:
        // ---------------------------------------------------------
        
        console.log("Intentando login con:", usuario);

        // SIMULACIÓN:
        if (usuario === 'admin' && password === '1234') {
            // Login Exitoso
            alert('¡Bienvenido al sistema!');
            
            // Redirigir al sistema principal (el archivo anterior)
            window.location.href = 'index.html'; 
        } else {
            // Login Fallido
            mensajeError.textContent = 'Usuario o contraseña incorrectos.';
            
            // Efecto visual de error en el input (opcional)
            document.getElementById('password').value = '';
            document.getElementById('usuario').focus();
        }
    });
});