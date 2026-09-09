# Sistema de Impresion de Planillas EHE

Aplicacion local para generar e imprimir planillas de campo de la Encuesta de Hogares y Empleo.

## Tecnologias

- Next.js 15 con App Router
- React y TypeScript estricto
- PostgreSQL
- Prisma ORM
- CSS Modules
- Playwright para generar PDF desde el mismo HTML de impresion

## Requisitos en una maquina nueva

Se necesita Windows 10 u 11 y conexion a Internet. No se requiere Docker. El instalador comprueba si **App Installer/WinGet** esta disponible y, si falta, intenta instalar automaticamente el paquete oficial de Microsoft. En equipos administrados que bloqueen esa instalacion, abrira Microsoft Store para completar ese unico paso.

El instalador completo se ocupa de:

1. Comprobar e instalar App Installer/WinGet cuando sea necesario.
2. Solicitar permisos de administrador.
3. Instalar Node.js LTS si falta.
4. Instalar PostgreSQL 18 si falta.
5. Generar automaticamente una clave local para una instalacion nueva de PostgreSQL.
6. Crear la base `ehe_planillas`.
7. Crear y configurar `.env`.
8. Instalar las dependencias JavaScript.
9. Aplicar las migraciones de Prisma.
10. Instalar Chromium para descargar PDF.

La clave generada se guarda solamente en el archivo local `.env`, que esta excluido de Git. Si PostgreSQL ya estaba instalado, el instalador intenta usar la configuracion existente y solo solicita la clave si no puede conectarse.

## Instalacion rapida

1. Descargar o clonar el repo.
2. Ejecutar con doble clic `Instalar Dependencias EHE.bat` y aceptar la ventana de administrador.
3. Ejecutar con doble clic `Importar Datos EHE.bat` y seleccionar el archivo `.xls` o `.xlsx`.
4. Ejecutar con doble clic `Iniciar Sistema EHE.bat`.
5. Abrir `http://localhost:3000`.

## Instalacion por consola

```powershell
cd ruta-del-proyecto
powershell -ExecutionPolicy Bypass -File .\instalar-dependencias.ps1
powershell -ExecutionPolicy Bypass -File .\iniciar-sistema.ps1
```

## Variables de entorno

El instalador genera `.env` automaticamente con la clave de la instalacion local de PostgreSQL. `.env.example` queda como referencia:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ehe_planillas?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

No es necesario editar `.env` durante una instalacion normal.

## Importacion de datos

`Importar Datos EHE.bat` abre un selector de archivos e importa solamente los registros que cumplen:

- `ENCUESTA = EHE`
- `ENC_2026 = X`

La importacion conserva los codigos como texto para no perder ceros iniciales, reemplaza cualquier importacion EHE 2026 anterior y elimina los registros mock. El archivo Excel no se copia al repositorio.

Tambien se puede ejecutar por consola:

```powershell
pnpm run importar:xls -- "C:\ruta\ehe2026.xls"
```

## Datos mock opcionales

El seed mock queda disponible solamente para desarrollo y ya no se ejecuta durante la instalacion:

```powershell
pnpm run seed:mock
```

Los registros de prueba se guardan con `origen = "MOCK"`. Para quitarlos:

```sql
DELETE FROM viviendas WHERE origen = 'MOCK';
```

## PDF

El boton Descargar PDF usa Playwright para abrir la misma vista HTML imprimible y generar el archivo. Si falta el navegador de Playwright, ejecutar:

```powershell
pnpm exec playwright install chromium
```
