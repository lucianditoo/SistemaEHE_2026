import { ViviendaRepository } from "@/repositories/ViviendaRepository";
import type { EncabezadoPlanillaData, FiltrosPlanilla, PaginaPlanilla, Vivienda } from "@/types/interfaces";
import { completarFilas, paginar } from "@/utils/paginador";

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
    const viviendasPorDominio = this.agruparPorDominio(viviendas);
    const paginas: PaginaPlanilla[] = [];

    for (const [dominio, viviendasDominio] of viviendasPorDominio) {
      const paginasDominio = paginar(viviendasDominio, VIVIENDAS_POR_PAGINA);
      paginasDominio.forEach((viviendasPagina, index) => {
        paginas.push({
          dominio,
          numeroPagina: index + 1,
          totalPaginasDominio: paginasDominio.length,
          encabezado: this.crearEncabezado(viviendasDominio),
          viviendas: completarFilas(viviendasPagina, VIVIENDAS_POR_PAGINA)
        });
      });
    }

    return paginas;
  }

  private agruparPorDominio(viviendas: Vivienda[]): Map<string, Vivienda[]> {
    const grupos = new Map<string, Vivienda[]>();

    for (const vivienda of viviendas) {
      const grupo = grupos.get(vivienda.dominio) ?? [];
      grupo.push(vivienda);
      grupos.set(vivienda.dominio, grupo);
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
