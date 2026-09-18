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
  "Edificio",
  "Entrada",
  "Piso",
  "Depto",
  "Habit.",
  "Tipo Viv",
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
            <td>{index === 0 ? valor(vivienda?.manzana) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.lado) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.calle) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.numero) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.edificio) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.entrada) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.piso) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.depto) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.habitacion) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.tipo_viv) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.descripcion) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.observaciones) : ""}</td>
            <td>{index === 0 ? valor(vivienda?.telefono) : ""}</td>
            <td></td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
