import { NextRequest, NextResponse } from "next/server";
import { PlanillaService } from "@/services/PlanillaService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const partido = request.nextUrl.searchParams.get("partido")?.trim();

  if (!partido) {
    return NextResponse.json({ upms: [] });
  }

  const service = new PlanillaService();
  const upms = await service.obtenerUpmsPorPartido(partido);

  return NextResponse.json({ upms });
}
