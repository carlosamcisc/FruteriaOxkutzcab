import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { logout } from "../../features/auth/services/authentication";
import { OrderList, QuoteList } from "../../features/cliente/components/ActivityList";
import { ClienteHeader } from "../../features/cliente/components/ClienteHeader";
import { ProductCard } from "../../features/cliente/components/ProductCard";
import { useClienteInicio } from "../../features/cliente/hooks/useClienteInicio";
import { FeedbackAlert, type Feedback } from "../../shared/components/FeedbackAlert";

const TODAS = "Todas";

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="client-loading" role="status">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      {message}
    </div>
  );
}

/** Solo se muestra con sesión iniciada; sin sesión redirige al inicio de sesión. */
export function ClienteInicioPage() {
  const { user, isLoading, error } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.hash = "#inicio-sesion";
    }
  }, [isLoading, user]);

  if (error) {
    return (
      <main className="container py-5">
        <FeedbackAlert feedback={{ type: "error", message: error }} />
      </main>
    );
  }

  if (!user) {
    return <LoadingState message="Verificando tu sesión..." />;
  }

  return <ClienteInicio user={user} />;
}

function ClienteInicio({ user }: { user: User }) {
  const {
    perfil,
    catalogo,
    isCatalogLoading,
    pedidos,
    cotizaciones,
    isActivityLoading,
    resumen,
    error,
  } = useClienteInicio(user.uid);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState(TODAS);
  const [logoutFeedback, setLogoutFeedback] = useState<Feedback | null>(null);

  const nombre = perfil?.nombre ?? user.displayName ?? user.email ?? "Cliente";
  const primerNombre = nombre.split(" ")[0];

  const categorias = useMemo(
    () => [TODAS, ...new Set(catalogo.map((producto) => producto.categoria))].sort((a, b) =>
      a === TODAS ? -1 : b === TODAS ? 1 : a.localeCompare(b, "es"),
    ),
    [catalogo],
  );

  const productosFiltrados = useMemo(() => {
    const termino = normalize(busqueda.trim());
    return catalogo.filter((producto) => {
      const coincideCategoria = categoria === TODAS || producto.categoria === categoria;
      const coincideBusqueda =
        !termino ||
        [producto.nombre, producto.descripcion, producto.vendedor.nombreNegocio, producto.categoria]
          .some((campo) => normalize(campo).includes(termino));
      return coincideCategoria && coincideBusqueda;
    });
  }, [catalogo, busqueda, categoria]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      setLogoutFeedback({ type: "error", message: "No pudimos cerrar la sesión. Intenta nuevamente." });
    }
  };

  const stats = [
    { icon: "bi-basket2", label: "Productos disponibles", value: resumen.productosDisponibles },
    { icon: "bi-shop", label: "Vendedores activos", value: resumen.vendedoresActivos },
    { icon: "bi-chat-square-text", label: "Cotizaciones activas", value: resumen.cotizacionesActivas },
    { icon: "bi-truck", label: "Pedidos en curso", value: resumen.pedidosEnCurso },
  ];

  return (
    <div className="app-shell client-page">
      <ClienteHeader
        nombre={nombre}
        correo={perfil?.correo ?? user.email ?? ""}
        onNavigate={scrollToSection}
        onLogout={handleLogout}
      />

      <main>
        <section className="client-hero" aria-labelledby="client-greeting">
          <div className="container">
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              Panel del comprador
            </span>
            <h1 id="client-greeting">
              Hola, <span>{primerNombre}</span>.
            </h1>
            <p>Encuentra productos frescos de vendedores de la región y da seguimiento a tus compras.</p>

            <div className="client-stats">
              {stats.map((stat) => (
                <div className="client-stat" key={stat.label}>
                  <i className={`bi ${stat.icon}`} aria-hidden="true" />
                  <strong>{stat.value}</strong>
                  <small>{stat.label}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="container">
          <FeedbackAlert feedback={logoutFeedback ?? (error ? { type: "error", message: error } : null)} />
        </div>

        <section className="client-section" id="catalogo" aria-labelledby="catalog-title">
          <div className="container">
            <div className="client-section-heading">
              <div>
                <span className="section-kicker">Catálogo</span>
                <h2 id="catalog-title">Productos publicados</h2>
              </div>
              <div className="catalog-search">
                <i className="bi bi-search" aria-hidden="true" />
                <input
                  className="form-control"
                  type="search"
                  placeholder="Buscar producto o vendedor"
                  aria-label="Buscar producto o vendedor"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                />
              </div>
            </div>

            {categorias.length > 1 && (
              <div className="category-chips" role="group" aria-label="Filtrar por categoría">
                {categorias.map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    className={opcion === categoria ? "active" : undefined}
                    aria-pressed={opcion === categoria}
                    onClick={() => setCategoria(opcion)}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
            )}

            {isCatalogLoading ? (
              <LoadingState message="Cargando catálogo..." />
            ) : productosFiltrados.length > 0 ? (
              <div className="row g-4">
                {productosFiltrados.map((producto) => (
                  <div className="col-sm-6 col-lg-4 col-xl-3" key={producto.id}>
                    <ProductCard producto={producto} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="catalog-empty">
                <span aria-hidden="true">🧺</span>
                {catalogo.length === 0 ? (
                  <>
                    <h3>Todavía no hay productos publicados</h3>
                    <p>Cuando los vendedores publiquen su oferta, la verás aquí al instante.</p>
                  </>
                ) : (
                  <>
                    <h3>No encontramos coincidencias</h3>
                    <p>Prueba con otra búsqueda o categoría.</p>
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={() => {
                        setBusqueda("");
                        setCategoria(TODAS);
                      }}
                    >
                      Limpiar filtros
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="client-section client-activity" id="actividad" aria-labelledby="activity-title">
          <div className="container">
            <span className="section-kicker">Seguimiento</span>
            <h2 id="activity-title">Mi actividad reciente</h2>
            <div className="row g-4 mt-1">
              <div className="col-lg-6">
                <div className="activity-card">
                  <h3><i className="bi bi-truck me-2" aria-hidden="true" />Pedidos</h3>
                  {isActivityLoading ? <LoadingState message="Cargando pedidos..." /> : <OrderList pedidos={pedidos} />}
                </div>
              </div>
              <div className="col-lg-6">
                <div className="activity-card">
                  <h3><i className="bi bi-chat-square-text me-2" aria-hidden="true" />Cotizaciones</h3>
                  {isActivityLoading ? (
                    <LoadingState message="Cargando cotizaciones..." />
                  ) : (
                    <QuoteList cotizaciones={cotizaciones} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
          <p className="mb-0">Productos frescos, negocios que crecen.</p>
          <small>© 2026 Frutería Oxkutzcab</small>
        </div>
      </footer>
    </div>
  );
}
