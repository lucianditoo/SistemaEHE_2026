import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MockBase {
  dominio: string;
  upm: string;
  partido: string;
  cod_part: string;
  localidad: string;
  cod_loc: string;
  fraccion: string;
  radio: string;
  segmento: string;
}

const bases: MockBase[] = [
  {
    dominio: "D001",
    upm: "UPM-001",
    partido: "La Plata",
    cod_part: "441",
    localidad: "La Plata",
    cod_loc: "001",
    fraccion: "01",
    radio: "03",
    segmento: "A"
  },
  {
    dominio: "D002",
    upm: "UPM-001",
    partido: "La Plata",
    cod_part: "441",
    localidad: "Tolosa",
    cod_loc: "002",
    fraccion: "02",
    radio: "04",
    segmento: "B"
  },
  {
    dominio: "D003",
    upm: "UPM-014",
    partido: "General Pueyrredon",
    cod_part: "357",
    localidad: "Mar del Plata",
    cod_loc: "001",
    fraccion: "05",
    radio: "09",
    segmento: "A"
  }
];

function codLado(base: MockBase, manzana: string, lado: string): string {
  return [base.upm, base.cod_part, base.cod_loc, base.fraccion, base.radio, manzana, lado].join("-");
}

function crearViviendas(base: MockBase, cantidad: number) {
  return Array.from({ length: cantidad }, (_, index) => {
    const numero = index + 1;
    const manzana = String(Math.ceil(numero / 4)).padStart(3, "0");
    const lado = String(((numero - 1) % 4) + 1);

    return {
      ...base,
      orden_viv: String(numero),
      manzana,
      lado,
      calle: numero % 2 === 0 ? "Calle 12" : "Avenida 7",
      numero: String(100 + numero),
      tipo_viv: numero % 5 === 0 ? "Depto" : "Casa",
      edificio: numero % 5 === 0 ? "Torre " + Math.ceil(numero / 5) : null,
      entrada: numero % 5 === 0 ? "A" : null,
      piso: numero % 5 === 0 ? String((numero % 8) + 1) : null,
      depto: numero % 5 === 0 ? String.fromCharCode(64 + ((numero % 4) + 1)) : null,
      habitacion: null,
      descripcion: "Registro mock de prueba " + numero,
      telefono: numero % 3 === 0 ? "0221-555-" + String(1000 + numero) : null,
      observaciones: numero % 7 === 0 ? "Verificar numeracion en campo" : null,
      cod_lado: codLado(base, manzana, lado),
      origen: "MOCK"
    };
  });
}

async function main() {
  await prisma.vivienda.deleteMany({ where: { origen: "MOCK" } });

  await prisma.vivienda.createMany({
    data: [
      ...crearViviendas(bases[0], 27),
      ...crearViviendas(bases[1], 10),
      ...crearViviendas(bases[2], 31)
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
