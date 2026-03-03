/**
 * @file view-grid.js
 * @description Vista de listado de posts con paginación.
 * Muestra las tarjetas en un grid responsive con imagen destacada (_embed).
 *
 * @fires navigate — { detail: { route: string } }
 */

import { LitElement, html, nothing } from 'lit';
import { wpService } from '../wp-service.js';
import { sharedStyles } from '../styles/shared.styles.js';
import { stateStyles } from '../styles/shared.styles.js';
import { gridStyles } from '../styles/grid.styles.js';
import '../components/post-card.js';

const PER_PAGE = 9;

export class ViewGrid extends LitElement {
    static styles = [sharedStyles, stateStyles, gridStyles];

    static properties = {
        _posts: { state: true },
        _loading: { state: true },
        _error: { state: true },
        _currentPage: { state: true },
        _totalPages: { state: true },
        _totalPosts: { state: true },
    };

    constructor() {
        super();
        this._posts = [];
        this._loading = true;
        this._error = null;
        this._currentPage = 1;
        this._totalPages = 1;
        this._totalPosts = 0;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    connectedCallback() {
        super.connectedCallback();
        this.#loadPosts();
    }

    // ─── Data ─────────────────────────────────────────────────────────────────

    async #loadPosts() {
        this._loading = true;
        this._error = null;

        try {
            // La REST API devuelve total de posts y páginas en las cabeceras
            const url = `https://xarop.com/wp-json/wp/v2/posts?_embed&page=${this._currentPage}&per_page=${PER_PAGE}&orderby=date&order=desc`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} — ${response.statusText}`);
            }

            this._totalPosts = parseInt(response.headers.get('X-WP-Total') ?? '0', 10);
            this._totalPages = parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10);
            this._posts = await response.json();
        } catch (err) {
            this._error = err.message;
        } finally {
            this._loading = false;
            // Scroll suave al inicio al cambiar de página
            this.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // ─── Paginación ───────────────────────────────────────────────────────────

    #goToPage(page) {
        if (page < 1 || page > this._totalPages) return;
        this._currentPage = page;
        this.#loadPosts();
    }

    // ─── Eventos ──────────────────────────────────────────────────────────────

    #onPostSelected(e) {
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: { route: `/post/${e.detail.id}` },
                bubbles: true,
                composed: true,
            })
        );
    }

    // ─── Templates ────────────────────────────────────────────────────────────

    #renderPageHeader() {
        return html`
      <header class="page-header">
        <div class="page-header__inner">
          <h1 class="page-header__title">Blog</h1>
          <p class="page-header__meta">
            ${this._totalPosts > 0
                ? `${this._totalPosts} publicaciones · Página ${this._currentPage} de ${this._totalPages}`
                : 'Cargando publicaciones…'}
          </p>
        </div>
      </header>
    `;
    }

    #renderLoading() {
        return html`
      <div class="state-wrapper">
        <div class="spinner" role="status" aria-label="Cargando posts"></div>
        <p class="loading-text">Cargando posts…</p>
      </div>
    `;
    }

    #renderError() {
        return html`
      <div class="state-wrapper">
        <div class="error-box" role="alert">
          <h3>Error al cargar el contenido</h3>
          <p>${this._error}</p>
          <button class="retry-btn" @click="${this.#loadPosts.bind(this)}">
            Reintentar
          </button>
        </div>
      </div>
    `;
    }

    #renderGrid() {
        return html`
      <div class="grid-section">
        <div class="posts-grid" role="list">
          ${this._posts.map(
            (post) => html`
              <div role="listitem">
                <post-card
                  .post="${post}"
                  @post-selected="${this.#onPostSelected}"
                ></post-card>
              </div>
            `
        )}
        </div>
        ${this.#renderPagination()}
      </div>
    `;
    }

    #renderPagination() {
        if (this._totalPages <= 1) return nothing;

        return html`
      <nav class="pagination" aria-label="Paginación de posts">
        <button
          class="pagination__btn"
          ?disabled="${this._currentPage === 1}"
          @click="${() => this.#goToPage(this._currentPage - 1)}"
          aria-label="Página anterior"
        >
          ← Anterior
        </button>

        <span class="pagination__info" aria-current="page">
          ${this._currentPage} / ${this._totalPages}
        </span>

        <button
          class="pagination__btn"
          ?disabled="${this._currentPage === this._totalPages}"
          @click="${() => this.#goToPage(this._currentPage + 1)}"
          aria-label="Página siguiente"
        >
          Siguiente →
        </button>
      </nav>
    `;
    }

    render() {
        return html`
      ${this.#renderPageHeader()}

      ${this._loading
                ? this.#renderLoading()
                : this._error
                    ? this.#renderError()
                    : this.#renderGrid()}
    `;
    }
}

customElements.define('view-grid', ViewGrid);
