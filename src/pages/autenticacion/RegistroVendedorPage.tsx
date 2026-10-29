import { RegistrationForm } from "../../features/auth/components/RegistrationForm";
import { RegistrationPageLayout } from "../../shared/components/RegistrationPageLayout";

export function RegistroVendedorPage() {
  return (
    <RegistrationPageLayout
      title="Ofrece tus productos frescos a nuevos negocios."
      description="Regístrate como vendedor y envía tu solicitud para aprobación."
    >
      <RegistrationForm role="seller" />
    </RegistrationPageLayout>
  );
}
