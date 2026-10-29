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
| `pedidos` | ID generado por Firestore | Pedido confirmado, con copia inmutable de los productos, cantidades y precios acordados. Cada pedido corresponde a un vendedor. |
| `movimientosInventario` | ID generado por Firestore | Historial de entradas, salidas y ajustes. Debe ser de solo anexado y escrito por operaciones confiables. |

## Reglas del dominio

- Un usuario puede comprar y solicitar que se le habilite como vendedor. La
  aplicación nunca asigna privilegios de vendedor o administrador editando su
  perfil.
- Un administrador revisa `solicitudesVendedores`. Al aprobar, una operación
  confiable crea `vendedores/{uid}`. La suspensión del perfil impide seguir
  operando como vendedor.
- El catálogo puede incluir distintos vendedores. Cada cotización y pedido
  pertenece a uno solo; un carrito con productos de varios vendedores se divide
  en solicitudes independientes.
- Los precios se guardan como enteros en centavos de MXN (`unitPriceMinor`),
  nunca como números de punto flotante. Las cantidades son unidades de venta
  enteras y los importes del pedido se vuelven a calcular de forma confiable.
- La cotización conserva el precio solicitado y el cotizado. El pedido conserva
  una copia del nombre, presentación, cantidad y precio aceptados para que
  cambios futuros del producto no alteren el historial.
- El pago se realiza en efectivo al vendedor. `cashPaymentStatus` registra que
  el vendedor declara haber recibido el efectivo; la plataforma no procesa ni
  verifica físicamente el pago.
- La existencia publicada no es una reserva. La confirmación del pedido y el
  ajuste de existencias deben hacerse en una transacción confiable; no se debe
  descontar inventario directamente desde el navegador.

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

Las reglas actuales de Firestore permiten a una cuenta autenticada crear y
consultar únicamente su documento `usuarios/{uid}` y su solicitud
`solicitudesVendedores/{uid}`. Las demás colecciones y Storage deniegan todo
acceso hasta implementar sus flujos, reglas por rol/propietario y pruebas con
Firebase Emulator Suite. El formulario de registro usa Authentication con
correo y contraseña; el vendedor queda en estado `pendiente` y no recibe
privilegios desde el navegador.

No se ha asociado este repositorio a un proyecto Firebase, porque todavía no se
proporcionó un ID de proyecto. Cuando exista el proyecto y se hayan probado las
reglas, se pueden publicar únicamente las reglas e índices con:

```sh
firebase deploy --only firestore:rules,firestore:indexes --project <project-id>
```

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
