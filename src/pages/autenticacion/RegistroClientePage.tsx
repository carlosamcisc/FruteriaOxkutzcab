import { RegistrationForm } from "../../features/auth/components/RegistrationForm";
import { RegistrationPageLayout } from "../../shared/components/RegistrationPageLayout";

export function RegistroClientePage() {
  return (
    <RegistrationPageLayout
      title="Empieza a mover tu negocio con productos frescos."
      description="Regístrate como cliente para encontrar y cotizar productos al mayoreo."
    >
      <RegistrationForm role="customer" />
    </RegistrationPageLayout>
  );
}
