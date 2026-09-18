export interface Vivienda {
  id: string;
  cod_viv: string | null;
  id_ehe: string | null;
  dominio: string;
  upm: string;
  partido: string;
  cod_part: string | null;
  localidad: string | null;
  cod_loc: string | null;
  fraccion: string | null;
  radio: string | null;
  segmento: string | null;
  orden_viv: string | null;
  es_inicio: boolean;
  manzana: string | null;
  lado: string | null;
  calle: string | null;
  numero: string | null;
  tipo_viv: string | null;
  edificio: string | null;
  entrada: string | null;
  piso: string | null;
  depto: string | null;
  habitacion: string | null;
  descripcion: string | null;
  telefono: string | null;
  observaciones: string | null;
  cod_lado: string;
}

export interface FiltrosPlanilla {
  partido: string;
  upm?: string;
  fraccion?: string;
}

export interface OpcionesFiltros {
  partidos: string[];
  upms: string[];
  fracciones: string[];
}

export interface EncabezadoPlanillaData {
  dominio: string;
  upm: string;
  partido: string;
  cod_part: string;
  localidad: string;
  cod_loc: string;
  fraccion: string;
  radio: string;
  segmento: string;
  cantidadViviendas: number;
}

export interface PaginaPlanilla {
  dominio: string;
  encabezado: EncabezadoPlanillaData;
  viviendas: Array<Vivienda | null>;
}
