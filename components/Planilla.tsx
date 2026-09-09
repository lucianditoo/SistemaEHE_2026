import type { PaginaPlanilla } from "@/types/interfaces";
import { EncabezadoPlanilla } from "./EncabezadoPlanilla";
import { TablaViviendas } from "./TablaViviendas";
import styles from "./Planilla.module.css";

interface PlanillaProps {
  pagina: PaginaPlanilla;
}

export function Planilla({ pagina }: PlanillaProps) {
  return (
    <article className={styles.sheet}>
      <EncabezadoPlanilla
        encabezado={pagina.encabezado}
        numeroPagina={pagina.numeroPagina}
        totalPaginasDominio={pagina.totalPaginasDominio}
      />
      <TablaViviendas viviendas={pagina.viviendas} />
      <footer className={styles.footer}>
        <div className={styles.signatureField}>
          <span>Nombre Encuestador:</span>
          <strong aria-hidden="true"></strong>
        </div>
        <div className={styles.signatureField}>
          <span>Fecha:</span>
          <strong aria-hidden="true"></strong>
        </div>
      </footer>
    </article>
  );
}
