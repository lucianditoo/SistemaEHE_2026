"use client";

import styles from "./BotonesAccion.module.css";

export function BotonesAccion() {
  function descargarPdf() {
    const url = new URL(window.location.href);
    url.pathname = "/api/pdf";
    window.location.href = url.toString();
  }

  return (
    <div className={styles.actions}>
      <button type="button" onClick={() => window.print()} className={styles.primaryButton}>Imprimir</button>
      <button type="button" onClick={descargarPdf} className={styles.secondaryButton}>Descargar PDF</button>
    </div>
  );
}
