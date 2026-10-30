import { useState } from "react";
import type { FormEvent } from "react";
import type { Feedback } from "../../../shared/components/FeedbackAlert";
import type { AccountRole } from "../../../shared/domain/models";
import {
  registerCustomer,
  registerSeller,
  submitSellerApplication,
  type CustomerRegistrationData,
  type SellerRegistrationData,
} from "../services/registration";
import { mapAuthError } from "../utils/mapAuthError";
import { useAuth } from './useAuth';

export function useRegistration(role: AccountRole) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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
      if (role === "seller") {
        const sellerData: SellerRegistrationData = {
          ...commonData,
          businessName: String(formData.get("nombreNegocio") ?? ""),
          description: String(formData.get("descripcion") ?? ""),
          municipality: String(formData.get("municipio") ?? ""),
        };
        if (user) await submitSellerApplication(user.uid, sellerData);
        else await registerSeller(sellerData);
      } else {
        await registerCustomer(commonData);
      }

      form.reset();
      window.location.hash = role === 'seller' ? '#vendedor-inicio' : '#cliente-inicio';
      setFeedback({
        type: "success",
        message:
          role === "seller"
            ? "Tu cuenta fue creada. Tu solicitud de vendedor quedó pendiente de revisión."
            : "Tu cuenta fue creada correctamente. Ya puedes comenzar a comprar.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: mapAuthError(error, error instanceof Error && !('code' in error) ? error.message : "No pudimos completar el registro. Intenta nuevamente."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, feedback, handleRegistration };
}
