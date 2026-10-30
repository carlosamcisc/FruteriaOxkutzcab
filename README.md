# Frutería Oxkutzcab

Plataforma web de comercio al mayoreo que conectará múltiples vendedores con
múltiples compradores. El pago se realizará en efectivo directamente al
vendedor; la plataforma registrará el estado del pedido, pero no procesará
pagos.

Consulta los [flujos actuales por rol, pruebas y publicación](docs/flujos-roles.md).

## Arquitectura

- **React + TypeScript:** interfaz y módulos de la aplicación.
- **Vite:** servidor de desarrollo y compilación de archivos estáticos.
- **Bootstrap 5:** estilos y componentes adaptables.
- **Firebase:** Authentication para cuentas, Firestore para datos, Storage para
  imágenes y Hosting para publicar la aplicación.
- **Cloud Functions:** valida productos, cotizaciones, pedidos e inventario en
  el servidor.

La interfaz no es la autoridad para roles, precios, totales ni existencias.
Firestore valida perfiles y solicitudes por propietario, y las operaciones
administrativas por custom claim. Las funciones autenticadas escriben los datos
comerciales. Storage admite fotos de productos con límites por propietario,
formato y tamaño.
La configuración web de Firebase no sustituye esas reglas ni debe tratarse
como autorización.

### Organización prevista

```
src/
  app/                  App.tsx (monta AuthProvider) y routes.tsx (mapa de rutas por hash)
  pages/                páginas completas; solo componen layouts y features
    publico/            BienvenidaPage
    autenticacion/      InicioSesion, SeleccionRol, RegistroCliente, RegistroVendedor
    cliente/ vendedor/  paneles por rol
  features/             funcionalidades por dominio
    auth/
      context/          AuthProvider: única suscripción al estado de sesión
      hooks/            useAuth (sesión), useLogin, useRegistration
      services/         llamadas a Firebase Auth y Firestore del flujo de cuentas
      utils/            mapAuthError: códigos de Firebase → mensajes
      components/       RegistrationForm
    landing/data/       contenido estático de la página de bienvenida
  shared/
    components/         AuthLayout, RegistrationPageLayout, BrandLogo, FeedbackAlert
    domain/             models.ts (tipos de documentos) y paths.ts (rutas de Firestore)
  services/             inicialización de Firebase (firebase.ts, auth.ts, firestore.ts)
```

Reglas de dependencia: `pages → features → shared/services`. Una feature no
importa de `app/` ni de otra página, y `services/` y `shared/` no importan de
`features/`. Para conocer la sesión actual usa `useAuth()`; no te suscribas a
`onAuthStateChanged` desde componentes.

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
npm install --prefix functions

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
aplicación inicializa Firebase Authentication al cargar la interfaz para
restaurar una sesión existente; el resto de servicios se inicializa cuando se
utiliza su funcionalidad.

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
firebase emulators:start --only auth,firestore,functions,storage
```

Direcciones configuradas:

| Servicio | Dirección |
| --- | --- |
| Authentication | `http://localhost:9099` |
| Functions | `http://localhost:5001` |
| Firestore | `http://localhost:8080` |
| Storage | `http://localhost:9199` |
| Hosting | `http://localhost:5000` |
| Firebase Emulator UI | `http://localhost:4000` |

Para conectar la interfaz a los emuladores configura `VITE_USE_EMULATORS=true`.
Consulta la configuración demo y las pruebas en [flujos por rol](docs/flujos-roles.md).
Las pruebas requieren Java 21 o superior. Iniciar los emuladores por sí solo no
cambia la conexión de la interfaz: activa la variable antes de arrancar Vite.

Después de cambiar `firestore.rules`, publica las reglas en el proyecto
Firebase activo antes de probar el registro:

```powershell
firebase deploy --only firestore:rules --project fruteria-oxkutzcab
```

También confirma en Firebase Console que Authentication tenga habilitado el
proveedor **Correo electrónico/contraseña**.

La página de inicio de sesión está disponible en la sección **Ingresar** de la
interfaz. Usa `signInWithEmailAndPassword` con cuentas reales de Firebase,
conserva la sesión mediante el estado de Authentication, permite cerrar sesión
y ofrece recuperación de contraseña por correo. Para probarla, registra una
cuenta desde la misma aplicación o crea un usuario en Firebase Console y
confirma que el proveedor de correo y contraseña esté habilitado.

El esquema de Firestore usa nombres de colecciones y campos en español. Si
existen documentos del esquema anterior en inglés, consulta la sección de
migración en [docs/firebase-data-model.md](./docs/firebase-data-model.md) antes
de eliminar datos antiguos.

## Despliegue de Firebase

Las reglas e índices se pueden publicar sin desplegar la interfaz:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

Después de publicar las funciones y reglas indicadas en [flujos por rol](docs/flujos-roles.md), puedes actualizar solo la interfaz:

```powershell
npm run build
firebase deploy --only hosting
```

Para publicar funciones, reglas, índices, Storage y Hosting en una sola operación:

```powershell
npm run build
firebase deploy --only functions:commerce,firestore:rules,firestore:indexes,storage,hosting
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
`src/shared/domain/models.ts` documentan la forma de los documentos. No hay
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
## Panel del vendedor

Disponible en `#vendedor-inicio` y desde **Mi negocio** en el panel del comprador.
Incluye catálogo editable para vendedores activos y consulta en tiempo real de
cotizaciones y pedidos propios. Las cuentas pendientes o suspendidas muestran su
estado y no pueden publicar productos. Consulta los requisitos de aprobación y
publicación de reglas en [el modelo de Firebase](docs/firebase-data-model.md#panel-del-vendedor).

## Panel de administración

La ruta `#admin-inicio` permite revisar solicitudes reales de vendedores y aprobar
el negocio junto con la creación de su perfil en una sola transacción. El acceso
requiere un custom claim administrativo de Firebase Authentication. Consulta
[la configuración, permisos y pruebas](docs/admin-panel.md).
