/**
 * @file icons.js
 * @description Librería de iconos SVG minimalistas (stroke, line-style).
 * Todos los iconos son decorativos (aria-hidden) y escalan con la prop `size`.
 *
 * Uso:
 *   import { Icon } from '../icons.js';
 *   html`${Icon.user({ size: 14 })} ${this.#author}`
 */

import { svg } from 'lit';

/**
 * Crea el SVG contenedor con atributos consistentes.
 * @param {import('lit').SVGTemplateResult} paths
 * @param {{ size?: number, strokeWidth?: number }} [opts]
 */
const icon = (paths, { size = 16, strokeWidth = 1.75 } = {}) => svg`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="${size}"
    height="${size}"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    style="display:inline-block;vertical-align:middle;flex-shrink:0"
  >${paths}</svg>
`;

export const Icon = {
    /** ← Volver atrás */
    arrowLeft: (o) => icon(svg`
    <path d="M19 12H5"/>
    <path d="M12 19l-7-7 7-7"/>
  `, o),

    /** → Ir adelante */
    arrowRight: (o) => icon(svg`
    <path d="M5 12h14"/>
    <path d="M12 5l7 7-7 7"/>
  `, o),

    /** Chevron derecho */
    chevronRight: (o) => icon(svg`<path d="M9 18l6-6-6-6"/>`, o),

    /** Usuario / autor */
    user: (o) => icon(svg`
    <circle cx="12" cy="8" r="3.5"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  `, o),

    /** Calendario / fecha */
    calendar: (o) => icon(svg`
    <rect x="3" y="4" width="18" height="18" rx="2.5"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  `, o),

    /** Reloj / tiempo de lectura */
    clock: (o) => icon(svg`
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3.5 3.5"/>
  `, o),

    /** Etiqueta / categoría */
    tag: (o) => icon(svg`
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
  `, o),

    /** Documento / post */
    fileText: (o) => icon(svg`
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
  `, o),

    /** Carpeta vacía */
    folder: (o) => icon(svg`
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2z"/>
  `, o),

    /** Cuadrícula */
    grid: (o) => icon(svg`
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  `, o),

    /** Reintentar */
    refresh: (o) => icon(svg`
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  `, o),

    /** Alerta / error */
    alertCircle: (o) => icon(svg`
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  `, o),
};
