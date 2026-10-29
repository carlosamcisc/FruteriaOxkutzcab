import { BrandLogo } from "../../../shared/components/BrandLogo";

interface ClienteHeaderProps {
  nombre: string;
  correo: string;
  onNavigate: (sectionId: string) => void;
  onLogout: () => void;
}

export function ClienteHeader({ nombre, correo, onNavigate, onLogout }: ClienteHeaderProps) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <header className="site-header">
      <nav className="navbar navbar-expand-lg" aria-label="Navegación del cliente">
        <div className="container">
          <BrandLogo ariaLabel="Frutería Oxkutzcab, inicio" />

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#clienteNavigation"
            aria-controls="clienteNavigation"
            aria-label="Abrir menú"
          >
            <i className="bi bi-list" aria-hidden="true" />
          </button>

          <div className="collapse navbar-collapse" id="clienteNavigation">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
              <li className="nav-item">
                <button className="nav-link" type="button" onClick={() => onNavigate("catalogo")}>
                  Catálogo
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link" type="button" onClick={() => onNavigate("actividad")}>
                  Mi actividad
                </button>
              </li>
              <li className="nav-item dropdown">
                <button
                  className="client-user-toggle dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="client-avatar" aria-hidden="true">{iniciales || "?"}</span>
                  <span className="client-user-name">{nombre}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end client-user-menu">
                  <li className="dropdown-item-text">
                    <strong>{nombre}</strong>
                    <small>{correo}</small>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" type="button" onClick={onLogout}>
                      <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
