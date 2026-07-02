export function paginar<T>(items: T[], tamanioPagina: number): T[][] {
  if (tamanioPagina <= 0) {
    throw new Error("El tamanio de pagina debe ser mayor a cero.");
  }

  const paginas: T[][] = [];
  for (let index = 0; index < items.length; index += tamanioPagina) {
    paginas.push(items.slice(index, index + tamanioPagina));
  }

  return paginas.length > 0 ? paginas : [[]];
}

export function completarFilas<T>(items: T[], cantidad: number): Array<T | null> {
  return [...items, ...Array<null>(Math.max(cantidad - items.length, 0)).fill(null)];
}
