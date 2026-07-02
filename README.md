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

Antes de ejecutar el sistema hace falta tener instalado:

1. Node.js LTS
2. PostgreSQL
3. Una base de datos llamada `ehe_planillas`

El instalador del proyecto baja las dependencias JavaScript usando pnpm via npx si pnpm no esta instalado globalmente. PostgreSQL debe estar instalado y ejecutandose en la maquina. No se requiere Docker.

## Instalacion rapida

1. Descargar o clonar el repo.
2. Instalar PostgreSQL y crear la base `ehe_planillas`.
3. Ejecutar con doble clic `Instalar Dependencias EHE.bat`.
4. Ejecutar con doble clic `Iniciar Sistema EHE.bat`.
5. Abrir `http://localhost:3000`.

## Instalacion por consola

```powershell
cd ruta-del-proyecto
powershell -ExecutionPolicy Bypass -File .\instalar-dependencias.ps1
powershell -ExecutionPolicy Bypass -File .\iniciar-sistema.ps1
```

## Variables de entorno

Si no existe `.env`, el instalador lo crea desde `.env.example`.

Configuracion esperada por defecto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ehe_planillas?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Si la clave de PostgreSQL no es `postgres`, editar `.env` y cambiar la contrasena en `DATABASE_URL`.

## Datos mock

Los registros de prueba se cargan con `origen = "MOCK"`. Para quitarlos:

```sql
DELETE FROM viviendas WHERE origen = 'MOCK';
```

## PDF

El boton Descargar PDF usa Playwright para abrir la misma vista HTML imprimible y generar el archivo. Si falta el navegador de Playwright, ejecutar:

```powershell
pnpm exec playwright install chromium
```
