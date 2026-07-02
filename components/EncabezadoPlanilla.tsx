import Image from "next/image";
import type { EncabezadoPlanillaData } from "@/types/interfaces";
import styles from "./EncabezadoPlanilla.module.css";

interface EncabezadoPlanillaProps {
  encabezado: EncabezadoPlanillaData;
  numeroPagina: number;
  totalPaginasDominio: number;
}

const campos = [
  ["Dominio", "dominio"],
  ["UPM", "upm"],
  ["Partido", "partido"],
  ["Cod. Partido", "cod_part"],
  ["Localidad", "localidad"],
  ["Cod. Localidad", "cod_loc"],
  ["Fraccion", "fraccion"],
  ["Radio", "radio"],
  ["Segmento", "segmento"]
] as const;

export function EncabezadoPlanilla({ encabezado, numeroPagina, totalPaginasDominio }: EncabezadoPlanillaProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <Image src="/logo.png" alt="EHE Encuesta de Hogares y Empleo" width={420} height={300} className={styles.logo} priority />
      </div>
      <div className={styles.metaGrid}>
        {campos.map(([label, key]) => (
          <div key={key} className={styles.metaItem}>
            <span>{label}</span>
            <strong>{encabezado[key]}</strong>
          </div>
        ))}
        <div className={styles.metaItem}>
          <span>Cant. aprox. viviendas</span>
          <strong>{encabezado.cantidadViviendas}</strong>
        </div>
        <div className={styles.metaItem}>
          <span>Pagina</span>
          <strong>{numeroPagina} / {totalPaginasDominio}</strong>
        </div>
      </div>
    </header>
  );
}
