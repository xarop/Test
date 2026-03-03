/**
 * @file wp-service.js
 * @description Singleton que centraliza todas las llamadas a la REST API de WordPress.
 * Implementa caché en memoria para evitar peticiones duplicadas y mejorar el rendimiento.
 *
 * Uso:
 *   import { wpService } from './wp-service.js';
 *   const posts = await wpService.getPosts();
 */

const BASE_URL = 'https://xarop.com/wp-json/wp/v2';

class WpService {
    /** @type {WpService|null} Instancia única del Singleton */
    static #instance = null;

    /** @type {Map<string, any>} Caché en memoria por URL */
    #cache = new Map();

    // Constructor privado: no usar directamente, usar WpService.getInstance()
    constructor() {
        if (WpService.#instance) {
            throw new Error('Usa WpService.getInstance() en lugar del constructor.');
        }
    }

    /**
     * Devuelve la instancia única (Singleton).
     * @returns {WpService}
     */
    static getInstance() {
        if (!WpService.#instance) {
            WpService.#instance = new WpService();
        }
        return WpService.#instance;
    }

    // ─── Métodos privados ──────────────────────────────────────────────────────

    /**
     * Realiza un fetch con caché en memoria.
     * @param {string} url
     * @returns {Promise<any>}
     */
    async #fetchWithCache(url) {
        if (this.#cache.has(url)) {
            return this.#cache.get(url);
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `WpService: Error HTTP ${response.status} — ${response.statusText} [${url}]`
            );
        }

        const data = await response.json();
        this.#cache.set(url, data);
        return data;
    }

    // ─── API Pública ───────────────────────────────────────────────────────────

    /**
     * Obtiene un listado paginado de posts con sus datos embebidos (_embed).
     * @param {{ page?: number, perPage?: number }} [options]
     * @returns {Promise<Array>}
     */
    async getPosts({ page = 1, perPage = 12 } = {}) {
        const url = `${BASE_URL}/posts?_embed&page=${page}&per_page=${perPage}&orderby=date&order=desc`;
        return this.#fetchWithCache(url);
    }

    /**
     * Obtiene el detalle de un post por ID con datos embebidos.
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async getPostById(id) {
        const url = `${BASE_URL}/posts/${id}?_embed`;
        return this.#fetchWithCache(url);
    }

    /**
     * Obtiene un listado paginado de páginas con sus datos embebidos.
     * @param {{ page?: number, perPage?: number }} [options]
     * @returns {Promise<Array>}
     */
    async getPages({ page = 1, perPage = 12 } = {}) {
        const url = `${BASE_URL}/pages?_embed&page=${page}&per_page=${perPage}`;
        return this.#fetchWithCache(url);
    }

    /**
     * Obtiene el detalle de una página por ID.
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async getPageById(id) {
        const url = `${BASE_URL}/pages/${id}?_embed`;
        return this.#fetchWithCache(url);
    }

    /**
     * Obtiene posts filtrados por categoría.
     * @param {number} categoryId
     * @param {{ page?: number, perPage?: number }} [options]
     * @returns {Promise<Array>}
     */
    async getPostsByCategoryId(categoryId, { page = 1, perPage = 12 } = {}) {
        const url = `${BASE_URL}/posts?_embed&categories=${categoryId}&page=${page}&per_page=${perPage}&orderby=date&order=desc`;
        return this.#fetchWithCache(url);
    }

    /**
     * Obtiene todas las categorías con al menos un post.
     * @returns {Promise<Array>}
     */
    async getAllCategories() {
        const url = `${BASE_URL}/categories?per_page=100&hide_empty=true&orderby=count&order=desc`;
        return this.#fetchWithCache(url);
    }

    /**
     * Busca posts por término de búsqueda.
     * @param {string} query
     * @returns {Promise<Array>}
     */
    async searchPosts(query) {
        const url = `${BASE_URL}/posts?_embed&search=${encodeURIComponent(query)}&per_page=10`;
        return this.#fetchWithCache(url);
    }

    /**
     * Invalida toda la caché en memoria.
     * Útil para forzar refetch tras una actualización.
     */
    clearCache() {
        this.#cache.clear();
    }

    /**
     * Helpers de utilidad para extraer datos comunes de un post de WP.
     */

    /**
     * Devuelve la URL de la imagen destacada de un post (o null si no tiene).
     * @param {Object} post — Post con _embedded
     * @param {'full'|'large'|'medium'|'thumbnail'} [size]
     * @returns {string|null}
     */
    static getFeaturedImageUrl(post, size = 'large') {
        try {
            const media = post._embedded?.['wp:featuredmedia']?.[0];
            if (!media) return null;
            return (
                media.media_details?.sizes?.[size]?.source_url ??
                media.source_url ??
                null
            );
        } catch {
            return null;
        }
    }

    /**
     * Devuelve el nombre del autor de un post.
     * @param {Object} post
     * @returns {string}
     */
    static getAuthorName(post) {
        return post._embedded?.author?.[0]?.name ?? 'Desconocido';
    }

    /**
     * Devuelve las categorías de un post como array de strings.
     * @param {Object} post
     * @returns {string[]}
     */
    static getCategories(post) {
        return (
            post._embedded?.['wp:term']?.[0]?.map((cat) => cat.name) ?? []
        );
    }

    /**
     * Devuelve las categorías con sus datos completos (id, name, slug).
     * Útil para construir URLs amigables.
     * @param {Object} post
     * @returns {Array<{id: number, name: string, slug: string}>}
     */
    static getCategoriesRaw(post) {
        return (
            post._embedded?.['wp:term']?.[0]?.map(({ id, name, slug }) => ({ id, name, slug })) ?? []
        );
    }

    /**
     * Obtiene una categoría por su slug.
     * @param {string} slug
     * @returns {Promise<Object>}
     */
    async getCategoryBySlug(slug) {
        const url = `${BASE_URL}/categories?slug=${encodeURIComponent(slug)}`;
        const list = await this.#fetchWithCache(url);
        if (!list.length) throw new Error(`Categoría no encontrada: "${slug}"`);
        return list[0];
    }

    /**
     * Obtiene posts paginados filtrando por ID de categoría, retornando
     * también los totales desde las cabeceras HTTP.
     * @param {number} categoryId
     * @param {{ page?: number, perPage?: number }} [options]
     * @returns {Promise<{ posts: Array, total: number, totalPages: number }>}
     */
    async getPostsByCategoryPaged(categoryId, { page = 1, perPage = 9 } = {}) {
        const url = `${BASE_URL}/posts?_embed&categories=${categoryId}&page=${page}&per_page=${perPage}&orderby=date&order=desc`;
        // No podemos usar #fetchWithCache aquí porque necesitamos las cabeceras
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} — ${response.statusText}`);
        }
        const posts = await response.json();
        const total = parseInt(response.headers.get('X-WP-Total') ?? '0', 10);
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10);
        return { posts, total, totalPages };
    }
}

/** Instancia exportada lista para usar en toda la app */
export const wpService = WpService.getInstance();
