import assert from "node:assert/strict";
import { test } from "node:test";
import { PlanillaService } from "../services/PlanillaService";
import { ViviendaRepository } from "../repositories/ViviendaRepository";
import type { Vivienda } from "../types/interfaces";

function vivienda(id: number, segmento = "S1", dominio = "D1"): Vivienda {
  return {
    id: String(id), cod_viv: null, dominio, upm: "1", partido: "Prueba",
    cod_part: "001", localidad: "Prueba", cod_loc: "001", fraccion: "01",
    radio: "01", segmento, orden_viv: String(id), manzana: "001", lado: "01",
    calle: "Calle de prueba", numero: String(id), tipo_viv: "A",
    edificio: null, entrada: null, piso: null, depto: null, habitacion: null,
    descripcion: null, telefono: null, observaciones: null, cod_lado: "1-001-001-01-01-001-01"
  };
}

class RepositorioPrueba extends ViviendaRepository {
  constructor(private readonly filas: Vivienda[]) { super(); }
  override async buscarViviendas(): Promise<Vivienda[]> { return this.filas; }
}

test("un segmento con 27 viviendas produce una hoja con la primera y 13 filas vacias", async () => {
  const filas = Array.from({ length: 27 }, (_, i) => vivienda(i + 1));
  const servicio = new PlanillaService(new RepositorioPrueba(filas));
  const paginas = await servicio.generarPlanillas({ partido: "Prueba" });
  assert.equal(paginas.length, 1);
  assert.equal(paginas[0].encabezado.cantidadViviendas, 27);
  assert.equal(paginas[0].viviendas.length, 14);
  assert.equal(paginas[0].viviendas[0], filas[0]);
  assert.ok(paginas[0].viviendas.slice(1).every(fila => fila === null));
  assert.equal(filas.length, 27);
});

test("separacion de segmentos y dominios conservando el primer registro de cada grupo", async () => {
  const filas = [vivienda(1), vivienda(2), vivienda(3, "S2"), vivienda(4, "S1", "D2")];
  const paginas = await new PlanillaService(new RepositorioPrueba(filas)).generarPlanillas({ partido: "Prueba" });
  assert.equal(paginas.length, 3);
  assert.deepEqual(paginas.map(p => p.encabezado.cantidadViviendas), [2, 1, 1]);
  assert.deepEqual(paginas.map(p => p.viviendas[0]?.id), ["1", "3", "4"]);
  assert.ok(paginas.every(p => p.viviendas.length === 14));
});

test("sin viviendas no se generan hojas", async () => {
  const paginas = await new PlanillaService(new RepositorioPrueba([])).generarPlanillas({ partido: "Prueba" });
  assert.deepEqual(paginas, []);
});
