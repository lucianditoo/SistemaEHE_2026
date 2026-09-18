import { ViviendaRepository } from "@/repositories/ViviendaRepository";
import type { EncabezadoPlanillaData, FiltrosPlanilla, PaginaPlanilla, Vivienda } from "@/types/interfaces";
import { completarFilas } from "@/utils/paginador";

const VIVIENDAS_POR_PAGINA = 14;

export class PlanillaService {
  constructor(private readonly viviendaRepository = new ViviendaRepository()) {}

  async obtenerPartidos(): Promise<string[]> {
    return this.viviendaRepository.obtenerPartidos();
  }

  async obtenerUpmsPorPartido(partido: string): Promise<string[]> {
    return this.viviendaRepository.obtenerUpmsPorPartido(partido);
  }

  async obtenerFracciones(partido: string, upm: string): Promise<string[]> {
    return this.viviendaRepository.obtenerFracciones(partido, upm);
  }

  async generarPlanillas(filtros: FiltrosPlanilla): Promise<PaginaPlanilla[]> {
    const viviendas = await this.viviendaRepository.buscarViviendas(filtros);
    const gruposDePlanillas = this.agruparPorCabecera(viviendas);
    const paginas: PaginaPlanilla[] = [];

    for (const viviendasGrupo of gruposDePlanillas.values()) {
      const dominio = viviendasGrupo[0]?.dominio ?? "";
      if (viviendasGrupo.length > VIVIENDAS_POR_PAGINA) {
        throw new Error(
          `El segmento ${viviendasGrupo[0]?.segmento ?? "sin codigo"} tiene ${viviendasGrupo.length} viviendas; la planilla admite ${VIVIENDAS_POR_PAGINA}.`
        );
      }

      const inicio = viviendasGrupo.find((vivienda) => vivienda.es_inicio) ?? viviendasGrupo[0];
      const viviendasOrdenadas = [inicio, ...viviendasGrupo.filter((vivienda) => vivienda !== inicio)];
      paginas.push({
        dominio,
        encabezado: this.crearEncabezado(viviendasGrupo),
        viviendas: completarFilas(viviendasOrdenadas, VIVIENDAS_POR_PAGINA)
      });
    }

    return paginas;
  }

  private agruparPorCabecera(viviendas: Vivienda[]): Map<string, Vivienda[]> {
    const grupos = new Map<string, Vivienda[]>();

    for (const vivienda of viviendas) {
      const clave = JSON.stringify([
        vivienda.dominio,
        vivienda.upm,
        vivienda.partido,
        vivienda.cod_part,
        vivienda.localidad,
        vivienda.cod_loc,
        vivienda.fraccion,
        vivienda.radio,
        vivienda.segmento
      ]);
      const grupo = grupos.get(clave) ?? [];
      grupo.push(vivienda);
      grupos.set(clave, grupo);
    }

    return grupos;
  }

  private crearEncabezado(viviendasDominio: Vivienda[]): EncabezadoPlanillaData {
    const primera = viviendasDominio[0];

    return {
      dominio: primera?.dominio ?? "",
      upm: primera?.upm ?? "",
      partido: primera?.partido ?? "",
      cod_part: primera?.cod_part ?? "",
      localidad: primera?.localidad ?? "",
      cod_loc: primera?.cod_loc ?? "",
      fraccion: primera?.fraccion ?? "",
      radio: primera?.radio ?? "",
      segmento: primera?.segmento ?? "",
      cantidadViviendas: viviendasDominio.length
    };
  }
}
