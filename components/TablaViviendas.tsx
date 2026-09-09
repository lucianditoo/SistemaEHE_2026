import type { Vivienda } from "@/types/interfaces";
import styles from "./TablaViviendas.module.css";

interface TablaViviendasProps {
  viviendas: Array<Vivienda | null>;
}

const columnas = [
  "Orden Viv",
  "Manzana",
  "Lado",
  "Calle",
  "Numero",
  "Tipo Viv",
  "Edificio",
  "Entrada",
  "Piso",
  "Depto",
  "Habit.",
  "Descripcion",
  "Observaciones del Encuestador",
  "Telefono",
  "Encuestada Si/No",
  "Causa de no respuesta"
];

function valor(value: string | null | undefined): string {
  return value ?? "";
}

export function TablaViviendas({ viviendas }: TablaViviendasProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columnas.map((columna) => (
            <th key={columna}>{columna}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {viviendas.map((vivienda, index) => (
          <tr key={vivienda?.id ?? "fila-vacia-" + index}>
            <td>{valor(vivienda?.orden_viv)}</td>
            <td>{valor(vivienda?.manzana)}</td>
            <td>{valor(vivienda?.lado)}</td>
            <td>{valor(vivienda?.calle)}</td>
            <td>{valor(vivienda?.numero)}</td>
            <td>{valor(vivienda?.tipo_viv)}</td>
            <td>{valor(vivienda?.edificio)}</td>
            <td>{valor(vivienda?.entrada)}</td>
            <td>{valor(vivienda?.piso)}</td>
            <td>{valor(vivienda?.depto)}</td>
            <td>{valor(vivienda?.habitacion)}</td>
            <td>{valor(vivienda?.descripcion)}</td>
            <td>{valor(vivienda?.observaciones)}</td>
            <td>{valor(vivienda?.telefono)}</td>
            <td></td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
