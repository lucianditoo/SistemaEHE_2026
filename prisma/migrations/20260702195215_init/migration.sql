-- CreateTable
CREATE TABLE "viviendas" (
    "id" TEXT NOT NULL,
    "dominio" TEXT NOT NULL,
    "upm" TEXT NOT NULL,
    "partido" TEXT NOT NULL,
    "cod_part" TEXT,
    "localidad" TEXT,
    "cod_loc" TEXT,
    "fraccion" TEXT,
    "radio" TEXT,
    "segmento" TEXT,
    "manzana" TEXT,
    "lado" TEXT,
    "calle" TEXT,
    "numero" TEXT,
    "tipo_viv" TEXT,
    "edificio" TEXT,
    "entrada" TEXT,
    "piso" TEXT,
    "depto" TEXT,
    "habitacion" TEXT,
    "descripcion" TEXT,
    "telefono" TEXT,
    "observaciones" TEXT,
    "cod_lado" TEXT NOT NULL,
    "origen" TEXT NOT NULL DEFAULT 'REAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viviendas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "viviendas_partido_idx" ON "viviendas"("partido");

-- CreateIndex
CREATE INDEX "viviendas_partido_upm_idx" ON "viviendas"("partido", "upm");

-- CreateIndex
CREATE INDEX "viviendas_partido_upm_fraccion_idx" ON "viviendas"("partido", "upm", "fraccion");

-- CreateIndex
CREATE INDEX "viviendas_dominio_idx" ON "viviendas"("dominio");

-- CreateIndex
CREATE INDEX "viviendas_cod_lado_idx" ON "viviendas"("cod_lado");
