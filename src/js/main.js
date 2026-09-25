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
});
