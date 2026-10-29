import { useState } from "react";
import type { FormEvent } from "react";
import {
  registerCustomer,
  registerSeller,
  type CustomerRegistrationData,
  type SellerRegistrationData,
} from "../services/registration";

const benefits = [
  {
    icon: "bi-shop-window",
    title: "Encuentra proveedores",
    description:
      "Conecta con vendedores locales y descubre productos frescos disponibles al mayoreo.",
  },
  {
    icon: "bi-tags",
    title: "Cotiza con claridad",
    description:
      "Compara presentaciones, cantidades mínimas y precios antes de confirmar tu pedido.",
  },
  {
    icon: "bi-box-seam",
    title: "Compra con confianza",
    description:
      "Consulta la disponibilidad y da seguimiento a tus pedidos directamente con cada vendedor.",
  },
];

const steps = [
  { number: "01", title: "Explora", description: "Revisa el catálogo de distintos vendedores." },
  { number: "02", title: "Solicita", description: "Indica los productos y cantidades que necesitas." },
  { number: "03", title: "Acuerda", description: "Recibe una cotización y confirma los detalles." },
];

export function App() {
  const [registrationType, setRegistrationType] = useState<"customer" | "seller">("customer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const handleRegistrationTypeChange = (type: "customer" | "seller") => {
    setRegistrationType(type);
    setFeedback(null);
  };

  const handleRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const commonData: CustomerRegistrationData = {
      displayName: String(formData.get("nombre") ?? ""),
      email: String(formData.get("correo") ?? ""),
      password: String(formData.get("contrasena") ?? ""),
      phone: String(formData.get("telefono") ?? ""),
    };

    try {
      if (registrationType === "seller") {
        const sellerData: SellerRegistrationData = {
          ...commonData,
          businessName: String(formData.get("nombreNegocio") ?? ""),
          description: String(formData.get("descripcion") ?? ""),
          municipality: String(formData.get("municipio") ?? ""),
        };
        await registerSeller(sellerData);
      } else {
        await registerCustomer(commonData);
      }

      form.reset();
      setFeedback({
        type: "success",
        message:
          registrationType === "seller"
            ? "Tu cuenta fue creada. Tu solicitud de vendedor quedó pendiente de revisión."
            : "Tu cuenta fue creada correctamente. Ya puedes comenzar a comprar.",
      });
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : error instanceof Error
            ? error.message
            : "";
      let message = "No pudimos completar el registro. Intenta nuevamente.";

      if (code.includes("auth/email-already-in-use")) {
        message = "Este correo ya está registrado. Intenta iniciar sesión.";
      } else if (code.includes("auth/invalid-email")) {
        message = "El correo electrónico no es válido.";
      } else if (code.includes("auth/weak-password")) {
        message = "La contraseña debe tener al menos 6 caracteres.";
      } else if (code.includes("auth/network-request-failed")) {
        message = "No hay conexión con Firebase. Revisa tu conexión a internet.";
      } else if (
        code.includes("permission-denied") ||
        code.includes("PERMISSION_DENIED")
      ) {
        message =
          "Firebase rechazó el guardado del perfil. Publica las reglas de Firestore y vuelve a intentarlo.";
      } else if (code.includes("auth/operation-not-allowed")) {
        message =
          "El registro con correo y contraseña no está habilitado en Firebase Authentication.";
      } else if (code.includes("Falta configurar Firebase")) {
        message = code;
      }

      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="navbar navbar-expand-lg" aria-label="Navegación principal">
          <div className="container">
            <a className="navbar-brand brand-lockup" href="#inicio" aria-label="Frutería Oxkutzcab, inicio">
              <span className="brand-mark" aria-hidden="true">
                <i className="bi bi-basket2-fill" />
              </span>
              <span>
                <strong>Frutería</strong>
                <small>Oxkutzcab</small>
              </span>
            </a>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNavigation"
              aria-controls="mainNavigation"
              aria-label="Abrir menú"
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>

            <div className="collapse navbar-collapse" id="mainNavigation">
              <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
                <li className="nav-item">
                  <a className="nav-link" href="#como-funciona">Cómo funciona</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#beneficios">Beneficios</a>
                </li>
                <li className="nav-item">
                  <a className="btn btn-outline-light rounded-pill px-4" href="#acceso">
                    Ingresar
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero-section" id="inicio">
          <div className="hero-decoration hero-decoration-one" aria-hidden="true" />
          <div className="hero-decoration hero-decoration-two" aria-hidden="true" />
          <div className="container position-relative">
            <div className="row align-items-center g-5">
              <div className="col-lg-7">
                <div className="eyebrow">
                  <span className="eyebrow-dot" aria-hidden="true" />
                  Comercio local al mayoreo
                </div>
                <h1>
                  Del campo a tu negocio,
                  <span> más fácil.</span>
                </h1>
                <p className="hero-copy">
                  Conectamos a compradores y vendedores de frutas para que
                  encuentres productos frescos, cotices y hagas tus pedidos en
                  un solo lugar.
                </p>
                <div className="hero-actions d-flex flex-wrap gap-3">
                  <a className="btn btn-primary btn-lg rounded-pill px-4" href="#acceso">
                    Explorar productos
                    <i className="bi bi-arrow-up-right ms-2" aria-hidden="true" />
                  </a>
                  <a className="btn btn-link btn-lg text-decoration-none" href="#como-funciona">
                    Conoce cómo funciona
                    <i className="bi bi-arrow-down ms-2" aria-hidden="true" />
                  </a>
                </div>
                <div className="hero-note">
                  <i className="bi bi-shield-check me-2" aria-hidden="true" />
                  Precios y disponibilidad directamente con cada vendedor
                </div>
              </div>

              <div className="col-lg-5">
                <div className="hero-visual" aria-label="Ilustración de productos frescos">
                  <div className="visual-orbit orbit-one" />
                  <div className="visual-orbit orbit-two" />
                  <div className="fruit fruit-orange" aria-hidden="true">🍊</div>
                  <div className="fruit fruit-mango" aria-hidden="true">🥭</div>
                  <div className="fruit fruit-apple" aria-hidden="true">🍎</div>
                  <div className="fruit fruit-leaf" aria-hidden="true">🌿</div>
                  <div className="visual-card visual-card-top">
                    <i className="bi bi-stars" aria-hidden="true" />
                    <span>Productos frescos</span>
                  </div>
                  <div className="visual-card visual-card-bottom">
                    <strong>+ vendedores</strong>
                    <small>en tu región</small>
                  </div>
                  <div className="visual-basket">
                    <i className="bi bi-basket2-fill" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="benefits-section" id="beneficios">
          <div className="container">
            <div className="section-heading text-center">
              <span className="section-kicker">Una forma más simple de comprar</span>
              <h2>Todo lo que necesitas para crecer</h2>
              <p>
                Una plataforma pensada para negocios que necesitan abastecerse
                de manera práctica y segura.
              </p>
            </div>
            <div className="row g-4">
              {benefits.map((benefit) => (
                <div className="col-md-4" key={benefit.title}>
                  <article className="benefit-card">
                    <div className="benefit-icon" aria-hidden="true">
                      <i className={`bi ${benefit.icon}`} />
                    </div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="process-section" id="como-funciona">
          <div className="container">
            <div className="row align-items-end g-4 mb-5">
              <div className="col-lg-7">
                <span className="section-kicker">Así de sencillo</span>
                <h2>Compra al mayoreo sin complicaciones</h2>
              </div>
              <div className="col-lg-5">
                <p className="section-intro mb-0">
                  Tú eliges lo que necesitas. Los vendedores se encargan de
                  ofrecerte una cotización clara y coordinar la entrega.
                </p>
              </div>
            </div>
            <div className="row g-4">
              {steps.map((step, index) => (
                <div className="col-md-4" key={step.number}>
                  <div className="step-card">
                    <span className="step-number">{step.number}</span>
                    {index < steps.length - 1 && <span className="step-line" aria-hidden="true" />}
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="access-section" id="acceso">
          <div className="container">
            <div className="access-panel">
              <div className="row align-items-center g-4">
                <div className="col-lg-6">
                  <span className="section-kicker">Forma parte de la comunidad</span>
                  <h2>Tu próximo proveedor está más cerca.</h2>
                  <p className="mb-0">
                    Elige cómo quieres participar en Frutería Oxkutzcab.
                  </p>
                </div>
                <div className="col-lg-6">
                  <div className="row g-3">
                    <div className="col-sm-6">
                          <a
                            className="role-card"
                            href="#registro-comprador"
                            onClick={() => handleRegistrationTypeChange("customer")}
                          >
                        <i className="bi bi-cart3" aria-hidden="true" />
                        <span>
                          <strong>Soy comprador</strong>
                          <small>Quiero encontrar productos</small>
                        </span>
                        <i className="bi bi-arrow-up-right arrow-icon" aria-hidden="true" />
                      </a>
                    </div>
                    <div className="col-sm-6">
                      <a
                        className="role-card role-card-light"
                        href="#registro-comprador"
                        onClick={() => handleRegistrationTypeChange("seller")}
                      >
                        <i className="bi bi-shop" aria-hidden="true" />
                        <span>
                          <strong>Soy vendedor</strong>
                          <small>Quiero ofrecer mis productos</small>
                        </span>
                        <i className="bi bi-arrow-up-right arrow-icon" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="registration-section" id="registro-comprador">
          <div className="container">
            <div className="registration-layout">
              <div className="registration-intro">
                <span className="section-kicker">Crea tu cuenta</span>
                <h2>Empieza a mover tu negocio con productos frescos.</h2>
                <p>
                  Regístrate en minutos. Tus datos se guardan de forma segura en
                  Firebase y podrás actualizar tu perfil más adelante.
                </p>
                <div className="registration-benefit">
                  <i className="bi bi-shield-check" aria-hidden="true" />
                  <span>
                    <strong>Registro seguro</strong>
                    <small>Usamos Firebase Authentication para proteger tu acceso.</small>
                  </span>
                </div>
                <div className="registration-benefit">
                  <i className="bi bi-person-check" aria-hidden="true" />
                  <span>
                    <strong>Un solo acceso</strong>
                    <small>Con tu cuenta puedes comprar o solicitar vender.</small>
                  </span>
                </div>
              </div>

              <div className="registration-card">
                <div className="registration-tabs" role="tablist" aria-label="Tipo de cuenta">
                  <button
                    className={registrationType === "customer" ? "active" : ""}
                    type="button"
                    role="tab"
                    aria-selected={registrationType === "customer"}
                    onClick={() => handleRegistrationTypeChange("customer")}
                  >
                    <i className="bi bi-cart3" aria-hidden="true" />
                    Cliente
                  </button>
                  <button
                    className={registrationType === "seller" ? "active" : ""}
                    type="button"
                    role="tab"
                    aria-selected={registrationType === "seller"}
                    onClick={() => handleRegistrationTypeChange("seller")}
                  >
                    <i className="bi bi-shop" aria-hidden="true" />
                    Vendedor
                  </button>
                </div>

                <div className="registration-heading">
                  <h3>{registrationType === "seller" ? "Solicita ser vendedor" : "Regístrate como cliente"}</h3>
                  <p>
                    {registrationType === "seller"
                      ? "Crearemos tu cuenta y enviaremos tus datos para aprobación."
                      : "Crea tu cuenta para encontrar y cotizar productos al mayoreo."}
                  </p>
                </div>

                {feedback && (
                  <div className={`alert alert-${feedback.type === "success" ? "success" : "danger"}`} role="alert">
                    {feedback.message}
                  </div>
                )}

                <form onSubmit={handleRegistration}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="nombre">Nombre completo</label>
                      <input className="form-control" id="nombre" name="nombre" required autoComplete="name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="telefono">Teléfono</label>
                      <input className="form-control" id="telefono" name="telefono" type="tel" required autoComplete="tel" />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="correo">Correo electrónico</label>
                      <input className="form-control" id="correo" name="correo" type="email" required autoComplete="email" />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="contrasena">Contraseña</label>
                      <input className="form-control" id="contrasena" name="contrasena" type="password" minLength={6} required autoComplete="new-password" />
                      <div className="form-text">Mínimo 6 caracteres.</div>
                    </div>

                    {registrationType === "seller" && (
                      <>
                        <div className="col-12">
                          <label className="form-label" htmlFor="nombreNegocio">Nombre del negocio</label>
                          <input className="form-control" id="nombreNegocio" name="nombreNegocio" required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="municipio">Municipio</label>
                          <input className="form-control" id="municipio" name="municipio" required defaultValue="Oxkutzcab" />
                        </div>
                        <div className="col-12">
                          <label className="form-label" htmlFor="descripcion">Describe tu negocio</label>
                          <textarea className="form-control" id="descripcion" name="descripcion" rows={3} required />
                        </div>
                      </>
                    )}
                  </div>
                  <button className="btn btn-primary w-100 mt-4" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        Crear cuenta
                        <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
          <a className="brand-lockup footer-brand" href="#inicio">
            <span className="brand-mark" aria-hidden="true">
              <i className="bi bi-basket2-fill" />
            </span>
            <span>
              <strong>Frutería</strong>
              <small>Oxkutzcab</small>
            </span>
          </a>
          <p className="mb-0">Productos frescos, negocios que crecen.</p>
          <small>© 2026 Frutería Oxkutzcab</small>
        </div>
      </footer>
    </div>
  );
}
