export function App() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <header className="navbar navbar-expand-lg navbar-dark brand-header shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">
            <i className="bi bi-basket2-fill me-2" aria-hidden="true" />
            Frutería Oxkutzcab
          </a>
          <span className="navbar-text text-white-50">
            Venta de frutas al mayoreo
          </span>
        </div>
      </header>

      <main className="container flex-grow-1 py-5">
        <section className="row align-items-center g-4 py-lg-5">
          <div className="col-lg-7">
            <p className="text-success fw-semibold text-uppercase small mb-2">
              Plataforma para compradores y vendedores
            </p>
            <h1 className="display-5 fw-bold mb-3">
              Productos frescos al mayoreo, en un solo lugar.
            </h1>
            <p className="lead text-body-secondary mb-0">
              Estamos preparando un espacio donde varios vendedores podrán
              publicar sus productos y los compradores podrán solicitar
              cotizaciones y realizar pedidos.
            </p>
          </div>
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h2 className="h5 card-title">Base del proyecto lista para crecer</h2>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true" />
                    Interfaz con React y TypeScript
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true" />
                    Estilos y componentes de Bootstrap
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true" />
                    Firebase preparado para integrar
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-top bg-white py-3">
        <div className="container small text-body-secondary">
          Frutería Oxkutzcab · Plataforma de comercio al mayoreo
        </div>
      </footer>
    </div>
  );
}
