import { FeedbackAlert } from "../../../shared/components/FeedbackAlert";
import type { AccountRole } from "../../../shared/domain/models";
import { useRegistration } from "../hooks/useRegistration";

interface RegistrationFormProps {
  role: AccountRole;
}

export function RegistrationForm({ role }: RegistrationFormProps) {
  const { isSubmitting, feedback, handleRegistration } = useRegistration(role);
  const isSeller = role === "seller";

  return (
    <div className="registration-card">
      <div className="registration-heading">
        <h2>{isSeller ? "Solicita ser vendedor" : "Regístrate como cliente"}</h2>
        <p>
          {isSeller
            ? "Crearemos tu cuenta y enviaremos tus datos para aprobación."
            : "Crea tu cuenta para encontrar y cotizar productos al mayoreo."}
        </p>
      </div>

      <FeedbackAlert feedback={feedback} />

      <form onSubmit={handleRegistration}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor={`${role}-nombre`}>Nombre completo</label>
            <input className="form-control" id={`${role}-nombre`} name="nombre" required autoComplete="name" />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor={`${role}-telefono`}>Teléfono</label>
            <input className="form-control" id={`${role}-telefono`} name="telefono" type="tel" required autoComplete="tel" />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor={`${role}-correo`}>Correo electrónico</label>
            <input className="form-control" id={`${role}-correo`} name="correo" type="email" required autoComplete="email" />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor={`${role}-contrasena`}>Contraseña</label>
            <input className="form-control" id={`${role}-contrasena`} name="contrasena" type="password" minLength={6} required autoComplete="new-password" />
            <div className="form-text">Mínimo 6 caracteres.</div>
          </div>

          {isSeller && (
            <>
              <div className="col-12">
                <label className="form-label" htmlFor="seller-nombreNegocio">Nombre del negocio</label>
                <input className="form-control" id="seller-nombreNegocio" name="nombreNegocio" required />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="seller-municipio">Municipio</label>
                <input className="form-control" id="seller-municipio" name="municipio" required defaultValue="Oxkutzcab" />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="seller-descripcion">Describe tu negocio</label>
                <textarea className="form-control" id="seller-descripcion" name="descripcion" rows={3} required />
              </div>
            </>
          )}
        </div>
        <button className="btn btn-primary w-100 mt-4" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          {!isSubmitting && <i className="bi bi-arrow-right ms-2" aria-hidden="true" />}
        </button>
      </form>
    </div>
  );
}
