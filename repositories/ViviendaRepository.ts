import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FiltrosPlanilla, Vivienda } from "@/types/interfaces";

export class ViviendaRepository {
  async obtenerPartidos(): Promise<string[]> {
    const rows = await prisma.vivienda.findMany({
      distinct: ["partido"],
      orderBy: { partido: "asc" },
      select: { partido: true }
    });

    return rows.map((row) => row.partido).filter(Boolean);
  }

  async obtenerUpmsPorPartido(partido: string): Promise<string[]> {
    const rows = await prisma.vivienda.findMany({
      where: { partido },
      distinct: ["upm"],
      orderBy: { upm: "asc" },
      select: { upm: true }
    });

    return rows.map((row) => row.upm).filter(Boolean);
  }

  async obtenerFracciones(partido: string, upm: string): Promise<string[]> {
    const rows = await prisma.vivienda.findMany({
      where: { partido, upm, fraccion: { not: null } },
      distinct: ["fraccion"],
      orderBy: { fraccion: "asc" },
      select: { fraccion: true }
    });

    return rows.map((row) => row.fraccion).filter((value): value is string => Boolean(value));
  }

  async buscarViviendas(filtros: FiltrosPlanilla): Promise<Vivienda[]> {
    const where: Prisma.ViviendaWhereInput = {
      partido: filtros.partido
    };

    if (filtros.upm) {
      where.upm = filtros.upm;
    }

    if (filtros.fraccion) {
      where.fraccion = filtros.fraccion;
    }

    const viviendas = await prisma.vivienda.findMany({
      where,
      orderBy: [{ cod_lado: "asc" }, { id: "asc" }]
    });

    return viviendas.sort((a, b) => {
      const porLado = a.cod_lado.localeCompare(b.cod_lado, "es", { numeric: true });
      if (porLado !== 0) return porLado;

      return (a.orden_viv ?? "").localeCompare(b.orden_viv ?? "", "es", { numeric: true });
    });
  }
}
