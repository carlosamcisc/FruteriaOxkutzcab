import { useState } from "react";
import type { User } from "firebase/auth";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { logout } from "../../features/auth/services/authentication";
import { useVendedor } from "../../features/vendedor/hooks/useVendedor";
import { ProductForm } from "../../features/vendedor/components/ProductForm";
import type { ConId } from "../../features/vendedor/services/vendedor";
import type { Producto } from "../../shared/domain/models";
import { BrandLogo } from "../../shared/components/BrandLogo";

const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value / 100);
const labels: Record<string, string> = { pendienteConfirmacionVendedor: "Por confirmar", confirmado: "Confirmado", preparando: "Preparando", listo: "Listo para entrega", entregado: "Entregado", cancelado: "Cancelado", solicitada: "Solicitada", cotizada: "Cotizada", aceptada: "Aceptada", rechazada: "Rechazada", cancelada: "Cancelada", vencida: "Vencida" };

export function VendedorHomePage() {
  const { user, isLoading, error } = useAuth();
  if (isLoading) return <div className="client-loading" role="status">Restaurando sesión…</div>;
  if (!user) return <main className="container py-5"><h1>Panel del vendedor</h1><p>{error ?? "Inicia sesión para administrar tu negocio."}</p><a className="btn btn-primary" href="#inicio-sesion">Iniciar sesión</a></main>;
  return <SellerDashboard key={user.uid} user={user} />;
}

