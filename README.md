# Frutería Oxkutzcab

Plataforma web de comercio al mayoreo que conectará múltiples vendedores con
múltiples compradores. El pago se realizará en efectivo directamente al
vendedor; la plataforma registrará el estado del pedido, pero no procesará
pagos.

## Arquitectura inicial

- **React + TypeScript:** interfaz y módulos de la aplicación.
- **Vite:** servidor de desarrollo y compilación de archivos estáticos.
- **Bootstrap 5:** estilos y componentes adaptables.
- **Firebase:** Authentication para cuentas, Firestore para datos, Storage para
  imágenes y Hosting para publicar la aplicación.
- **Cloud Functions:** se evaluarán para operaciones que deban ejecutarse de
  forma confiable, como confirmar pedidos y actualizar inventario.

La interfaz no debe ser la autoridad para roles, precios, totales ni
existencias. Las reglas de Firestore y Storage comienzan denegando todo acceso;
deben ampliarse y probarse junto con cada funcionalidad antes de habilitarla.
La configuración web de Firebase no sustituye esas reglas ni debe tratarse
como autorización.

### Organización prevista

- `src/app/`: arranque y estructura general de la interfaz.
- `src/features/`: funcionalidades agrupadas por dominio, por ejemplo
  autenticación, catálogo, inventario, cotizaciones y pedidos.
- `src/services/`: integraciones externas, incluida la inicialización de
  Firebase.
- `src/shared/`: componentes y utilidades reutilizables cuando existan.

El HTML y JavaScript originales en `src/home/` y `src/js/` se conservan por
ahora como prototipo de referencia; la nueva aplicación inicia en `src/main.tsx`.
La migración de sus pantallas y datos ficticios se hará gradualmente en las
ramas funcionales.

## Requisitos

- Node.js 20.19+ o 22.12+.
- npm.
- Para emuladores y despliegues: Firebase CLI y acceso a un proyecto Firebase.

## Desarrollo local

```sh
npm install
npm run dev
```

Para configurar las variables locales, copia `.env.example` a `.env.local` y
completa los valores de configuración web de Firebase. `.env.local` no se debe
subir al repositorio. La aplicación base no inicializa Firebase hasta que una
funcionalidad lo solicite.

Comprobaciones disponibles:

```sh
npm run typecheck
npm run build
npm run preview
```

## Firebase

`firebase.json` configura Hosting, las reglas de Firestore y Storage, y los
puertos de los emuladores locales. Antes de desplegar, asocia el repositorio al
proyecto correcto con Firebase CLI y revisa las reglas. Las reglas iniciales
deniegan todas las operaciones, por lo que no se debe esperar que la aplicación
lea o guarde datos hasta implementar y probar los permisos de cada funcionalidad.

El esquema inicial de las colecciones, los estados y las decisiones de acceso
está documentado en [docs/firebase-data-model.md](./docs/firebase-data-model.md).
Firestore no requiere crear tablas por adelantado; los tipos en
`src/features/database/models.ts` documentan la forma de los documentos. No hay
un proyecto Firebase asociado todavía, así que el despliegue de reglas e índices
queda pendiente de configurar el ID del proyecto y validar las reglas en los
emuladores.

## Flujo de ramas

Las funcionalidades se desarrollan en ramas cortas y se integran mediante Pull
Request. `master` se reserva para versiones estables. La rama de modelo de
Firestore depende de la arquitectura React; ambas deben integrarse en orden
antes de continuar con autenticación, catálogo, inventario, cotizaciones y
pedidos.