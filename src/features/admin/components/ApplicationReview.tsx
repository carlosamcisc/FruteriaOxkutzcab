import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { reviewApplication, type SolicitudConId } from "../services/administration";

export function ApplicationReview({ application, adminUid, onClose, onSaved }: {
  application: SolicitudConId; adminUid: string; onClose: () => void; onSaved: () => void;
}) {
  const [decision, setDecision] = useState<"aprobada" | "rechazada">("aprobada");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError("");
    try { await reviewApplication(application.id, adminUid, decision, reason); onSaved(); }
    catch (caught) {
      setError(caught instanceof FirebaseError
        ? "No se pudo guardar la revisión. Comprueba tu conexión, tu permiso de administrador y las reglas publicadas."
        : caught instanceof Error ? caught.message : "No se pudo guardar la revisión.");
    } finally { setSaving(false); }
  }
  return <section className="registration-card mb-4" aria-labelledby="review-title">
    <h2 id="review-title">Revisar: {application.nombreNegocio}</h2>
    <p>Al aprobar se habilitará el negocio y se guardará quién revisó la solicitud.</p>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}><fieldset disabled={saving}>
      <label className="form-label" htmlFor="review-decision">Decisión</label>
      <select className="form-select mb-3" id="review-decision" value={decision} onChange={event => setDecision(event.target.value as "aprobada" | "rechazada")}>
        <option value="aprobada">Aprobar y habilitar negocio</option>
        {application.estado === "pendiente" && <option value="rechazada">Rechazar solicitud</option>}
      </select>
      {decision === "rechazada" && <div className="mb-3"><label className="form-label" htmlFor="review-reason">Motivo del rechazo</label><textarea id="review-reason" className="form-control" required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} /></div>}
      <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary" type="submit">{saving ? "Guardando…" : "Confirmar decisión"}</button><button className="btn btn-outline-secondary" type="button" onClick={onClose}>Cancelar</button></div>
    </fieldset></form>
  </section>;
}
