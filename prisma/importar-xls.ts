import { existsSync } from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();
const ORIGEN = "EHE_2026_XLS";
const TAMANO_LOTE = 1_000;

type FilaXls = Record<string, unknown>;

const columnasRequeridas = [
  "DOMINIO",
  "UPM",
  "CODPART",
  "PARTIDO",
  "CODLOC",
  "LOCALIDAD",
  "FRACCION",
  "RADIO",
  "MANZANA",
  "LADO",
  "NVIV",
  "NVIV_DEC",
  "CALLE",
  "NUMERO",
  "EDIFICIO",
  "ENTRADA",
  "PISO",
  "DPTO_EDIF",
  "HABITACION",
  "TIPO_VIV",
  "DESCRIPCION",
  "SEGMENTO",
  "ENCUESTA",
  "ENC_2026"
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

function crearCodLado(fila: FilaXls): string {
  return ["UPM", "CODPART", "CODLOC", "FRACCION", "RADIO", "MANZANA", "LADO"]
    .map((columna) => texto(fila[columna]))
    .join("-");
}

function convertirFila(fila: FilaXls, numeroFila: number): Prisma.ViviendaCreateManyInput {
  return {
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
    manzana: textoOpcional(fila.MANZANA),
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
    cod_lado: crearCodLado(fila),
    origen: ORIGEN
  };
}

function dividirEnLotes<T>(elementos: T[], tamano: number): T[][] {
  const lotes: T[][] = [];
  for (let inicio = 0; inicio < elementos.length; inicio += tamano) {
    lotes.push(elementos.slice(inicio, inicio + tamano));
  }
  return lotes;
}

async function importar(): Promise<void> {
  const argumento = process.argv[2];
  if (!argumento) {
    throw new Error("Falta la ruta del archivo. Usa: pnpm importar:xls -- ruta\\archivo.xls");
  }

  const rutaArchivo = path.resolve(argumento);
  if (!existsSync(rutaArchivo)) {
    throw new Error(`No se encontro el archivo: ${rutaArchivo}`);
  }

  console.log(`Leyendo ${rutaArchivo}...`);
  const libro = XLSX.readFile(rutaArchivo, { dense: true });
  const nombreHoja = libro.SheetNames.includes("ehe2026") ? "ehe2026" : libro.SheetNames[0];
  const hoja = libro.Sheets[nombreHoja];

  if (!hoja) {
    throw new Error("El archivo no contiene hojas para importar.");
  }

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: false, blankrows: false });
  const encabezados = new Set((matriz[0] ?? []).map(texto));
  const faltantes = columnasRequeridas.filter((columna) => !encabezados.has(columna));

  if (faltantes.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${faltantes.join(", ")}`);
  }

  const filas = XLSX.utils.sheet_to_json<FilaXls>(hoja, { defval: "", raw: false, blankrows: false });
  const filasEhe2026 = filas
    .map((fila, index) => ({ fila, numeroFila: index + 2 }))
    .filter(
      ({ fila }) =>
        texto(fila.ENCUESTA).toUpperCase() === "EHE" && texto(fila.ENC_2026).toUpperCase() === "X"
    );

  if (filasEhe2026.length === 0) {
    throw new Error("No se encontraron filas con ENCUESTA = EHE y ENC_2026 = X.");
  }

  const viviendas = filasEhe2026.map(({ fila, numeroFila }) => convertirFila(fila, numeroFila));
  const lotes = dividirEnLotes(viviendas, TAMANO_LOTE);

  console.log(`Importando ${viviendas.length} viviendas EHE 2026 en ${lotes.length} lotes...`);
  await prisma.$transaction(
    async (tx) => {
      await tx.vivienda.deleteMany({ where: { origen: { in: ["MOCK", ORIGEN] } } });
      for (const lote of lotes) {
        await tx.vivienda.createMany({ data: lote });
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
  console.log(`Viviendas: ${total}`);
  console.log(`Partidos: ${partidos.length}`);
  console.log(`UPM: ${upms.length}`);
  console.log(`Dominios: ${dominios.length}`);
  console.log(`Filas no importadas por no ser EHE 2026: ${filas.length - filasEhe2026.length}`);
}

importar()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
