# Panel básico de administración

Ruta: `#admin-inicio`. Usa la misma sesión de Firebase Authentication que el resto
de la aplicación. Los administradores llegan a esta ruta al iniciar sesión;
también hay un enlace **Administración** en la pantalla de sesión iniciada.

## Permisos

El acceso requiere el custom claim `admin: true` en el token de Authentication.
Un campo en `usuarios`, un correo escrito en el frontend o conocer la URL no
conceden acceso. Las reglas comprueban el claim en cada operación.

La asignación inicial se hace desde una terminal confiable con Firebase Admin:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\ruta\cuenta-servicio.json"
npm run admin:claim -- correo@ejemplo.com grant
```

El script acepta correo o UID, conserva los demás claims y no crea cuentas.
Para retirar el permiso, sustituye `grant` por `revoke`. El token debe renovarse
tras cambiar permisos: cierra sesión y vuelve a entrar. El panel también ofrece
**Volver a verificar permisos** cuando una cuenta aún no tiene acceso. Un token
ya emitido puede conservar los permisos anteriores hasta su renovación o caducidad.
Nunca subas la cuenta de servicio a Git ni la incluyas en variables `VITE_`.

## Revisión de vendedores

El panel recibe solicitudes y perfiles en tiempo real. Permite filtrar por estado,
buscar por negocio, municipio, teléfono o UID, y consultar los datos del negocio,
la fecha y el historial de revisión. No expone los perfiles privados de usuarios.

- **Aprobar:** una transacción lee la solicitud y verifica que no exista perfil.
  Actualiza `estado`, `revisadoEn`, `revisadoPor` y `motivoRechazo`, y crea
  `vendedores/{uid}` activo con los datos originales de la solicitud.
- **Rechazar:** solo solicitudes pendientes y con un motivo obligatorio de hasta
  1000 caracteres. No crea perfil de vendedor.
- **Completar habilitación:** permite crear el perfil faltante de una solicitud
  aprobada manualmente. Registra una nueva revisión administrativa.

Una solicitud rechazada no se puede aprobar en este flujo. Un perfil existente
no se sobrescribe ni se reactiva, incluso si está suspendido. Dos revisiones
simultáneas se resuelven mediante la transacción: la segunda no pisa la primera.
Las reglas exigen que aprobación y creación de perfil ocurran juntas, preservan
los datos originales del negocio y prohíben que los usuarios se autoaprueben.
No se necesitan Cloud Functions para esta revisión administrativa.

## Verificación y despliegue

```powershell
npm run build
# Requiere Firebase CLI y Java 21 o posterior; usa un proyecto demo aislado.
npm run test:rules
firebase deploy --only firestore:rules --project fruteria-oxkutzcab
```

Las pruebas comprueban acceso privado, denegación de autoaprobación, escritura
atómica, coincidencia del perfil con la solicitud, rechazo con motivo, reparación
de aprobaciones incompletas y protección de perfiles existentes.

Para probar la interfaz, inicia sesión como administrador, abre `#admin-inicio`,
revisa una solicitud pendiente y confirma que el vendedor puede acceder a su
catálogo tras la aprobación. Los cambios de datos reales se hacen únicamente
cuando el administrador confirma su decisión.
