import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { isAdministrator, logout } from "../../features/auth/services/authentication";
import { observeApplications, observeSellers, type SolicitudConId, type VendedorConId } from "../../features/admin/services/administration";
import { ApplicationReview } from "../../features/admin/components/ApplicationReview";
import { setSellerStatus } from '../../features/admin/services/administration';
import { BrandLogo } from "../../shared/components/BrandLogo";

export function AdminPage() {
  const { user, isLoading, error } = useAuth();
  if (isLoading) return <main className="client-loading" role="status">Restaurando sesión…</main>;
  if (!user) return <main className="container py-5"><h1>Administración</h1><p>{error ?? "Inicia sesión con una cuenta administradora."}</p><a className="btn btn-primary" href="#inicio-sesion">Iniciar sesión</a></main>;
  return <AdminAccess key={user.uid} user={user} />;
}

function AdminAccess({ user }: { user: User }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setAllowed(null); setError("");
    isAdministrator(user, true).then(value => { if (current) setAllowed(value); }).catch(() => {
      if (current) setError("No pudimos verificar tus permisos. Comprueba la conexión e intenta nuevamente.");
    });
    return () => { current = false; };
  }, [user, attempt]);
  if (error || allowed === false) return <main className="container py-5"><h1>Administración</h1><div className="alert alert-warning" role="alert">{error || "Tu cuenta no tiene permiso de administrador."}</div><div className="d-flex flex-wrap gap-3"><button className="btn btn-primary" onClick={() => setAttempt(value => value + 1)}>Volver a verificar permisos</button><a className="btn btn-outline-success" href="#cliente-inicio">Ir a mi inicio</a></div></main>;
  if (allowed === null) return <main className="client-loading" role="status">Verificando permisos…</main>;
  return <AdminDashboard user={user} />;
}

