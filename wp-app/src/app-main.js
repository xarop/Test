/**
 * @file app-main.js
 * @description Orquestador principal de la aplicación.
 *
 * Implementa un router ligero basado en el hash de la URL (#/ruta) sin
 * dependencias externas. Escucha el evento 'hashchange' del navegador y
 * el evento personalizado 'navigate' que emiten las vistas hijas.
 *
 * Rutas disponibles:
 *   #/          → view-home    (pantalla de bienvenida)
 *   #/grid      → view-grid    (listado paginado de posts)
 *   #/post/:id  → view-post    (detalle de un post)
 *
 * Lazy-loading: las vistas se importan dinámicamente la primera vez
 * que se activa su ruta para reducir el bundle inicial.
 */

import { LitElement, html, css, nothing } from 'lit';
import { sharedStyles } from './styles/shared.styles.js';

// ─── Definición de rutas ──────────────────────────────────────────────────────

/**
 * @typedef {Object} Route
 * @property {RegExp}   pattern  — Expresión regular para hacer match con el hash
 * @property {Function} loader   — Importación dinámica del módulo de la vista
 * @property {string}   tag      — Nombre del custom element a renderizar
 */
const ROUTES = [
    {
        pattern: /^\/$/,
        loader: () => import('./views/view-home.js'),
        tag: 'view-home',
    },
    {
        pattern: /^\/grid$/,
        loader: () => import('./views/view-grid.js'),
        tag: 'view-grid',
    },
    {
        pattern: /^\/post\/(\d+)$/,
        loader: () => import('./views/view-post.js'),
        tag: 'view-post',
        /** Extrae el postId del match de la regex */
        getProps: (match) => ({ postId: Number(match[1]) }),
    },
    {
        pattern: /^\/category\/([\w-]+)$/,
        loader: () => import('./views/view-category.js'),
        tag: 'view-category',
        /** Extrae el slug de la categoría */
        getProps: (match) => ({ categorySlug: match[1] }),
    },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export class AppMain extends LitElement {
    static styles = [
        sharedStyles,
        css`
      :host {
        display: block;
        min-height: 100vh;
        font-family: var(--font-sans);
        background: var(--color-bg);
      }

      /* ─── Top Nav ─── */
      .app-nav {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--color-border);
        padding: 0 var(--content-padding);
      }

      .app-nav__inner {
        max-width: var(--content-max-width);
        margin: 0 auto;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4);
      }

      .app-nav__logo {
        font-size: var(--font-size-xl);
        font-weight: 800;
        color: var(--color-primary);
        cursor: pointer;
        letter-spacing: -0.03em;
        text-decoration: none;
        background: none;
        border: none;
        padding: 0;
        font-family: inherit;
      }

      .app-nav__logo:hover {
        color: var(--color-primary-dark);
      }

      .app-nav__links {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .nav-link {
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--color-text-muted);
        cursor: pointer;
        background: none;
        border: none;
        transition: all var(--transition-fast);
        font-family: inherit;
      }

      .nav-link:hover {
        color: var(--color-text);
        background: var(--color-bg);
      }

      .nav-link.active {
        color: var(--color-text);
        background: var(--color-bg);
        font-weight: 700;
      }

      /* ─── Page transition ─── */
      .page-slot {
        min-height: calc(100vh - 56px - 60px);
        animation: fadeIn 200ms ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ─── Footer ─── */
      .app-footer {
        text-align: center;
        padding: var(--space-6);
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
        border-top: 1px solid var(--color-border);
      }

      /* ─── 404 ─── */
      .not-found {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: var(--space-4);
        text-align: center;
        padding: var(--space-8);
        color: var(--color-text-muted);
      }

      .not-found h2 {
        font-size: var(--font-size-3xl);
        font-weight: 800;
        color: var(--color-text);
      }
    `,
    ];

    static properties = {
        /** Ruta activa (sin el '#') */
        _route: { state: true },
        /** Props dinámicas para pasar a la vista activa (ej: postId) */
        _props: { state: true },
        /** Tag de la vista activa */
        _viewTag: { state: true },
        /** Estado de la transición de carga de la vista */
        _loadingRoute: { state: true },
    };

    constructor() {
        super();
        this._route = '/';
        this._props = {};
        this._viewTag = null;
        this._loadingRoute = false;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    connectedCallback() {
        super.connectedCallback();
        // Escuchar cambios en el hash del navegador
        window.addEventListener('hashchange', this.#onHashChange);
        // Escuchar el evento 'navigate' que emiten las vistas hijas
        this.addEventListener('navigate', this.#onNavigate);
        // Procesar la ruta inicial
        this.#resolveRoute(this.#getHash());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('hashchange', this.#onHashChange);
        this.removeEventListener('navigate', this.#onNavigate);
    }

    // ─── Router ───────────────────────────────────────────────────────────────

    /** Obtiene la ruta del hash actual, normalizando a '/' si está vacío */
    #getHash() {
        const hash = window.location.hash.slice(1);
        return hash || '/';
    }

    /**
     * Busca la ruta matching y carga dinámicamente el módulo de la vista.
     * @param {string} path
     */
    async #resolveRoute(path) {
        for (const route of ROUTES) {
            const match = path.match(route.pattern);
            if (match) {
                this._loadingRoute = true;
                try {
                    // Lazy-load del módulo (solo la primera vez; el navegador cachea el módulo)
                    await route.loader();
                } finally {
                    this._loadingRoute = false;
                }
                this._route = path;
                this._viewTag = route.tag;
                this._props = route.getProps ? route.getProps(match) : {};
                return;
            }
        }

        // Ninguna ruta coincidió → 404
        this._route = path;
        this._viewTag = null;
        this._props = {};
    }

    // ─── Handlers ─────────────────────────────────────────────────────────────

    #onHashChange = () => {
        this.#resolveRoute(this.#getHash());
    };

    #onNavigate = (e) => {
        const { route } = e.detail;
        window.location.hash = route;
    };

    /** Navega a una ruta programáticamente */
    #navigateTo(route) {
        window.location.hash = route;
    }

    // ─── Helpers de estado ────────────────────────────────────────────────────

    /** Devuelve true si la ruta del link es la activa */
    #isActive(linkRoute) {
        return this._route.startsWith(linkRoute) && linkRoute !== '/'
            ? true
            : this._route === linkRoute;
    }

    // ─── Templates ────────────────────────────────────────────────────────────

    #renderNav() {
        return html`
      <nav class="app-nav" aria-label="Navegación principal">
        <div class="app-nav__inner">
          <button
            class="app-nav__logo"
            @click="${() => this.#navigateTo('/')}"
            aria-label="Xarop — Ir al inicio"
          >
            Xarop
          </button>

          <ul class="app-nav__links" role="list">
            <li>
              <button
                class="nav-link ${this._route === '/' ? 'active' : ''}"
                @click="${() => this.#navigateTo('/')}"
                aria-current="${this._route === '/' ? 'page' : nothing}"
              >
                Inicio
              </button>
            </li>
            <li>
              <button
                class="nav-link ${this.#isActive('/grid') ? 'active' : ''}"
                @click="${() => this.#navigateTo('/grid')}"
                aria-current="${this.#isActive('/grid') ? 'page' : nothing}"
              >
                Blog
              </button>
            </li>
          </ul>
        </div>
      </nav>
    `;
    }

    /** Renderiza la vista activa con sus props dinámicas */
    #renderView() {
        if (this._loadingRoute) {
            return html`
        <div class="not-found">
          <div class="spinner" role="status"></div>
        </div>
      `;
        }

        if (!this._viewTag) {
            return html`
        <div class="not-found" role="main">
          <h2>404</h2>
          <p>La página <code>${this._route}</code> no existe.</p>
          <button
            style="margin-top: 1rem; padding: .5rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: 9999px; cursor: pointer; font-weight: 600;"
            @click="${() => this.#navigateTo('/')}"
          >
            Volver al inicio
          </button>
        </div>
      `;
        }

        // Creamos el elemento dinámicamente y le asignamos props en el siguiente
        // ciclo para que Lit pueda hacer el diff correctamente.
        const el = document.createElement(this._viewTag);
        Object.assign(el, this._props);

        return html`
      <main class="page-slot" id="main-content" tabindex="-1">
        ${el}
      </main>
    `;
    }

    #renderFooter() {
        return html`
      <footer class="app-footer">
        <p>
          © ${new Date().getFullYear()} Xarop — Construido con
          <a
            href="https://lit.dev"
            target="_blank"
            rel="noopener noreferrer"
            style="color: var(--color-primary);"
          >
            Lit 3.0
          </a>
        </p>
      </footer>
    `;
    }

    render() {
        return html`
      ${this.#renderNav()}
      ${this.#renderView()}
      ${this.#renderFooter()}
    `;
    }
}

customElements.define('app-main', AppMain);
