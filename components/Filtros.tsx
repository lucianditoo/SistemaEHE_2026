"use client";

import { useEffect, useState } from "react";
import styles from "./Filtros.module.css";

interface FiltrosProps {
  partidos: string[];
}

export function Filtros({ partidos }: FiltrosProps) {
  const [partido, setPartido] = useState("");
  const [upm, setUpm] = useState("");
  const [fraccion, setFraccion] = useState("");
  const [upms, setUpms] = useState<string[]>([]);
  const [fracciones, setFracciones] = useState<string[]>([]);
  const [loadingUpms, setLoadingUpms] = useState(false);
  const [loadingFracciones, setLoadingFracciones] = useState(false);

  useEffect(() => {
    if (!partido) {
      setUpms([]);
      setFracciones([]);
      return;
    }

    setLoadingUpms(true);
    setUpm("");
    setFraccion("");
    setFracciones([]);

    fetch("/api/filtros/upms?partido=" + encodeURIComponent(partido))
      .then((response) => response.json())
      .then((data: { upms: string[] }) => setUpms(data.upms))
      .finally(() => setLoadingUpms(false));
  }, [partido]);

  useEffect(() => {
    if (!partido || !upm) {
      setFracciones([]);
      return;
    }

    setLoadingFracciones(true);
    setFraccion("");

    const params = new URLSearchParams({ partido, upm });
    fetch("/api/filtros/fracciones?" + params.toString())
      .then((response) => response.json())
      .then((data: { fracciones: string[] }) => setFracciones(data.fracciones))
      .finally(() => setLoadingFracciones(false));
  }, [partido, upm]);

  return (
    <form action="/planillas" className={styles.form}>
      <label className={styles.field}>
        <span>Partido</span>
        <select name="partido" value={partido} onChange={(event) => setPartido(event.target.value)} required>
          <option value="">Seleccionar partido</option>
          {partidos.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>UPM</span>
        <select name="upm" value={upm} onChange={(event) => setUpm(event.target.value)} disabled={!partido || loadingUpms}>
          <option value="">Todas las UPM</option>
          {upms.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Fraccion</span>
        <select name="fraccion" value={fraccion} onChange={(event) => setFraccion(event.target.value)} disabled={!upm || loadingFracciones}>
          <option value="">Todas las fracciones</option>
          {fracciones.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <button className={styles.submitButton} type="submit" disabled={!partido}>
        Generar Planillas
      </button>
    </form>
  );
}
