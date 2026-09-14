import { existsSync } from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();
const ORIGEN = "EHE_2026_XLS";
const TAMANO_LOTE = 1_000;
const OPCION_REEMPLAZAR = "--reemplazar";

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

function normalizarEncabezado(valor: unknown): string {
  return texto(valor).toUpperCase().replace(/[\s_-]+/g, "");
}

function obtenerCodViv(fila: FilaXls, numeroFila: number): string {
  const entrada = Object.entries(fila).find(([columna]) => normalizarEncabezado(columna) === "CODVIV");
  const codViv = texto(entrada?.[1]);

  if (!codViv) {
    throw new Error(`La fila ${numeroFila} no tiene un valor para COD VIV.`);
  }

  return codViv;
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
    cod_viv: obtenerCodViv(fila, numeroFila),
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
  const argumentos = process.argv.slice(2);
  const reemplazar = argumentos.includes(OPCION_REEMPLAZAR);
  const opcionesDesconocidas = argumentos.filter(
    (argumento) => argumento.startsWith("--") && argumento !== OPCION_REEMPLAZAR
  );
  const archivos = argumentos.filter((argumento) => !argumento.startsWith("--"));

  if (opcionesDesconocidas.length > 0) {
    throw new Error(`Opciones desconocidas: ${opcionesDesconocidas.join(", ")}`);
  }

  if (archivos.length !== 1) {
    throw new Error(
      "Indica un archivo. Usa: pnpm run importar:xls -- ruta/archivo.xls [--reemplazar]"
    );
  }

  const rutaArchivo = path.resolve(archivos[0]);
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
  const faltantes: string[] = columnasRequeridas.filter((columna) => !encabezados.has(columna));

  if (!(matriz[0] ?? []).some((columna) => normalizarEncabezado(columna) === "CODVIV")) {
    faltantes.push("COD VIV");
  }

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

  const codigosVistos = new Set<string>();
  const codigosDuplicados = new Set<string>();

  for (const { fila, numeroFila } of filasEhe2026) {
    const codViv = obtenerCodViv(fila, numeroFila);
    if (codigosVistos.has(codViv)) codigosDuplicados.add(codViv);
    codigosVistos.add(codViv);
  }

  if (codigosDuplicados.size > 0) {
    const muestra = [...codigosDuplicados].slice(0, 10).join(", ");
    throw new Error(`El archivo contiene COD VIV duplicados: ${muestra}.`);
  }

  const viviendas = filasEhe2026.map(({ fila, numeroFila }) => convertirFila(fila, numeroFila));
  const lotes = dividirEnLotes(viviendas, TAMANO_LOTE);

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
            `Hay ${viviendasSinCodViv} viviendas de una importacion anterior sin COD VIV. ` +
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
  console.log(`Viviendas omitidas porque COD VIV ya existia: ${viviendas.length - agregadas}`);
  console.log(`Viviendas EHE 2026 acumuladas: ${total}`);
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
