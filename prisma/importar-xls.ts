import { existsSync } from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();
const ORIGEN = "EHE_2026_XLS";
const TAMANO_LOTE = 1_000;
const OPCION_REEMPLAZAR = "--reemplazar";
const OPCION_VALIDAR = "--validar";

type FilaXls = Record<string, unknown>;

const columnasMuestra = [
  "ID_Vivienda", "DOMINIO", "UPM", "CODPART", "PARTIDO", "CODLOC", "LOCALIDAD",
  "FRACCION", "RADIO", "MZA", "LADO", "NVIV", "NVIV_DEC", "COD_LADO",
  "CALLE", "NUMERO", "EDIFICIO", "ENTRADA", "PISO", "DPTO_EDIF",
  "HABITACION", "TIPO_VIV", "DESCRIPCION", "SEGMENTO", "ES_INICIO"
] as const;

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

function textoOpcional(valor: unknown): string | null {
  const resultado = texto(valor);
  return resultado || null;
}

function valorRequerido(fila: FilaXls, columna: string, numeroFila: number): string {
  const resultado = texto(fila[columna]);
  if (!resultado) {
    throw new Error(`La fila ${numeroFila} no tiene un valor para ${columna}.`);
  }
  return resultado;
}

function crearOrdenVivienda(fila: FilaXls): string | null {
  const vivienda = texto(fila.NVIV);
  const decimal = texto(fila.NVIV_DEC);

  if (!vivienda) return null;
  return decimal && decimal !== "0" ? `${vivienda}.${decimal}` : vivienda;
}

function convertirFila(fila: FilaXls, numeroFila: number): Prisma.ViviendaCreateManyInput {
  return {
    cod_viv: valorRequerido(fila, "ID_Vivienda", numeroFila),
    dominio: valorRequerido(fila, "DOMINIO", numeroFila),
    upm: valorRequerido(fila, "UPM", numeroFila),
    partido: valorRequerido(fila, "PARTIDO", numeroFila),
    cod_part: textoOpcional(fila.CODPART),
    localidad: textoOpcional(fila.LOCALIDAD),
    cod_loc: textoOpcional(fila.CODLOC),
    fraccion: textoOpcional(fila.FRACCION),
    radio: textoOpcional(fila.RADIO),
    segmento: textoOpcional(fila.SEGMENTO),
    orden_viv: crearOrdenVivienda(fila),
    es_inicio: texto(fila.ES_INICIO).toUpperCase() === "X",
    manzana: textoOpcional(fila.MZA),
    lado: textoOpcional(fila.LADO),
    calle: textoOpcional(fila.CALLE),
    numero: textoOpcional(fila.NUMERO),
    tipo_viv: textoOpcional(fila.TIPO_VIV),
    edificio: textoOpcional(fila.EDIFICIO),
    entrada: textoOpcional(fila.ENTRADA),
    piso: textoOpcional(fila.PISO),
    depto: textoOpcional(fila.DPTO_EDIF),
    habitacion: textoOpcional(fila.HABITACION),
    descripcion: textoOpcional(fila.DESCRIPCION),
    telefono: null,
    observaciones: null,
    cod_lado: valorRequerido(fila, "COD_LADO", numeroFila),
    origen: ORIGEN
  };
}

function claveSegmento(fila: FilaXls): string {
  return JSON.stringify([
    fila.DOMINIO, fila.UPM, fila.CODPART, fila.CODLOC,
    fila.FRACCION, fila.RADIO, fila.SEGMENTO
  ].map(texto));
}

function validarSegmentos(filas: Array<{ fila: FilaXls; numeroFila: number }>): void {
  const grupos = new Map<string, Array<{ fila: FilaXls; numeroFila: number }>>();

  for (const entrada of filas) {
    const clave = claveSegmento(entrada.fila);
    grupos.set(clave, [...(grupos.get(clave) ?? []), entrada]);
  }

  for (const grupo of grupos.values()) {
    const segmento = texto(grupo[0].fila.SEGMENTO);
    const inicios = grupo.filter(({ fila }) => texto(fila.ES_INICIO).toUpperCase() === "X");
    if (inicios.length !== 1) {
      throw new Error(`El segmento ${segmento} debe tener exactamente una vivienda con ES_INICIO = X; tiene ${inicios.length}.`);
    }
    if (grupo.length > 14) {
      throw new Error(`El segmento ${segmento} tiene ${grupo.length} viviendas; la planilla admite 14.`);
    }

    for (const { fila, numeroFila } of grupo) {
      const cantidad = texto(fila["cant viviendas del segmento"]);
      if (cantidad && Number(cantidad) !== grupo.length) {
        throw new Error(`La fila ${numeroFila} indica ${cantidad} viviendas para el segmento ${segmento}, pero hay ${grupo.length}.`);
      }
    }
  }
}

function dividirEnLotes<T>(elementos: T[], tamano: number): T[][] {
  const lotes: T[][] = [];
  for (let inicio = 0; inicio < elementos.length; inicio += tamano) {
    lotes.push(elementos.slice(inicio, inicio + tamano));
  }
  return lotes;
}

