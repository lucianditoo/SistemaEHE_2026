import { NextRequest, NextResponse } from "next/server";
import { PlanillaService } from "@/services/PlanillaService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const partido = request.nextUrl.searchParams.get("partido")?.trim();
  const upm = request.nextUrl.searchParams.get("upm")?.trim();

  if (!partido || !upm) {
    return NextResponse.json({ fracciones: [] });
  }

  const service = new PlanillaService();
  const fracciones = await service.obtenerFracciones(partido, upm);

  return NextResponse.json({ fracciones });
}
