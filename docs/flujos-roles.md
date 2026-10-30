# Flujos de cuentas y comercio

Una cuenta autenticada puede comprar y solicitar un negocio con el mismo UID.
El privilegio administrativo proviene exclusivamente del custom claim `admin`;
la habilitación del vendedor proviene de `vendedores/{uid}`.

## Registro y administración

- Sin sesión, el registro crea la cuenta y su perfil; el de vendedor también
  envía su solicitud en un batch. Después se abre el panel correspondiente.
- Con sesión, **Mi negocio → Registrar mi negocio** envía una solicitud para la
  cuenta actual, sin pedir otro correo ni otra contraseña.
- Una solicitud rechazada puede corregirse y reenviarse. Regresa a `pendiente`
  y se limpian los datos de revisión; el usuario nunca puede autoaprobarse.
- El administrador aprueba y crea el negocio en una transacción, rechaza con
  motivo y suspende/reactiva negocios desde **Negocios registrados**.
- La suspensión bloquea publicación, edición, imágenes, nuevas cotizaciones y
  aceptación de cotizaciones. Se permite terminar o cancelar pedidos existentes
  según sus estados para no abandonar compras ya acordadas.
- Los perfiles de vendedor se observan en vivo: un negocio suspendido desaparece
  del catálogo abierto. El catálogo consulta productos por vendedor activo y las
  reglas impiden al comprador leer productos de negocios suspendidos. El dueño
  conserva acceso a sus propios productos. El servidor verifica otra vez el
  estado comercial al cotizar y aceptar.

## Cotizaciones, pedidos e inventario

La interfaz solicita **una cotización por producto**. Cada pedido conserva una
copia de las cantidades, la presentación y el precio acordados. No hay carrito
con varios productos ni pagos electrónicos.

1. El comprador elige la cantidad de presentaciones y una nota opcional.
   `solicitarCotizacion` consulta el precio real y verifica vendedor activo,
   publicación, mínimo, existencias y que no sea una compra al propio negocio.
2. El vendedor responde con un precio por presentación y una nota opcional.
   La cotización vale 48 horas; puede rechazarse o cancelarse antes de aceptarse.
3. Al aceptar, `actualizarCotizacion` verifica la vigencia y las existencias,
   calcula los totales y reserva inventario en una transacción. El ID del pedido
   es el de la cotización, por lo que repetir la aceptación no duplica pedidos.
   Si ya venció, se marca `vencida` sin reservar. La interfaz también indica la
   vigencia; no se ejecuta una tarea programada de vencimiento masivo.
4. El vendedor avanza `pendienteConfirmacionVendedor → confirmado → preparando
   → listo → entregado`. Solo después de entregar puede declarar efectivo recibido.
5. El comprador cancela mientras falta confirmación. El vendedor también puede
   cancelar un pedido confirmado, antes de preparar. La cancelación devuelve las
   existencias una sola vez. Los pedidos preparados o entregados no se cancelan.

`guardarProducto` registra existencias iniciales y ajustes; las reservas y sus
devoluciones también crean movimientos de inventario, visibles en el panel del
vendedor. Las cantidades de los movimientos son diferencias con signo.
Las existencias son las presentaciones disponibles **sin las ya reservadas**.
Un formulario abierto antes de una reserva no puede sobrescribir esa reserva:
debe cerrarse y abrirse nuevamente. La presentación no cambia después de crear
el producto: para ofrecer otra presentación se crea otro producto.

Las funciones están en `functions/`, usan Node.js 22 y se ejecutan en
`us-central1`. Las reglas impiden escribir productos, pedidos, cotizaciones y
movimientos directamente desde el SDK del navegador.

## Fotografías

Guarda el producto y vuelve a abrirlo para editar sus fotos. Admite hasta cinco
JPG, PNG o WebP de hasta 5 MB cada una. Storage valida propietario, negocio
activo, producto, tamaño y tipo; `actualizarImagenes` solo modifica las rutas,
sin sobrescribir precio ni inventario. El catálogo muestra la primera imagen.
Las imágenes de catálogo no deben contener información privada: sus URL de
descarga pueden compartirse. Los archivos existentes no se borran al suspender.

## Desarrollo y pruebas

Instala las dependencias de ambos proyectos:

```powershell
npm.cmd ci
npm.cmd ci --prefix functions
```

Las pruebas necesitan Firebase CLI y Java 21 o superior disponible en `PATH`.
Usan exclusivamente `demo-fruteria-admin` y datos efímeros de emuladores.

```powershell
npm.cmd run build
npm.cmd run test:commerce
npm.cmd run test:flow
```

`test:commerce` valida reglas y transacciones, incluida concurrencia, reservas,
cancelaciones, permisos, suspensión y ediciones obsoletas. `test:flow` prueba
el recorrido con Authentication, Firestore, Functions y Storage reales de los
emuladores. No sustituye una prueba visual de la interfaz.

Para probar manualmente, usa `.env.local` con `VITE_USE_EMULATORS=true` y los
valores de configuración del proyecto demo (API key ficticia `demo-key`,
projectId `demo-fruteria-admin`, authDomain `demo-fruteria-admin.firebaseapp.com`,
storageBucket `demo-fruteria-admin.appspot.com`, senderId `1234567890` y appId
`1:1234567890:web:demo`). Inicia:

```powershell
firebase emulators:start --only auth,firestore,functions,storage --project demo-fruteria-admin
npm.cmd run dev
```

## Publicación

Para producción, `VITE_USE_EMULATORS` debe ser `false` al compilar. Functions
requiere que el proyecto Firebase tenga habilitada la facturación correspondiente.
No se utilizan cuentas de servicio en la aplicación web.
Publicar solamente Hosting o reglas deja incompleto el flujo: también deben
publicarse las cinco funciones y las reglas de Storage. Durante la actualización
conviene impedir sesiones de edición con la versión anterior del frontend.

```powershell
npm.cmd run build
firebase deploy --only functions:commerce,firestore:rules,firestore:indexes,storage,hosting --project fruteria-oxkutzcab
```

Antes de publicar, revisa los documentos antiguos: las solicitudes deben cumplir
el esquema completo y las cotizaciones antiguas con varios productos deben
reemplazarse por solicitudes nuevas por producto. Las cotizaciones nuevas y las
cuentas existentes conservan las colecciones en español; no se borran datos.
