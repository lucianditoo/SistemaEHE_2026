import Image from "next/image";
import { Filtros } from "@/components/Filtros";
import { PlanillaService } from "@/services/PlanillaService";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const service = new PlanillaService();
  const partidos = await service.obtenerPartidos();

  return (
    <main className={styles.pageShell}>
      <section className={styles.hero}>
        <div className={styles.brandBar}>
          <div className={styles.logoSlot}><Image src="/logo.png" alt="EHE Encuesta de Hogares y Empleo" width={150} height={110} priority /></div>
          <div>
            <p className={styles.kicker}>Direccion Provincial de Estadistica</p>
            <h1>Sistema de Impresion de Planillas EHE</h1>
          </div>
        </div>
        <p className={styles.subtitle}>Generacion local de planillas de campo para la Encuesta de Hogares y Empleo.</p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Filtros de viviendas</h2>
          <p>Partido es obligatorio. UPM y Fraccion pueden quedar sin seleccionar.</p>
        </div>
        <Filtros partidos={partidos} />
      </section>
    </main>
  );
}
