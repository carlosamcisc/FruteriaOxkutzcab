document.addEventListener("DOMContentLoaded", () => {
    const setImage = (id, value) => {
        const el = document.getElementById(id);
        if (el && value) {
            el.src = value;
        }
    };

    setImage("imgCarrusel1", "https://img.lalr.co/cms/2024/12/16111108/Fresas.jpg");
    setImage("imgCarrusel2", "https://cortijoholgado.com/wp-content/uploads/2017/05/mangos_3.jpg");
    setImage("imgCarrusel3", "https://www.vegaverde.es/wp-content/uploads/2018/02/CITRICOS-1024x579.png");
    setImage("imgCard1", "https://img.freepik.com/premium-photo/freshexotic-fruitsassorted-fruits-colorful-backgroundvitamins-natural-nutrition-concept_472916-12354.jpg");
    setImage("imgCard2", "https://www.lavanguardia.com/files/og_thumbnail/uploads/2018/11/06/5e997f1646dea.jpeg");
    setImage("imgCard3", "https://tse1.mm.bing.net/th/id/OIP.dMDhnUJqRWWIol-T34Y-NgHaFC?r=0&rs=1&pid=ImgDetMain&o=7&rm=3");

    const btnTop = document.getElementById("btnTop");
    if (btnTop) {
        const toggleBtnTop = () => {
            btnTop.style.display = window.scrollY > 300 ? "block" : "none";
        };

        toggleBtnTop();
        window.addEventListener("scroll", toggleBtnTop);
        btnTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
    const sidebarLabel = document.getElementById("sidebarLabel");

    if (toggleSidebarBtn && sidebarLabel) {
        const updateSidebarToggle = () => {
            const isCollapsed = document.body.classList.contains("sidebar-collapsed");
            toggleSidebarBtn.setAttribute("aria-expanded", String(!isCollapsed));
            sidebarLabel.textContent = isCollapsed ? "Menú" : "Principal";
        };

        updateSidebarToggle();

        toggleSidebarBtn.addEventListener("click", () => {
            const isCollapsed = document.body.classList.toggle("sidebar-collapsed");
            toggleSidebarBtn.setAttribute("aria-expanded", String(!isCollapsed));
            sidebarLabel.textContent = isCollapsed ? "Menú" : "Principal";
        });
    }

    const elementos = document.querySelectorAll("section, .card-animada, .problem-box, .impact-card");
    if ("IntersectionObserver" in window && elementos.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }
            });
        }, { threshold: 0.12 });

        elementos.forEach((el) => {
            el.style.opacity = "0";
            el.style.transform = "translateY(30px)";
            el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
            observer.observe(el);
        });
    }

    const datosFruteria = {
        productos: [
            { codigo: "FR-001", fruta: "Mango Ataulfo", categoria: "Tropical", presentacion: "Caja 10 kg", precio: 520, existencias: 18, estado: "Disponible" },
            { codigo: "FR-002", fruta: "Papaya Maradol", categoria: "Tropical", presentacion: "Caja 15 kg", precio: 390, existencias: 14, estado: "Disponible" },
            { codigo: "FR-003", fruta: "Naranja Valencia", categoria: "Cítrica", presentacion: "Costal 20 kg", precio: 280, existencias: 9, estado: "Stock bajo" },
            { codigo: "FR-004", fruta: "Sandía", categoria: "Temporada", presentacion: "Pieza", precio: 60, existencias: 0, estado: "Agotado" },
            { codigo: "FR-005", fruta: "Limón persa", categoria: "Cítrica", presentacion: "Caja 8 kg", precio: 190, existencias: 32, estado: "Disponible" },
            { codigo: "FR-006", fruta: "Piña miel", categoria: "Tropical", presentacion: "Caja 12 kg", precio: 340, existencias: 11, estado: "Disponible" },
            { codigo: "FR-007", fruta: "Plátano", categoria: "Tropical", presentacion: "Caja 18 kg", precio: 310, existencias: 7, estado: "Stock bajo" },
            { codigo: "FR-008", fruta: "Toronja", categoria: "Cítrica", presentacion: "Caja 15 kg", precio: 260, existencias: 16, estado: "Disponible" },
            { codigo: "FR-009", fruta: "Melón", categoria: "Temporada", presentacion: "Caja 10 kg", precio: 295, existencias: 5, estado: "Stock bajo" },
            { codigo: "FR-010", fruta: "Guayaba", categoria: "Tropical", presentacion: "Caja 8 kg", precio: 230, existencias: 13, estado: "Disponible" }
        ],
        clientes: [
            { codigo: "CL-001", nombre: "Abarrotes La Esperanza", telefono: "9971023401", localidad: "Oxkutzcab", tipo: "Comercio" },
            { codigo: "CL-002", nombre: "Restaurante El Mayab", telefono: "9971145620", localidad: "Tekax", tipo: "Restaurante" },
            { codigo: "CL-003", nombre: "Frutería San Miguel", telefono: "9971256731", localidad: "Akil", tipo: "Frutería" },
            { codigo: "CL-004", nombre: "Cocina Doña Mary", telefono: "9971367842", localidad: "Oxkutzcab", tipo: "Restaurante" },
            { codigo: "CL-005", nombre: "Mercado del Sur", telefono: "9971478953", localidad: "Ticul", tipo: "Comercio" },
            { codigo: "CL-006", nombre: "Jugos La Plaza", telefono: "9971589064", localidad: "Peto", tipo: "Restaurante" },
            { codigo: "CL-007", nombre: "Frutas y Verduras Chan", telefono: "9971690175", localidad: "Oxkutzcab", tipo: "Frutería" },
            { codigo: "CL-008", nombre: "Hotel Santa Lucía", telefono: "9971701286", localidad: "Tekax", tipo: "Hotel" },
            { codigo: "CL-009", nombre: "Abarrotes El Naranjal", telefono: "9971812397", localidad: "Akil", tipo: "Comercio" },
            { codigo: "CL-010", nombre: "Comedor Las Palmas", telefono: "9971923408", localidad: "Ticul", tipo: "Restaurante" }
        ],
        pedidos: [
            { codigo: "PD-1001", fecha: "2026-10-01", cliente: "Abarrotes La Esperanza", fruta: "Mango Ataulfo", cantidad: "5 cajas", total: 2600, estado: "Entregado" },
            { codigo: "PD-1002", fecha: "2026-10-02", cliente: "Restaurante El Mayab", fruta: "Limón persa", cantidad: "3 cajas", total: 570, estado: "Entregado" },
            { codigo: "PD-1003", fecha: "2026-10-03", cliente: "Frutería San Miguel", fruta: "Papaya Maradol", cantidad: "4 cajas", total: 1560, estado: "Preparando" },
            { codigo: "PD-1004", fecha: "2026-10-04", cliente: "Cocina Doña Mary", fruta: "Naranja Valencia", cantidad: "2 costales", total: 560, estado: "Pendiente" },
            { codigo: "PD-1005", fecha: "2026-10-05", cliente: "Mercado del Sur", fruta: "Piña miel", cantidad: "6 cajas", total: 2040, estado: "Entregado" },
            { codigo: "PD-1006", fecha: "2026-10-06", cliente: "Jugos La Plaza", fruta: "Guayaba", cantidad: "2 cajas", total: 460, estado: "Preparando" },
            { codigo: "PD-1007", fecha: "2026-10-07", cliente: "Frutas y Verduras Chan", fruta: "Plátano", cantidad: "3 cajas", total: 930, estado: "Pendiente" },
            { codigo: "PD-1008", fecha: "2026-10-08", cliente: "Hotel Santa Lucía", fruta: "Melón", cantidad: "2 cajas", total: 590, estado: "Entregado" },
            { codigo: "PD-1009", fecha: "2026-10-09", cliente: "Abarrotes El Naranjal", fruta: "Toronja", cantidad: "4 cajas", total: 1040, estado: "Cancelado" },
            { codigo: "PD-1010", fecha: "2026-10-10", cliente: "Comedor Las Palmas", fruta: "Sandía", cantidad: "10 piezas", total: 600, estado: "Pendiente" }
        ]
    };

    const configuracionesTablas = {
        productos: {
            titulo: "Inventario de frutas",
            busqueda: "Buscar por fruta, categoría o estado...",
            registros: datosFruteria.productos,
            columnas: [
                { campo: "codigo", titulo: "Código" },
                { campo: "fruta", titulo: "Fruta" },
                { campo: "categoria", titulo: "Categoría" },
                { campo: "presentacion", titulo: "Presentación" },
                { campo: "precio", titulo: "Precio mayoreo", moneda: true },
                { campo: "existencias", titulo: "Existencias" },
                { campo: "estado", titulo: "Estado" }
            ]
        },
        clientes: {
            titulo: "Registro de clientes",
            busqueda: "Buscar por nombre, teléfono o localidad...",
            registros: datosFruteria.clientes,
            columnas: [
                { campo: "codigo", titulo: "Código" },
                { campo: "nombre", titulo: "Nombre" },
                { campo: "telefono", titulo: "Teléfono" },
                { campo: "localidad", titulo: "Localidad" },
                { campo: "tipo", titulo: "Tipo de cliente" }
            ]
        },
        pedidos: {
            titulo: "Registro de pedidos",
            busqueda: "Buscar por pedido, cliente, fruta o estado...",
            registros: datosFruteria.pedidos,
            columnas: [
                { campo: "codigo", titulo: "Pedido" },
                { campo: "fecha", titulo: "Fecha" },
                { campo: "cliente", titulo: "Cliente" },
                { campo: "fruta", titulo: "Fruta" },
                { campo: "cantidad", titulo: "Cantidad" },
                { campo: "total", titulo: "Total", moneda: true },
                { campo: "estado", titulo: "Estado" }
            ]
        }
    };

    const clasesEstado = {
        "Disponible": "bg-success",
        "Stock bajo": "bg-warning text-dark",
        "Agotado": "bg-danger",
        "Entregado": "bg-success",
        "Preparando": "bg-info text-dark",
        "Pendiente": "bg-warning text-dark",
        "Cancelado": "bg-danger"
    };
    const formatoMoneda = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    });
    const zonaTablas = document.getElementById("zonaTablas");
    const botonesTabla = document.querySelectorAll("[data-tabla]");
    const busquedasTabla = {};

    function mostrarTabla(nombre) {
        const configuracion = configuracionesTablas[nombre];
        if (!configuracion || !zonaTablas) {
            return;
        }

        const tarjeta = document.createElement("div");
        tarjeta.className = "card shadow-sm";
        const contenido = document.createElement("div");
        contenido.className = "card-body";

        const titulo = document.createElement("h3");
        titulo.className = "h5 text-brand";
        titulo.textContent = configuracion.titulo;
        contenido.appendChild(titulo);

        const idBusqueda = `buscar-${nombre}`;
        const etiquetaBusqueda = document.createElement("label");
        etiquetaBusqueda.className = "visually-hidden";
        etiquetaBusqueda.htmlFor = idBusqueda;
        etiquetaBusqueda.textContent = `Buscar en ${configuracion.titulo.toLocaleLowerCase("es")}`;
        contenido.appendChild(etiquetaBusqueda);

        const busqueda = document.createElement("input");
        busqueda.className = "form-control mb-3 tabla-busqueda";
        busqueda.id = idBusqueda;
        busqueda.type = "search";
        busqueda.placeholder = configuracion.busqueda;
        busqueda.value = busquedasTabla[nombre] || "";
        contenido.appendChild(busqueda);

        const contenedorTabla = document.createElement("div");
        contenedorTabla.className = "table-responsive";
        const tabla = document.createElement("table");
        tabla.className = "table table-striped table-hover align-middle";
        tabla.setAttribute("aria-label", configuracion.titulo);

        const encabezado = document.createElement("thead");
        encabezado.className = "table-brand";
        const filaEncabezado = document.createElement("tr");
        configuracion.columnas.forEach((columna) => {
            const celda = document.createElement("th");
            celda.scope = "col";
            celda.textContent = columna.titulo;
            filaEncabezado.appendChild(celda);
        });
        encabezado.appendChild(filaEncabezado);
        tabla.appendChild(encabezado);

        const cuerpo = document.createElement("tbody");
        tabla.appendChild(cuerpo);
        contenedorTabla.appendChild(tabla);
        contenido.appendChild(contenedorTabla);

        const resumen = document.createElement("p");
        resumen.className = "small text-muted mb-0";
        resumen.setAttribute("aria-live", "polite");
        contenido.appendChild(resumen);

        function actualizarRegistros() {
            const texto = busqueda.value.trim().toLocaleLowerCase("es");
            busquedasTabla[nombre] = busqueda.value;
            const coincidencias = configuracion.registros.filter((registro) =>
                Object.values(registro).some((valor) =>
                    String(valor).toLocaleLowerCase("es").includes(texto)
                )
            );

            cuerpo.replaceChildren();
            if (coincidencias.length === 0) {
                const fila = document.createElement("tr");
                const celda = document.createElement("td");
                celda.colSpan = configuracion.columnas.length;
                celda.className = "text-center text-muted";
                celda.textContent = "No se encontraron registros.";
                fila.appendChild(celda);
                cuerpo.appendChild(fila);
            } else {
                coincidencias.forEach((registro) => {
                    const fila = document.createElement("tr");
                    configuracion.columnas.forEach((columna) => {
                        const celda = document.createElement("td");
                        const valor = registro[columna.campo];

                        if (columna.campo === "estado") {
                            const insignia = document.createElement("span");
                            insignia.className = `badge ${clasesEstado[valor] || "bg-secondary"}`;
                            insignia.textContent = valor;
                            celda.appendChild(insignia);
                        } else {
                            celda.textContent = columna.moneda
                                ? formatoMoneda.format(valor)
                                : String(valor);
                        }
                        fila.appendChild(celda);
                    });
                    cuerpo.appendChild(fila);
                });
            }

            resumen.textContent = `Registros encontrados: ${coincidencias.length} de ${configuracion.registros.length}`;
        }

        busqueda.addEventListener("input", actualizarRegistros);
        actualizarRegistros();
        tarjeta.appendChild(contenido);
        zonaTablas.replaceChildren(tarjeta);

        botonesTabla.forEach((boton) => {
            const seleccionado = boton.dataset.tabla === nombre;
            boton.classList.toggle("btn-success", seleccionado);
            boton.classList.toggle("btn-outline-success", !seleccionado);
            boton.setAttribute("aria-pressed", String(seleccionado));
        });
    }

    botonesTabla.forEach((boton) => {
        boton.addEventListener("click", () => {
            mostrarTabla(boton.dataset.tabla);
        });
    });

    mostrarTabla("productos");
});
