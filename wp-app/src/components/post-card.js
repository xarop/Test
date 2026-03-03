/**
 * @file post-card.js
 * @description Componente atómico que representa una tarjeta de post de WordPress.
 * Emite un evento 'post-selected' con el ID del post cuando el usuario hace clic.
 *
 * @attr {Object} post — Objeto post de la REST API de WP con _embed
 *
 * @fires post-selected — { detail: { id: number } }
 *
 * @example
 * <post-card .post="${postObject}"></post-card>
 */

import { LitElement, html, nothing } from 'lit';
import { wpService } from '../wp-service.js';
import { Icon } from '../icons.js';
import { sharedStyles } from '../styles/shared.styles.js';
import { cardStyles } from '../styles/card.styles.js';

export class PostCard extends LitElement {
    static styles = [sharedStyles, cardStyles];

    static properties = {
        post: { type: Object },
    };

    constructor() {
        super();
        /** @type {Object|null} */
        this.post = null;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** @returns {string|null} URL de la imagen destacada */
    get #featuredImage() {
        return wpService.constructor.getFeaturedImageUrl(this.post, 'medium_large');
    }

    /** @returns {string} Nombre del autor */
    get #author() {
        return wpService.constructor.getAuthorName(this.post);
    }

    /** @returns {string[]} Nombre de las categorías */
    get #categories() {
        return wpService.constructor.getCategories(this.post);
    }

    /** @returns {string} Fecha de publicación formateada */
    get #date() {
        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(this.post.date));
    }

    /** @returns {string} Resumen limpio (sin HTML) */
    get #excerpt() {
        const raw = this.post.excerpt?.rendered ?? '';
        const tmp = document.createElement('div');
        tmp.innerHTML = raw;
        return tmp.textContent.trim().slice(0, 140);
    }

    // ─── Handlers ─────────────────────────────────────────────────────────────

    #handleClick() {
        this.dispatchEvent(
            new CustomEvent('post-selected', {
                detail: { id: this.post.id },
                bubbles: true,
                composed: true,
            })
        );
    }

    #handleKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.#handleClick();
        }
    }

    // ─── Templates ────────────────────────────────────────────────────────────

    #renderThumbnail() {
        return html`
      <div class="card__thumb">
        ${this.#featuredImage
                ? html`<img
              src="${this.#featuredImage}"
              alt="${this.post.title?.rendered ?? 'Post'}"
              loading="lazy"
              decoding="async"
            />`
                : html`<div class="card__thumb-placeholder">${Icon.fileText({ size: 32 })}</div>`}

        ${this.#categories.length
                ? html`
              <div class="card__cats">
                ${this.#categories.slice(0, 2).map(
                    (cat) => html`<span class="card__cat">${cat}</span>`
                )}
              </div>
            `
                : nothing}
      </div>
    `;
    }

    #renderBody() {
        return html`
      <div class="card__body">
        <h3 class="card__title">
          ${this.post.title?.rendered ?? 'Sin título'}
        </h3>
        ${this.#excerpt
                ? html`<p class="card__excerpt">${this.#excerpt}…</p>`
                : nothing}
      </div>
    `;
    }

    #renderFooter() {
        return html`
      <footer class="card__footer">
        <span class="card__author">${Icon.user({ size: 12 })} ${this.#author}</span>
        <span class="card__date">${this.#date}</span>
        <span class="read-more">Leer ${Icon.chevronRight({ size: 13 })}</span>
      </footer>
    `;
    }

    render() {
        if (!this.post) return nothing;

        return html`
      <article
        class="card"
        role="button"
        tabindex="0"
        aria-label="Leer el post: ${this.post.title?.rendered}"
        @click="${this.#handleClick}"
        @keydown="${this.#handleKeydown}"
      >
        ${this.#renderThumbnail()}
        ${this.#renderBody()}
        ${this.#renderFooter()}
      </article>
    `;
    }
}

customElements.define('post-card', PostCard);
