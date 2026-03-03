/**
 * @file view-home.js
 * @description Vista principal (home). Muestra un hero, un filtro de categorías
 * y los posts correspondientes a la categoría seleccionada.
 *
 * @fires navigate — { detail: { route: string } }
 */

import { LitElement, html, nothing } from 'lit';
import { wpService } from '../wp-service.js';
import { sharedStyles } from '../styles/shared.styles.js';
import { homeStyles } from '../styles/home.styles.js';
import { stateStyles } from '../styles/shared.styles.js';
import { Icon } from '../icons.js';
import '../components/post-card.js';

/** Número de posts a mostrar en el home por categoría */
const POSTS_PREVIEW = 6;

/** Sentinel que representa «todas las categorías» */
const ALL_ID = null;

export class ViewHome extends LitElement {
    static styles = [sharedStyles, stateStyles, homeStyles];

    static properties = {
        _posts: { state: true },
        _categories: { state: true },
        _activeCatId: { state: true },
        _loadingPosts: { state: true },
        _loadingCats: { state: true },
        _errorPosts: { state: true },
        _errorCats: { state: true },
    };

    constructor() {
        super();
        this._posts = [];
        this._categories = [];
        /** @type {number|null} null = todas */
        this._activeCatId = ALL_ID;
        this._loadingPosts = true;
        this._loadingCats = true;
        this._errorPosts = null;
        this._errorCats = null;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    connectedCallback() {
        super.connectedCallback();
        // Carga categorías y posts en paralelo
        this.#loadCategories();
        this.#loadPosts();
    }

    // ─── Data ─────────────────────────────────────────────────────────────────

    async #loadCategories() {
        this._loadingCats = true;
        this._errorCats = null;
        try {
            this._categories = await wpService.getAllCategories();
        } catch (err) {
            this._errorCats = err.message;
        } finally {
            this._loadingCats = false;
        }
    }

    async #loadPosts(categoryId = this._activeCatId) {
        this._loadingPosts = true;
        this._errorPosts = null;
        try {
            this._posts = categoryId === ALL_ID
                ? await wpService.getPosts({ page: 1, perPage: POSTS_PREVIEW })
                : await wpService.getPostsByCategoryId(categoryId, { page: 1, perPage: POSTS_PREVIEW });
        } catch (err) {
            this._errorPosts = err.message;
        } finally {
            this._loadingPosts = false;
        }
    }

    // ─── Handlers ─────────────────────────────────────────────────────────────

    #selectCategory(catId) {
        if (catId === this._activeCatId) return; // sin cambio
        this._activeCatId = catId;
        this.#loadPosts(catId);
    }

    #navigate(route) {
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: { route },
                bubbles: true,
                composed: true,
            })
        );
    }

    #onPostSelected(e) {
        this.#navigate(`/post/${e.detail.id}`);
    }

    // ─── Templates ────────────────────────────────────────────────────────────

    #renderHero() {
        return html`
      <section class="hero" aria-label="Bienvenida">
        <p class="hero__eyebrow">Blog & Tecnología</p>
        <h1 class="hero__title">
          Bienvenido a <span>Xarop</span>
        </h1>
        <p class="hero__subtitle">
          Artículos de desarrollo web, tecnología y mucho más.
          Explora los últimos posts del blog.
        </p>
        <div class="hero__actions">
          <button class="btn btn--primary" @click="${() => this.#navigate('/grid')}">
            Explorar todos los posts
          </button>
          <button class="btn btn--outline" @click="${() => this.#navigate('/grid')}">
            Ver el grid
          </button>
        </div>
      </section>
    `;
    }

    /** Barra de chips de categorías */
    #renderFilterBar() {
        return html`
      <div class="filter-bar" role="group" aria-label="Filtrar por categoría">
        <span class="filter-bar__label">Categoría:</span>
        <div class="filter-bar__chips">

          <!-- Chip «Todas» siempre visible -->
          <button
            class="chip ${this._activeCatId === ALL_ID ? 'chip--active' : ''}"
            @click="${() => this.#selectCategory(ALL_ID)}"
            aria-pressed="${this._activeCatId === ALL_ID}"
          >
            Todas
          </button>

          ${this._loadingCats
                /* Skeletons mientras cargan */
                ? [1, 2, 3, 4].map(() => html`<span class="chip chip--skeleton"></span>`)
                : this._categories.map(
                    (cat) => html`
                  <button
                    class="chip ${this._activeCatId === cat.id ? 'chip--active' : ''}"
                    @click="${() => this.#selectCategory(cat.id)}"
                    aria-pressed="${this._activeCatId === cat.id}"
                    title="${cat.description || cat.name}"
                  >
                    ${cat.name}
                    <span class="chip__count">(${cat.count})</span>
                  </button>
                `
                )}
        </div>
      </div>
    `;
    }

    #renderPostsGrid() {
        if (this._loadingPosts) {
            return html`
        <div class="state-wrapper">
          <div class="spinner" role="status" aria-label="Cargando posts"></div>
          <p class="loading-text">Cargando posts…</p>
        </div>
      `;
        }

        if (this._errorPosts) {
            return html`
        <div class="state-wrapper">
          <div class="error-box" role="alert">
            <h3>No se pudo cargar el contenido</h3>
            <p>${this._errorPosts}</p>
            <button class="retry-btn" @click="${() => this.#loadPosts()}">
              Reintentar
            </button>
          </div>
        </div>
      `;
        }

        if (!this._posts.length) {
            const activeCat = this._categories.find((c) => c.id === this._activeCatId);
            return html`
        <div class="posts-row">
          <div class="empty-state">
            <span class="empty-state__icon">${Icon.folder({ size: 36 })}</span>
            <p class="empty-state__text">
              Sin posts en «${activeCat?.name ?? 'esta categoría'}»
            </p>
            <p class="empty-state__sub">Prueba con otra categoría o vuelve al inicio.</p>
          </div>
        </div>
      `;
        }

        return html`
      <div class="posts-row">
        ${this._posts.map(
            (post) => html`
            <post-card
              .post="${post}"
              @post-selected="${this.#onPostSelected}"
            ></post-card>
          `
        )}
      </div>
    `;
    }

    /** Enlace «Ver todos» apunta al archive de categoría (slug) o al grid general */
    get #gridLink() {
        if (!this._activeCatId) return '/grid';
        const cat = this._categories.find((c) => c.id === this._activeCatId);
        return cat ? `/category/${cat.slug}` : '/grid';
    }

    #renderSection() {
        const activeCat = this._categories.find((c) => c.id === this._activeCatId);
        const title = activeCat ? activeCat.name : 'Últimas entradas';

        return html`
      <section class="section" aria-label="${title}">
        <header class="section__header">
          <h2 class="section__title">${title}</h2>
          <button
            class="section__link"
            @click="${() => this.#navigate(this.#gridLink)}"
          >
            Ver todos →
          </button>
        </header>

        ${this.#renderFilterBar()}
        ${this.#renderPostsGrid()}
      </section>
    `;
    }

    render() {
        return html`
      ${this.#renderHero()}
      ${this.#renderSection()}
    `;
    }
}

customElements.define('view-home', ViewHome);
