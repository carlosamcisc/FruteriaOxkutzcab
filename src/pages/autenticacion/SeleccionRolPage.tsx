import { AuthLayout } from "../../shared/components/AuthLayout";

export function SeleccionRolPage() {
  return (
    <AuthLayout>
      <section className="registration-section" aria-labelledby="role-title">
        <div className="container">
          <div className="role-selection">
            <div className="text-center">
              <span className="section-kicker">Crea tu cuenta</span>
              <h1 id="role-title">¿Cómo quieres participar?</h1>
              <p className="role-selection-intro">
                Selecciona el tipo de cuenta que necesitas para continuar.
              </p>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <a className="role-selection-card" href="#registro-cliente">
                  <i className="bi bi-cart3" aria-hidden="true" />
                  <span>
                    <strong>Soy comprador</strong>
                    <small>Encuentra productos frescos y solicita cotizaciones.</small>
                  </span>
                  <i className="bi bi-arrow-up-right arrow-icon" aria-hidden="true" />
                </a>
              </div>
              <div className="col-md-6">
                <a className="role-selection-card role-selection-card-seller" href="#registro-vendedor">
                  <i className="bi bi-shop" aria-hidden="true" />
                  <span>
                    <strong>Soy vendedor</strong>
                    <small>Ofrece tus productos a negocios de la región.</small>
                  </span>
                  <i className="bi bi-arrow-up-right arrow-icon" aria-hidden="true" />
                </a>
              </div>
            </div>

            <p className="login-register-link">
              ¿Ya tienes una cuenta? <a href="#inicio-sesion">Inicia sesión</a>
            </p>
          </div>
        </div>
      </section>
    </AuthLayout>
  );
}
