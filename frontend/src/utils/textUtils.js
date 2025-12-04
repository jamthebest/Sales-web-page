/**
 * Normaliza un texto removiendo acentos y convirtiéndolo a minúsculas
 * para realizar búsquedas insensibles a acentos
 * @param {string} text - Texto a normalizar
 * @returns {string} Texto normalizado sin acentos y en minúsculas
 */
export const normalizeText = (text) => {
    if (!text) return '';

    return text
        .toLowerCase()
        .normalize('NFD') // Descompone caracteres con acentos
        .replace(/[\u0300-\u036f]/g, ''); // Elimina los diacríticos (acentos)
};

/**
 * Verifica si un texto incluye otro texto de forma insensible a acentos
 * @param {string} text - Texto donde buscar
 * @param {string} searchTerm - Término de búsqueda
 * @returns {boolean} true si el texto incluye el término de búsqueda
 */
export const includesIgnoreAccents = (text, searchTerm) => {
    return normalizeText(text).includes(normalizeText(searchTerm));
};
