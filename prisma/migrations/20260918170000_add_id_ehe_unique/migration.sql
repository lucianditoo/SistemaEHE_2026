ALTER TABLE "viviendas" ADD COLUMN "id_ehe" TEXT;

CREATE UNIQUE INDEX "viviendas_id_ehe_key" ON "viviendas"("id_ehe");
