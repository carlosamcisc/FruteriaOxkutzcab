import { useState } from "react";
import type { FormEvent } from "react";
import type { Feedback } from "../../../shared/components/FeedbackAlert";
import type { AccountRole } from "../../../shared/domain/models";
import {
  registerCustomer,
  registerSeller,
  type CustomerRegistrationData,
  type SellerRegistrationData,
} from "../services/registration";
import { mapAuthError } from "../utils/mapAuthError";

export function useRegistration(role: AccountRole) {
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
        await registerSeller(sellerData);
      } else {
        await registerCustomer(commonData);
      }

      form.reset();
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
        message: mapAuthError(error, "No pudimos completar el registro. Intenta nuevamente."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, feedback, handleRegistration };
}
