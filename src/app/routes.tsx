import type { ReactElement } from "react";
import { InicioSesionPage } from "../pages/autenticacion/InicioSesionPage";
import { RegistroClientePage } from "../pages/autenticacion/RegistroClientePage";
import { RegistroVendedorPage } from "../pages/autenticacion/RegistroVendedorPage";
import { SeleccionRolPage } from "../pages/autenticacion/SeleccionRolPage";
import { BienvenidaPage } from "../pages/publico/BienvenidaPage";

/**
 * Rutas basadas en el hash de la URL. Cualquier hash que no esté aquí
 * (por ejemplo, las anclas `#beneficios` o `#como-funciona`) muestra la
 * página de bienvenida.
 */
export const routes: Record<string, () => ReactElement> = {
  "#inicio-sesion": () => <InicioSesionPage />,
  "#seleccion-rol": () => <SeleccionRolPage />,
  "#registro-cliente": () => <RegistroClientePage />,
  "#registro-vendedor": () => <RegistroVendedorPage />,
};

export const fallbackRoute = () => <BienvenidaPage />;
