/**
 * @file view-post.js
 * @description Vista de detalle de una entrada de WordPress.
 * Renderiza de forma segura el HTML generado por el editor de WP
 * usando la directiva `unsafeHTML` de Lit, apropiada dado que el
 * contenido proviene de una fuente de confianza (nuestra propia API).
 *
 * @prop {number|string} postId — ID del post a mostrar.
 *
 * @fires navigate — { detail: { route: string } }
 */

import { LitElement, html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { wpService } from '../wp-service.js';
import { Icon } from '../icons.js';
import { sharedStyles } from '../styles/shared.styles.js';
import { stateStyles } from '../styles/shared.styles.js';
import { postStyles } from '../styles/post.styles.js';

export class ViewPost extends LitElement {
    static styles = [sharedStyles, stateStyles, postStyles];

    static properties = {
        /** ID del post pasado desde el router */
        postId: { type: Number },
        _post: { state: true },
        _loading: { state: true },
        _error: { state: true },
    };

    constructor() {
        super();
        this.postId = null;
        this._post = null;
        this._loading = true;
        this._error = null;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    connectedCallback() {
        super.connectedCallback();
        if (this.postId) this.#loadPost();
    }

    /**
     * Recarga si cambia el postId desde fuera (router).
     */
    updated(changedProps) {
        if (changedProps.has('postId') && this.postId) {
            this.#loadPost();
        }
    }

    // ─── Data ─────────────────────────────────────────────────────────────────

    async #loadPost() {
        this._loading = true;
        this._error = null;
        this._post = null;

        try {
            this._post = await wpService.getPostById(this.postId);
        } catch (err) {
            this._error = err.message;
        } finally {
            this._loading = false;
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    get #featuredImage() {
        return wpService.constructor.getFeaturedImageUrl(this._post, 'full');
    }

    get #author() {
        return wpService.constructor.getAuthorName(this._post);
    }

    /** @returns {Array<{id:number, name:string, slug:string}>} */
    get #categories() {
        return wpService.constructor.getCategoriesRaw(this._post);
    }

    get #date() {
        return new Intl.DateTimeFormat('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(this._post.date));
    }

    /** Tiempo estimado de lectura (palabras / 200 palabras por minuto) */
    get #readingTime() {
        const words = this._post.content?.rendered?.replace(/<[^>]*>/g, '').split(/\s+/).length ?? 0;
        return Math.max(1, Math.ceil(words / 200));
    }

    // ─── Eventos ──────────────────────────────────────────────────────────────

    #goBack() {
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: { route: '/grid' },
                bubbles: true,
                composed: true,
            })
        );
    }

    #navigateTo(route) {
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: { route },
                bubbles: true,
                composed: true,
            })
        );
    }

    // ─── Templates ────────────────────────────────────────────────────────────

    #renderLoading() {
        return html`
      <div class="state-wrapper">
        <div class="spinner" role="status" aria-label="Cargando entrada"></div>
        <p class="loading-text">Cargando entrada…</p>
      </div>
    `;
    }

    #renderError() {
        return html`
      <div class="state-wrapper">
        <div class="error-box" role="alert">
          <h3>No se pudo cargar la entrada</h3>
          <p>${this._error}</p>
          <button class="retry-btn" @click="${this.#loadPost.bind(this)}">
            Reintentar
          </button>
        </div>
      </div>
    `;
    }

    #renderHeroImage() {
        if (!this.#featuredImage) return nothing;
        return html`
      <div class="post-hero" role="img" aria-label="Imagen destacada del post">
        <img
          src="${this.#featuredImage}"
          alt="${this._post.title?.rendered ?? ''}"
          loading="eager"
          decoding="async"
        />
      </div>
    `;
    }

    #renderPost() {
        const post = this._post;

        return html`
      <!-- Botón de volver -->
      <nav class="post-nav" aria-label="Navegación">
        <button class="back-btn" @click="${this.#goBack}" aria-label="Volver al listado">
          ${Icon.arrowLeft({ size: 15 })}
          Volver al blog
        </button>
      </nav>

      <!-- Imagen destacada -->
      ${this.#renderHeroImage()}

      <!-- Cabecera del post -->
      <header class="post-header">
        ${this.#categories.length
                ? html`
              <div class="post-categories" aria-label="Categorías">
                ${this.#categories.map(
                    (cat) => html`
                    <button
                      class="post-category-tag"
                      @click="${() => this.#navigateTo(`/category/${cat.slug}`)}"
                      aria-label="Ver todos los posts en ${cat.name}"
                    >
                      ${cat.name}
                    </button>`
                )}
              </div>
            `
                : nothing}

        <h1 class="post-title">
          ${unsafeHTML(post.title?.rendered ?? 'Sin título')}
        </h1>

        <div class="post-meta">
          <span>${Icon.user({ size: 13 })} ${this.#author}</span>
          <span>${Icon.calendar({ size: 13 })} ${this.#date}</span>
          <span>${Icon.clock({ size: 13 })} ${this.#readingTime} min</span>
        </div>
      </header>

      <!-- Contenido HTML de WordPress renderizado de forma segura -->
      <main class="post-body">
        ${unsafeHTML(post.content?.rendered ?? '')}
      </main>
    `;
    }

    render() {
        if (this._loading) return this.#renderLoading();
        if (this._error) return this.#renderError();
        if (!this._post) return nothing;

        return this.#renderPost();
    }
}

customElements.define('view-post', ViewPost);
