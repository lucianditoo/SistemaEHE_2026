import Image from "next/image";
import type { EncabezadoPlanillaData } from "@/types/interfaces";
import styles from "./EncabezadoPlanilla.module.css";

interface EncabezadoPlanillaProps {
  encabezado: EncabezadoPlanillaData;
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

export function EncabezadoPlanilla({ encabezado }: EncabezadoPlanillaProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <Image src="/logo-ehe-transparente.png" alt="EHE Encuesta de Hogares y Empleo" width={1443} height={1090} className={styles.logo} unoptimized priority />
      </div>
      <div className={styles.metaGrid}>
        {campos.map(([label, key]) => (
          <div key={key} className={styles.metaItem}>
            <span>{label}</span>
            <strong>{encabezado[key]}</strong>
          </div>
        ))}
        <div className={styles.metaItem}>
          <span>Cantidad de viviendas</span>
          <strong>{encabezado.cantidadViviendas}</strong>
        </div>
      </div>
    </header>
  );
}
