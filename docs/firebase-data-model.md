# Modelo inicial de datos de Firebase

Este documento describe el esquema de la primera versión. Cloud Firestore no
requiere declarar tablas ni columnas antes de usarlo: los documentos se crean
al escribirlos. Los tipos de TypeScript en `src/shared/domain/models.ts`
sirven como contrato de la aplicación; no sustituyen las reglas de seguridad.

## Colecciones

| Colección | ID del documento | Propósito y acceso previsto |
| --- | --- | --- |
| `usuarios` | UID de Firebase Authentication | Perfil privado de la cuenta. Cada usuario puede consultar y actualizar solo los campos de su perfil. No es fuente de roles. |
| `solicitudesVendedores` | UID solicitante | Solicitud privada de alta como vendedor. El dueño consulta su solicitud; su aprobación la realiza un administrador confiable. |
| `vendedores` | UID del vendedor | Perfil público del negocio y estado de habilitación. La creación, aprobación y suspensión son operaciones administrativas confiables. |
| `productos` | ID generado por Firestore | Catálogo. Cada producto identifica al vendedor propietario. Se publican productos de vendedores aprobados. |
| `cotizaciones` | ID generado por Firestore | Solicitud y respuesta de cotización. Cada documento corresponde a un comprador y a un solo vendedor. |
| `pedidos` | ID de la cotización | Pedido confirmado, con copia inmutable de los productos, cantidades y precios acordados. Cada pedido corresponde a un vendedor. |
| `movimientosInventario` | ID generado por Firestore | Historial de entradas, salidas y ajustes. Debe ser de solo anexado y escrito por operaciones confiables. |

## Reglas del dominio

- Un usuario puede comprar y solicitar que se le habilite como vendedor. La
  aplicación nunca asigna privilegios de vendedor o administrador editando su
  perfil.
- Un administrador revisa `solicitudesVendedores`. Al aprobar, una operación
  confiable crea `vendedores/{uid}`. La suspensión del perfil impide seguir
  operando como vendedor.
- El catálogo incluye varios vendedores. La interfaz crea una cotización y un
  pedido por producto; cada pedido conserva un único vendedor.
- Los precios se guardan como enteros en centavos de MXN (`precioUnitarioCentavos`),
  nunca como números de punto flotante. Las cantidades son unidades de venta
  enteras y los importes del pedido se vuelven a calcular de forma confiable.
- La cotización conserva el precio solicitado y el cotizado. El pedido conserva
  una copia del nombre, presentación, cantidad y precio aceptados para que
  cambios futuros del producto no alteren el historial.
- El pago se realiza en efectivo al vendedor. `estadoPagoEfectivo` registra que
  el vendedor declara haber recibido el efectivo; la plataforma no procesa ni
  verifica físicamente el pago.
- La aceptación reserva existencias y crea el pedido en una transacción de
  servidor. Las cancelaciones permitidas devuelven la reserva una sola vez.

## Operaciones confiables

El cliente no debe decidir roles, aprobar vendedores, cambiar propietarios,
aceptar cotizaciones en nombre de otra parte, fijar el total de un pedido,
marcar movimientos de inventario ni descontar existencias. Estas operaciones
requieren Cloud Functions con Firebase Admin SDK u otro entorno confiable. El
uso de Functions no implica mantener un servidor propio.

## Índices

`firestore.indexes.json` declara índices compuestos previstos para:

- productos publicados por vendedor y ordenados por actualización;
- productos por estado y categoría;
- cotizaciones y pedidos por comprador o vendedor, estado y fecha.

Firestore también puede solicitar índices adicionales cuando se definan las
consultas reales de la interfaz.

## Seguridad y despliegue

Las reglas validan perfiles, solicitudes y revisión administrativa. Los datos
comerciales se escriben mediante funciones autenticadas y transacciones de
servidor; los participantes consultan sus pedidos y cotizaciones. Storage admite
fotografías por propietario con límites de tamaño y formato.

El proyecto está vinculado a `fruteria-oxkutzcab`. Consulta [flujos por rol](flujos-roles.md)
para los permisos actuales, pruebas con proyecto demo y publicación completa.

## Migración del esquema anterior

Si ya existen documentos en las colecciones con nombres en inglés, la
migración copia sus documentos al esquema en español y conserva los originales.
No se deben eliminar las colecciones antiguas hasta verificar la información:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\ruta\cuenta-servicio.json"
npm run migrate:firestore-schema
```

La cuenta de servicio se obtiene desde Firebase Console y no debe subirse al
repositorio. El script migra también los estados a sus valores en español.

## Panel del vendedor

La ruta `#vendedor-inicio` consulta el perfil y la solicitud del usuario autenticado.
Al iniciar sesión se dirige a esta ruta si existe su perfil o solicitud de vendedor.
Desde el inicio del comprador también se accede mediante **Mi negocio**.

Los vendedores activos pueden crear y editar sus productos (precio en centavos
MXN, presentación, mínimo de compra, existencia publicada y visibilidad).
Los cambios se guardan en Firestore y se reciben en tiempo real, sin datos de
muestra. Pausar un producto permite retirarlo del catálogo sin borrar su historial.
La aceptación de cotizaciones reserva inventario. Los ajustes, reservas y
devoluciones quedan registrados en `movimientosInventario`. El panel permite
responder cotizaciones, avanzar pedidos, registrar efectivo tras entregar y
administrar fotografías. Consulta [el flujo comercial](flujos-roles.md).

Una solicitud pendiente no concede acceso al catálogo del vendedor. La aprobación
requiere que un administrador cree `vendedores/{uid}` con el esquema de
`PerfilVendedor`, `propietarioId` igual al UID y `estado: "activo"`. El navegador
del solicitante no puede aprobar solicitudes ni crear ese perfil. Una cuenta suspendida puede
consultar sus datos y terminar pedidos existentes; no puede modificar productos
ni recibir nuevas compras.

Para usar el panel contra Firebase real, deben estar publicadas las reglas de
este cambio. Antes del despliegue, verificar en emuladores que un vendedor activo
puede escribir solo sus productos, que clientes y cuentas suspendidas no pueden
hacerlo, y que los pedidos y cotizaciones de otros usuarios permanecen privados.

```powershell
firebase deploy --only firestore:rules --project fruteria-oxkutzcab
```

## Revisión desde el panel de administración

El flujo administrativo de `#admin-inicio` usa el custom claim `admin: true` de
Firebase Authentication. Las reglas permiten a esas cuentas listar solicitudes,
rechazar solicitudes pendientes con motivo o aprobar y crear el perfil público
en una misma escritura atómica. Se registran `revisadoPor` y `revisadoEn`.
La aprobación incompleta puede repararse desde el mismo panel; los perfiles ya
existentes no se sobrescriben. Los roles siguen sin depender de `usuarios`.
La cuenta de servicio se utiliza solo en terminal para asignar el claim inicial.
Consulta [el panel de administración](admin-panel.md) para configurar el acceso.