function SellerDashboard({ user }: { user: User }) {
  const { perfil, solicitud, productos, cotizaciones, pedidos, loading, activityLoading, error } = useVendedor(user.uid);
  const [tab, setTab] = useState("productos");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [editing, setEditing] = useState<ConId<Producto> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const active = perfil?.estado === "activo";
  async function signOut() {
    try { await logout(); window.location.hash = "#inicio-sesion"; }
    catch { setLogoutError("No pudimos cerrar la sesión. Intenta nuevamente."); }
  }
  const filtered = productos.filter(p => (filter === "todos" || p.estado === filter) && `${p.nombre} ${p.categoria}`.toLocaleLowerCase("es-MX").includes(search.toLocaleLowerCase("es-MX")));
  return <div className="client-page seller-page">
    <header className="site-header"><div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
      <BrandLogo /><nav className="d-flex align-items-center flex-wrap gap-3" aria-label="Cuenta"><a className="text-white" href="#cliente-inicio">Ir a comprar</a><button className="btn btn-outline-light btn-sm" onClick={signOut}>Cerrar sesión</button></nav>
    </div></header>
    <main>
      <section className="client-hero"><div className="container">
        <span className="eyebrow"><span className="eyebrow-dot" />Panel del vendedor</span>
        <h1>{perfil?.nombreNegocio ?? solicitud?.nombreNegocio ?? "Tu negocio"}</h1>
        <p>Administra tu catálogo y consulta la actividad de tu negocio desde un solo lugar.</p>
        <div className="client-stats">
          {[ ["bi-box-seam", loading || activityLoading ? "—" : productos.filter(p => p.estado === "publicado").length, "Productos publicados"], ["bi-chat-square-text", loading || activityLoading ? "—" : cotizaciones.filter(c => c.estado === "solicitada").length, "Cotizaciones por atender"], ["bi-truck", loading || activityLoading ? "—" : pedidos.filter(p => !["entregado", "cancelado"].includes(p.estado)).length, "Pedidos en curso"], ["bi-cash-stack", loading || activityLoading ? "—" : money(pedidos.filter(p => p.estado !== "cancelado" && p.estadoPagoEfectivo === "recibido").reduce((total, p) => total + p.subtotalCentavos, 0)), "Efectivo registrado"] ].map(([icon, value, label]) => <div className="client-stat" key={label}><i className={`bi ${icon}`} aria-hidden="true" /><strong>{value}</strong><small>{label}</small></div>)}
        </div>
      </div></section>
      <div className="container py-4">
        {(error || logoutError) && <div className="alert alert-danger" role="alert">{error || logoutError}</div>}
        {loading ? <p role="status">Cargando tu negocio…</p> : !perfil ? <section className="registration-card">
          <h2>{solicitud?.estado === "rechazada" ? "Solicitud rechazada" : solicitud ? "Tu solicitud está en revisión" : "Aún no tienes un negocio registrado"}</h2>
          <p>{solicitud?.estado === "rechazada" ? solicitud.motivoRechazo ?? "Contacta al administrador para conocer los detalles." : solicitud ? "Podrás administrar tus productos cuando el administrador habilite tu negocio." : "Solicita tu registro como vendedor para empezar a ofrecer tus productos."}</p>
          {!solicitud && <a className="btn btn-primary" href="#registro-vendedor">Registrar mi negocio</a>}
          {solicitud && <p className="mb-0 text-secondary">{solicitud.nombreNegocio} · {solicitud.municipio} · {solicitud.telefonoContacto}</p>}
        </section> : <>
          {!active && <div className="alert alert-warning" role="status">Tu negocio está suspendido. Puedes consultar tu información; contacta al administrador para reactivar la publicación de productos.</div>}
          <div className="seller-business mb-4"><i className="bi bi-shop" aria-hidden="true" /><div><strong>{perfil.nombreNegocio}</strong><p className="mb-0 text-secondary">{perfil.municipio} · {perfil.telefonoContacto}</p></div><span className={`status-pill status-${active ? "success" : "warning"}`}>{active ? "Negocio activo" : "Suspendido"}</span></div>
          <nav className="category-chips" aria-label="Secciones del vendedor">{[ ["productos", "Mis productos"], ["cotizaciones", "Cotizaciones"], ["pedidos", "Pedidos"] ].map(([id, label]) => <button key={id} aria-pressed={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>
          {tab === "productos" && <section aria-labelledby="seller-products">
            <div className="client-section-heading"><div><span className="section-kicker">Catálogo de tu negocio</span><h2 id="seller-products">Mis productos</h2></div><button className="btn btn-primary" disabled={!active} onClick={() => { setEditing(null); setFormOpen(true); }}>+ Nuevo producto</button></div>
            {formOpen && active && <ProductForm key={editing?.id ?? "new"} uid={user.uid} producto={editing} onClose={() => setFormOpen(false)} />}
            <div className="d-flex flex-wrap gap-3 mb-4"><input className="form-control seller-search" type="search" aria-label="Buscar mis productos" placeholder="Buscar por nombre o categoría" value={search} onChange={e => setSearch(e.target.value)} /><select className="form-select seller-search" aria-label="Filtrar por visibilidad" value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">Todos los estados</option><option value="publicado">Publicados</option><option value="borrador">Borradores</option><option value="pausado">Pausados</option></select></div>
            {activityLoading ? <p role="status">Cargando productos…</p> : filtered.length === 0 ? <div className="catalog-empty"><i className="bi bi-basket fs-1" aria-hidden="true" /><h3>{productos.length ? "No hay coincidencias" : "Tu catálogo empieza aquí"}</h3><p>{productos.length ? "Prueba con otra búsqueda o estado." : "Agrega tu primer producto para ofrecerlo a los compradores."}</p></div> : <div className="row g-4">{filtered.map(p => <div className="col-md-6 col-xl-4" key={p.id}><article className="activity-card d-flex flex-column"><div className="d-flex justify-content-between align-items-center mb-3"><span className="section-kicker">{p.categoria}</span><span className={`status-pill status-${p.estado === "publicado" ? "success" : "muted"}`}>{p.estado}</span></div><h3>{p.nombre}</h3><p className="text-secondary">{p.descripcion}</p><strong className="fs-4">{money(p.precioUnitarioCentavos)}</strong><p>por {p.presentacion}</p><dl className="product-meta mb-3"><div><dt>Disponibles</dt><dd>{p.cantidadDisponible}</dd></div><div><dt>Pedido mínimo</dt><dd>{p.cantidadMinimaPedido}</dd></div></dl><button className="btn btn-outline-success mt-auto" disabled={!active} onClick={() => { setEditing(p); setFormOpen(true); }}>Editar producto</button></article></div>)}</div>}
          </section>}
          {tab !== "productos" && <section><h2 className="mb-3">{tab === "pedidos" ? "Pedidos de tu negocio" : "Cotizaciones recibidas"}</h2><p className="text-secondary">Consulta los detalles y el estado registrado de cada solicitud.</p>
            {activityLoading ? <p role="status">Cargando actividad…</p> : (tab === "pedidos" ? pedidos : cotizaciones).length === 0 ? <div className="catalog-empty"><h3>{tab === "pedidos" ? "Todavía no tienes pedidos" : "Todavía no tienes cotizaciones"}</h3><p>Las solicitudes de tus compradores aparecerán aquí automáticamente.</p></div> : <div className="row g-3">{(tab === "pedidos" ? pedidos : cotizaciones).map(item => <div className="col-lg-6" key={item.id}><article className="activity-card"><div className="d-flex flex-wrap justify-content-between gap-2"><h3>Solicitud {item.id.slice(0, 8)}</h3><span className="status-pill status-info">{labels[item.estado] ?? item.estado}</span></div><small className="text-secondary">{item.creadoEn?.toDate().toLocaleDateString("es-MX") ?? "Guardando fecha…"}</small><ul className="seller-lines">{item.elementos.map((line, index) => <li key={`${line.productoId}-${index}`}>{line.nombreProducto} · {line.cantidad} × {line.presentacion}</li>)}</ul>{"subtotalCentavos" in item ? <p className="mb-0"><strong>{money(item.subtotalCentavos)}</strong> · Efectivo {item.estadoPagoEfectivo}</p> : <>{item.notaComprador && <p>Nota del comprador: {item.notaComprador}</p>}{item.notaVendedor && <p>Respuesta: {item.notaVendedor}</p>}</>}</article></div>)}</div>}
          </section>}
        </>}
      </div>
    </main><footer className="site-footer mt-5"><div className="container">Frutería Oxkutzcab · Productos frescos, negocios que crecen.</div></footer>
  </div>;
}
