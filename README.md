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
existencias. Firestore permite ahora que una cuenta autenticada cree y lea su
propio perfil y, para vendedores, su solicitud pendiente. El resto de
colecciones y Storage continúan protegidos hasta implementar sus flujos y
reglas específicas.
La configuración web de Firebase no sustituye esas reglas ni debe tratarse
como autorización.

### Organización prevista

- `src/app/`: arranque y estructura general de la interfaz.
- `src/features/`: funcionalidades agrupadas por dominio, por ejemplo
  autenticación, catálogo, inventario, cotizaciones y pedidos.
- `src/services/`: integraciones externas, incluida la inicialización de
  Firebase.
- `src/shared/`: componentes y utilidades reutilizables cuando existan.

La aplicación inicia en `src/main.tsx`. Las funcionalidades se incorporan
gradualmente en las ramas funcionales; no se conservan prototipos HTML
duplicados fuera de la aplicación React.

## Requisitos

- Node.js 20.19+ o 22.12+.
- npm, incluido con Node.js.
- Firebase CLI para autenticación, emuladores y despliegue.
- Acceso al proyecto Firebase `fruteria-oxkutzcab`.

## Comandos rápidos

Ejecuta todos los comandos desde la raíz del repositorio:

```powershell
# Instalar dependencias del proyecto
npm install

# Iniciar el servidor de desarrollo
npm run dev

# Comprobar tipos
npm run typecheck

# Crear la compilación de producción
npm run build

# Servir localmente la compilación de producción
npm run preview
```

Después de ejecutar `npm run dev`, abre la dirección que indique Vite,
normalmente `http://localhost:5173`.

## Configuración local de Firebase

La aplicación obtiene la configuración web desde variables `VITE_`. Si aún no
existe el archivo local, créalo en PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Completa `.env.local` con los valores de la aplicación web registrada en
Firebase. El archivo está excluido por `.gitignore` y nunca debe subirse al
repositorio. No coloques claves privadas, tokens de servicio ni credenciales de
Firebase Admin en variables `VITE_`.

La configuración local actual apunta al proyecto `fruteria-oxkutzcab`. La
aplicación base no inicializa Firebase hasta que alguna funcionalidad lo
solicita.

## Firebase CLI

La vinculación del repositorio se guarda en `.firebaserc`. Para preparar Firebase
en otro equipo:

```powershell
# Instalar la CLI una sola vez
npm install -g firebase-tools

# Iniciar sesión en el navegador
firebase login

# Vincular o cambiar el proyecto
firebase use --add

# Confirmar el proyecto activo
firebase use
firebase projects:list
```

El proyecto activo debe ser `fruteria-oxkutzcab`. Antes de desplegar, confirma
que estás en el repositorio y proyecto correctos.

## Emuladores de Firebase

`firebase.json` configura emuladores para Authentication, Firestore, Storage,
Hosting y la interfaz de administración local. Para iniciar los servicios:

```powershell
firebase emulators:start
```

Para iniciar solo los servicios necesarios:

```powershell
firebase emulators:start --only auth,firestore,storage
```

Direcciones configuradas:

| Servicio | Dirección |
| --- | --- |
| Authentication | `http://localhost:9099` |
| Firestore | `http://localhost:8080` |
| Storage | `http://localhost:9199` |
| Hosting | `http://localhost:5000` |
| Firebase Emulator UI | `http://localhost:4000` |

Los emuladores deben usarse antes de probar reglas con datos de desarrollo.
Firestore permite únicamente los documentos propios de `usuarios` y
`solicitudesVendedores` para cuentas autenticadas. Las demás colecciones y
Storage continúan denegando todo acceso hasta implementar sus reglas por rol.

Después de cambiar `firestore.rules`, publica las reglas en el proyecto
Firebase activo antes de probar el registro:

```powershell
firebase deploy --only firestore:rules --project fruteria-oxkutzcab
```

También confirma en Firebase Console que Authentication tenga habilitado el
proveedor **Correo electrónico/contraseña**.

El esquema de Firestore usa nombres de colecciones y campos en español. Si
existen documentos del esquema anterior en inglés, consulta la sección de
migración en [docs/firebase-data-model.md](./docs/firebase-data-model.md) antes
de eliminar datos antiguos.

## Despliegue de Firebase

Las reglas e índices se pueden publicar sin desplegar la interfaz:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

Para compilar y publicar la interfaz en Firebase Hosting:

```powershell
npm run build
firebase deploy --only hosting
```

Para publicar reglas, índices y Hosting en una sola operación:

```powershell
npm run build
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

No despliegues reglas permisivas como `allow read, write: if true`. Las reglas
deben probarse primero en los emuladores y revisarse junto con cada
funcionalidad.

## Solución de problemas frecuentes

### `firebase` no se reconoce como comando

Instala Firebase CLI globalmente y abre una nueva terminal:

```powershell
npm install -g firebase-tools
firebase --version
```

### `firebase projects:list` solicita autenticación

Vuelve a iniciar sesión:

```powershell
firebase login
firebase projects:list
```

### `git pull` indica que un archivo sería sobrescrito

Consulta primero el estado:

```powershell
git status --short --branch
```

No uses `git reset --hard` ni `git clean -fd` sin revisar antes los archivos.
Un `.env.local` debe conservarse localmente y no debe versionarse. Si el
conflicto es un archivo generado por Git que no contiene cambios propios, haz
una copia, actualiza la rama y verifica el resultado antes de eliminar la copia.

El esquema inicial de las colecciones, los estados y las decisiones de acceso
está documentado en [docs/firebase-data-model.md](./docs/firebase-data-model.md).
Firestore no requiere crear tablas por adelantado; los tipos en
`src/features/database/models.ts` documentan la forma de los documentos. No hay
que crear colecciones vacías manualmente: Firestore las crea al guardar el
primer documento. El repositorio está vinculado al proyecto
`fruteria-oxkutzcab`; aun así, las reglas deben validarse antes de habilitar
datos reales.

## Flujo de ramas

Consulta las ramas y su sincronización antes de trabajar:

```powershell
git fetch --prune origin
git branch -vv
git status --short --branch
```

Las funcionalidades se desarrollan en ramas cortas creadas desde `develop` y se
integran mediante Pull Request. `master` se reserva para versiones estables.
Después de integrar la arquitectura y el modelo de Firestore, las siguientes
ramas deben abordar autenticación, catálogo, inventario, cotizaciones y
pedidos.