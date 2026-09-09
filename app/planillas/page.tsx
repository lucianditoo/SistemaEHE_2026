import Link from "next/link";
import { BotonesAccion } from "@/components/BotonesAccion";
import { Planilla } from "@/components/Planilla";
import { PlanillaService } from "@/services/PlanillaService";
import type { FiltrosPlanilla } from "@/types/interfaces";
import styles from "./planillas.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function obtenerFiltros(params: Record<string, string | string[] | undefined>): FiltrosPlanilla | null {
  const partido = getValue(params.partido)?.trim();
  const upm = getValue(params.upm)?.trim();
  const fraccion = getValue(params.fraccion)?.trim();

  if (!partido) {
    return null;
  }

  return {
    partido,
    ...(upm ? { upm } : {}),
    ...(fraccion ? { fraccion } : {})
  };
}

export default async function PlanillasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filtros = obtenerFiltros(params);

  if (!filtros) {
    return (
      <main className={styles.emptyState}>
        <h1>No se selecciono un partido</h1>
        <Link href="/">Volver a filtros</Link>
      </main>
    );
  }

  const service = new PlanillaService();
  const paginas = await service.generarPlanillas(filtros);

  return (
    <main className={styles.page}>
      <header className={styles.toolbar}>
        <div>
          <p>Planillas generadas</p>
          <h1>{filtros.partido}</h1>
        </div>
        <nav className={styles.actions}>
          <Link href="/" className={styles.backLink}>Volver</Link>
          <BotonesAccion />
        </nav>
      </header>

      {paginas.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>No hay viviendas para los filtros seleccionados</h2>
        </section>
      ) : (
        <section className={styles.printStack}>
          {paginas.map((pagina, index) => (
            <Planilla key={pagina.dominio + "-" + pagina.numeroPagina + "-" + index} pagina={pagina} />
          ))}
        </section>
      )}
    </main>
  );
}
