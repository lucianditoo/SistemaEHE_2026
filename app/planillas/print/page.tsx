import { Planilla } from "@/components/Planilla";
import { PlanillaService } from "@/services/PlanillaService";
import type { FiltrosPlanilla } from "@/types/interfaces";
import styles from "../planillas.module.css";

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

export default async function PrintPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filtros = obtenerFiltros(params);

  if (!filtros) {
    return null;
  }

  const service = new PlanillaService();
  const paginas = await service.generarPlanillas(filtros);

  return (
    <main className={styles.printOnlyPage}>
      {paginas.map((pagina, index) => (
        <Planilla key={pagina.dominio + "-" + index} pagina={pagina} />
      ))}
    </main>
  );
}