async function importar(): Promise<void> {
  const argumentos = process.argv.slice(2).filter((argumento) => argumento !== "--");
  const reemplazar = argumentos.includes(OPCION_REEMPLAZAR);
  const validar = argumentos.includes(OPCION_VALIDAR);
  const opcionesDesconocidas = argumentos.filter(
    (argumento) => argumento.startsWith("--") && ![OPCION_REEMPLAZAR, OPCION_VALIDAR].includes(argumento)
  );
  const archivos = argumentos.filter((argumento) => !argumento.startsWith("--"));

  if (opcionesDesconocidas.length > 0) {
    throw new Error(`Opciones desconocidas: ${opcionesDesconocidas.join(", ")}`);
  }

  if (archivos.length !== 1) {
    throw new Error(
      "Indica un archivo. Usa: pnpm run importar:xls -- ruta/archivo.xls [--validar] [--reemplazar]"
    );
  }

  const rutaArchivo = path.resolve(archivos[0]);
  if (!existsSync(rutaArchivo)) {
    throw new Error(`No se encontro el archivo: ${rutaArchivo}`);
  }

  console.log(`Leyendo ${rutaArchivo}...`);
  const libro = XLSX.readFile(rutaArchivo, { dense: true });
  const hojaMuestra = libro.SheetNames.find((nombre) => {
    if (nombre === "INICIO DE SEGMENTO") return false;
    const primeraFila = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[nombre], {
      header: 1, range: 0, blankrows: false
    })[0] ?? [];
    const encabezados = new Set(primeraFila.map(texto));
    return encabezados.has("ID_Vivienda") && encabezados.has("ES_INICIO") &&
      encabezados.has("CALLE") && encabezados.has("SEGMENTO");
  });
  if (!hojaMuestra) {
    throw new Error("No se encontro la hoja completa de viviendas con ID_Vivienda, ES_INICIO, CALLE y SEGMENTO.");
  }
  const hoja = libro.Sheets[hojaMuestra];

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: false, blankrows: false });
  const encabezados = new Set((matriz[0] ?? []).map(texto));
  const faltantes: string[] = columnasMuestra.filter((columna) => !encabezados.has(columna));

  if (faltantes.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${faltantes.join(", ")}`);
  }

  const filas = XLSX.utils.sheet_to_json<FilaXls>(hoja, { defval: "", raw: false, blankrows: false });
  const filasSeleccionadas = filas.map((fila, index) => ({ fila, numeroFila: index + 2 }));

  if (filasSeleccionadas.length === 0) {
    throw new Error("No se encontraron viviendas para importar.");
  }

  validarSegmentos(filasSeleccionadas);

  for (const { fila, numeroFila } of filasSeleccionadas) {
    valorRequerido(fila, "NVIV", numeroFila);
  }

  const codigosVistos = new Set<string>();
  const codigosDuplicados = new Set<string>();

  for (const { fila, numeroFila } of filasSeleccionadas) {
    const codViv = valorRequerido(fila, "ID_Vivienda", numeroFila);
    if (codigosVistos.has(codViv)) codigosDuplicados.add(codViv);
    codigosVistos.add(codViv);
  }

  if (codigosDuplicados.size > 0) {
    const muestra = [...codigosDuplicados].slice(0, 10).join(", ");
    throw new Error(`El archivo contiene identificadores de vivienda duplicados: ${muestra}.`);
  }

  const viviendas = filasSeleccionadas.map(({ fila, numeroFila }) => convertirFila(fila, numeroFila));
  const lotes = dividirEnLotes(viviendas, TAMANO_LOTE);

  if (validar) {
    console.log(`Validacion correcta: ${viviendas.length} viviendas de la hoja ${hojaMuestra}. No se modifico la base de datos.`);
    return;
  }

  console.log(
    `${reemplazar ? "Reemplazando la carga" : "Agregando viviendas"}: ${viviendas.length} filas en ${lotes.length} lotes...`
  );
  let agregadas = 0;

  await prisma.$transaction(
    async (tx) => {
      if (reemplazar) {
        await tx.vivienda.deleteMany({ where: { origen: { in: ["MOCK", ORIGEN] } } });
      } else {
        const viviendasSinCodViv = await tx.vivienda.count({
          where: { origen: ORIGEN, cod_viv: null }
        });

        if (viviendasSinCodViv > 0) {
          throw new Error(
            `Hay ${viviendasSinCodViv} viviendas de una importacion anterior sin identificador. ` +
              "Vuelve a importar una vez el archivo completo usando --reemplazar; las siguientes cargas podran ser incrementales."
          );
        }

        await tx.vivienda.deleteMany({ where: { origen: "MOCK" } });
      }

      for (const lote of lotes) {
        const resultado = await tx.vivienda.createMany({
          data: lote,
          skipDuplicates: !reemplazar
        });
        agregadas += resultado.count;
      }
    },
    { maxWait: 10_000, timeout: 120_000 }
  );

  const [total, partidos, upms, dominios] = await Promise.all([
    prisma.vivienda.count({ where: { origen: ORIGEN } }),
    prisma.vivienda.findMany({ where: { origen: ORIGEN }, distinct: ["partido"], select: { partido: true } }),
    prisma.vivienda.findMany({ where: { origen: ORIGEN }, distinct: ["upm"], select: { upm: true } }),
    prisma.vivienda.findMany({ where: { origen: ORIGEN }, distinct: ["dominio"], select: { dominio: true } })
  ]);

  console.log("Importacion completada.");
  console.log(`Viviendas agregadas: ${agregadas}`);
  console.log(`Viviendas omitidas porque ID_Vivienda ya existia: ${viviendas.length - agregadas}`);
  console.log(`Viviendas EHE 2026 acumuladas: ${total}`);
  console.log(`Partidos: ${partidos.length}`);
  console.log(`UPM: ${upms.length}`);
  console.log(`Dominios: ${dominios.length}`);
}

importar()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