function AdminDashboard({ user }: { user: User }) {
  const [savingSeller, setSavingSeller] = useState<string | null>(null);
  const [applications, setApplications] = useState<SolicitudConId[]>([]);
  const [sellers, setSellers] = useState<VendedorConId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("pendiente");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SolicitudConId | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const pending = new Set(["applications", "sellers"]);
    setLoading(true); setError("");
    const done = (name: string) => { pending.delete(name); setLoading(pending.size > 0); };
    const fail = (name: string) => { setError("No pudimos cargar la información. Comprueba tus permisos, la conexión y que las reglas de administración estén publicadas."); done(name); };
    const unsubscribes = [
      observeApplications(items => { setApplications(items); done("applications"); }, () => fail("applications")),
      observeSellers(items => { setSellers(items); done("sellers"); }, () => fail("sellers")),
    ];
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [attempt]);
  const sellerIds = new Set(sellers.map(seller => seller.id));
  const filtered = applications.filter(item => (filter === "todas" || item.estado === filter) && `${item.nombreNegocio} ${item.municipio} ${item.telefonoContacto} ${item.id}`.toLocaleLowerCase("es-MX").includes(search.toLocaleLowerCase("es-MX")));
  async function signOut() {
    try { await logout(); window.location.hash = "#inicio-sesion"; }
    catch { setError("No pudimos cerrar la sesión. Intenta nuevamente."); }
  }
  return <div className="client-page admin-page">
    <header className="site-header"><div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3"><BrandLogo /><nav className="d-flex flex-wrap align-items-center gap-3" aria-label="Cuenta administradora"><a className="text-white" href="#cliente-inicio">Ir al catálogo</a><button className="btn btn-outline-light btn-sm" onClick={signOut}>Cerrar sesión</button></nav></div></header>
    <main>
      <section className="client-hero"><div className="container"><span className="eyebrow">Administración</span><h1>Solicitudes de vendedores</h1><p>Revisa los negocios que quieren formar parte de Frutería Oxkutzcab.</p><div className="client-stats">
        {[["pendiente", "Pendientes", "bi-hourglass-split"], ["aprobada", "Aprobadas", "bi-check-circle"], ["rechazada", "Rechazadas", "bi-x-circle"]].map(([state, label, icon]) => <div className="client-stat" key={state}><i className={`bi ${icon}`} aria-hidden="true" /><strong>{loading || error ? "—" : applications.filter(item => item.estado === state).length}</strong><small>{label}</small></div>)}
      </div></div></section>
      <div className="container py-4">
        <section className="activity-card mb-4"><h2>Negocios registrados</h2>
          {sellers.map(seller => <div key={seller.id} className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom py-2">
            <span>{seller.nombreNegocio} · {seller.estado}</span>
            <button className="btn btn-outline-warning btn-sm" disabled={savingSeller !== null} onClick={async () => {
              setSavingSeller(seller.id); setError(''); setSuccess('');
              try { await setSellerStatus(seller.id, seller.estado === 'activo' ? 'suspendido' : 'activo'); setSuccess('Estado del negocio actualizado.'); }
              catch { setError('No se pudo cambiar el estado del negocio.'); }
              finally { setSavingSeller(null); }
            }}>{seller.estado === 'activo' ? 'Suspender' : 'Reactivar'}</button>
          </div>)}
        </section>
        {error && <div className="alert alert-danger" role="alert">{error} <button className="btn btn-sm btn-outline-danger" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}
        {!loading && !error && selected && <ApplicationReview key={selected.id} application={selected} adminUid={user.uid} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setSuccess("Revisión guardada correctamente."); }} />}
        <div className="client-section-heading"><h2>Revisión de solicitudes</h2><input type="search" className="form-control seller-search" aria-label="Buscar solicitudes" placeholder="Buscar negocio, municipio o UID" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <div className="category-chips" role="group" aria-label="Estado de solicitud">{[["pendiente", "Pendientes"], ["aprobada", "Aprobadas"], ["rechazada", "Rechazadas"], ["todas", "Todas"]].map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
        {loading ? <p role="status">Cargando solicitudes…</p> : error ? null : filtered.length === 0 ? <div className="catalog-empty"><i className="bi bi-inbox fs-1" aria-hidden="true" /><h3>No hay solicitudes en esta vista</h3><p>Cambia los filtros o espera a que se registren nuevos vendedores.</p></div> : <div className="row g-4">{filtered.map(item => <div className="col-lg-6" key={item.id}><article className="activity-card"><div className="d-flex flex-wrap justify-content-between gap-2"><h3>{item.nombreNegocio}</h3><span className={`status-pill status-${item.estado === "aprobada" ? "success" : item.estado === "rechazada" ? "danger" : "warning"}`}>{item.estado}</span></div><p className="text-secondary">{item.descripcion || "Sin descripción"}</p><dl className="admin-details"><dt>Municipio</dt><dd>{item.municipio}</dd><dt>Contacto</dt><dd>{item.telefonoContacto}</dd><dt>UID del solicitante</dt><dd>{item.propietarioId}</dd><dt>Fecha de solicitud</dt><dd>{item.enviadoEn?.toDate().toLocaleString("es-MX") ?? "Sin fecha"}</dd>{item.revisadoEn && <><dt>Revisada</dt><dd>{item.revisadoEn.toDate().toLocaleString("es-MX")}</dd><dt>Administrador</dt><dd>{item.revisadoPor ?? "Sin registro"}</dd></>}{item.motivoRechazo && <><dt>Motivo del rechazo</dt><dd>{item.motivoRechazo}</dd></>}</dl>
          {item.datosInvalidos && <p className="alert alert-warning">Esta solicitud antigua tiene datos incompletos. Revisa su documento antes de aprobarla.</p>}
          {item.estado === "aprobada" && !sellerIds.has(item.id) && <p className="alert alert-warning">Esta solicitud está aprobada, pero falta habilitar el perfil del negocio.</p>}
          {!item.datosInvalidos && !sellerIds.has(item.id) && (item.estado === "pendiente" || item.estado === "aprobada") && <button className="btn btn-outline-success" onClick={() => { setSelected(item); setSuccess(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{item.estado === "aprobada" ? "Completar habilitación" : "Revisar solicitud"}</button>}
          {sellerIds.has(item.id) && <p className="mb-0 text-secondary">El negocio ya tiene un perfil registrado.</p>}
        </article></div>)}</div>}
      </div>
    </main><footer className="site-footer mt-5"><div className="container">Frutería Oxkutzcab · Administración de vendedores</div></footer>
  </div>;
}
