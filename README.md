# Sistema de Impresion de Planillas EHE

Aplicacion para generar e imprimir planillas de campo de la Encuesta de Hogares y Empleo, en una PC local o en el servidor de test.

## Planillas de campo

Se genera una hoja A4 horizontal por segmento dentro de su cabecera geografica y dominio.
La tabla conserva 14 filas: la vivienda marcada como inicio del segmento se imprime con todos
sus datos; en las siguientes solo aparece Orden Viv y el resto queda para completar a mano.
Cantidad de viviendas indica el total de registros del grupo. Un segmento con mas de 14
viviendas se rechaza para no omitir ordenes. Cada hoja incluye el logo EHE vigente,
el nombre del encuestador y la fecha, sin numeracion de paginas.

Los cambios de presentacion son comunes a Windows y Linux. Despues de actualizar el
codigo en Linux, ejecutar `pnpm run build` (o `npm run build` si el servidor utiliza npm)
y reiniciar el servicio existente en el puerto 3006. No copiar `.env`, `node_modules`
ni `.next` desde Windows. Si hay migraciones pendientes, aplicarlas antes del arranque.

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

## Instalacion en un servidor Linux

El servidor necesita Node.js 22 o superior; se recomienda Node.js 24 LTS. No copies las carpetas `node_modules` o `.next` generadas en Windows, porque contienen binarios especificos del sistema operativo.

Despues de clonar el repositorio y crear el archivo `.env`, ejecuta:

```bash
chmod +x instalar-dependencias.sh
chmod +x iniciar-sistema.sh
./instalar-dependencias.sh
```

El instalador usa pnpm 11.7.0, reinstala las dependencias para Linux, genera Prisma Client, instala Chromium y sus librerias, compila la aplicacion y aplica las migraciones. La instalacion de librerias de Chromium puede solicitar permisos `sudo`.

Para iniciar el servidor en produccion:

```bash
./iniciar-sistema.sh
```

La aplicacion escucha en `0.0.0.0:3006`. El proceso queda en primer plano para que pueda administrarse mediante `systemd`, Supervisor u otro gestor de servicios del servidor.

## Variables de entorno

El instalador de Windows genera `.env` automaticamente con la clave de la instalacion local de PostgreSQL. En Linux, `instalar-dependencias.sh` crea una copia de `.env.example` si el archivo no existe y avisa que debe configurarse antes de iniciar el servidor.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ehe_planillas?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

En Windows no es necesario editar `.env` durante una instalacion normal. En un servidor Linux debes configurar `DATABASE_URL` con el usuario, la clave y la direccion reales de PostgreSQL.

Para el servidor asignado al puerto 3006, configura tambien la URL publica correspondiente, por ejemplo:

```env
NEXT_PUBLIC_APP_URL="http://nombre-o-ip-del-servidor:3006"
```

## Importacion de datos

`Importar Datos EHE.bat` abre un selector de archivos y pregunta si se deben reemplazar
todas las viviendas importadas. Para agregar otro partido se debe responder N. El archivo
Excel no se copia al repositorio.

El importador detecta la hoja completa por sus columnas, por ejemplo `MUESTRAPARAPLANILLA`
o `muestraehePueyrredon`. Las otras hojas del libro no se importan por separado.
Si existe `ID_EHE`, es el identificador unico de la vivienda y se guarda en la columna
`id_ehe` de PostgreSQL. Los archivos sin esa columna usan `ID_Vivienda` como identificador
anterior. `NVIV` y `NVIV_DEC` forman Orden Viv; `ES_INICIO = X`
marca la primera vivienda que se imprime completa. Se exige una marca por segmento y un maximo
de 14 viviendas. `MZA` y `COD_LADO` se toman del Excel. Los codigos se conservan como texto
para no perder ceros iniciales. El archivo `ehe2026.xls` del ano anterior no es compatible
con esta carga porque tiene otra estructura.

Tambien se puede ejecutar por consola:

```powershell
pnpm run importar:xls -- "C:\ruta\muestra-ehe.xlsx"
```

Para validar el Excel nuevo sin escribir en la base:

```bash
pnpm run importar:xls -- --validar "ruta/EHEADOLFOALSINA-1.xlsx"
```

Para reemplazar las viviendas de prueba y las cargas anteriores de este sistema:

```bash
pnpm run importar:xls -- --reemplazar "ruta/EHEADOLFOALSINA-1.xlsx"
```

El reemplazo elimina registros de origen `MOCK` y `EHE_2026_XLS` de todos los partidos, pero
conserva los de otros origenes. Sin `--reemplazar`, la carga es incremental y omite identificadores
existentes. Para agregar General Pueyrredon sin alterar Adolfo Alsina:

```bash
pnpm run importar:xls -- "./Muestra_Integral_Estratificada_5_V2_357.xlsx"
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
