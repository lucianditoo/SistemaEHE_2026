-- AlterTable
ALTER TABLE "viviendas" ADD COLUMN "cod_viv" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "viviendas_cod_viv_key" ON "viviendas"("cod_viv");
