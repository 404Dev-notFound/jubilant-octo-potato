/*
 * CodeCollab Centralized Pagination, Sorting & Search Utility
 * ----------------------------------------------------------------------
 * Safely parses, clamps, and validates query parameters for pagination,
 * enforces sort field allowlists, and attaches pagination response headers.
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Parse and validate pagination, sorting, and search query parameters.
 */
function parsePagination(query = {}, options = {}) {
    const {
        defaultLimit = DEFAULT_LIMIT,
        maxLimit = MAX_LIMIT,
        allowedSortFields = ['createdAt', 'updatedAt', 'title', 'name', 'id'],
        defaultSortBy = 'createdAt',
        defaultSortOrder = 'desc'
    } = options;

    // 1. Parse and clamp page
    let page = parseInt(query.page, 10);
    if (isNaN(page) || page < 1) page = 1;

    // 2. Parse and clamp limit
    let limit = parseInt(query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    const skip = (page - 1) * limit;

    // 3. Validate sort field against allowlist
    const requestedSortBy = String(query.sortBy || '').trim();
    const sortBy = allowedSortFields.includes(requestedSortBy)
        ? requestedSortBy
        : defaultSortBy;

    // 4. Validate sort order
    const requestedOrder = String(query.sortOrder || '').toLowerCase().trim();
    const sortOrder = (requestedOrder === 'asc' || requestedOrder === 'desc')
        ? requestedOrder
        : defaultSortOrder;

    // 5. Parse search term
    const search = typeof query.search === 'string' ? query.search.trim() : '';

    return {
        page,
        limit,
        skip,
        sortBy,
        sortOrder,
        order: sortOrder,
        search
    };
}

/**
 * Attach standardized pagination headers to response without breaking
 * backward compatibility for endpoints that return direct arrays.
 */
function attachPaginationHeaders(res, totalOrObj, page, limit) {
    let total = 0;
    let p = 1;
    let l = DEFAULT_LIMIT;

    if (typeof totalOrObj === 'object' && totalOrObj !== null) {
        total = typeof totalOrObj.total === 'number' ? totalOrObj.total : (totalOrObj.totalCount || 0);
        p = totalOrObj.page || 1;
        l = totalOrObj.limit || DEFAULT_LIMIT;
    } else {
        total = typeof totalOrObj === 'number' ? totalOrObj : (parseInt(totalOrObj, 10) || 0);
        p = typeof page === 'number' ? page : (parseInt(page, 10) || 1);
        l = typeof limit === 'number' ? limit : (parseInt(limit, 10) || DEFAULT_LIMIT);
    }

    const totalPages = Math.ceil(total / l) || 1;
    res.setHeader('X-Total-Count', String(total));
    res.setHeader('X-Page', String(p));
    res.setHeader('X-Limit', String(l));
    res.setHeader('X-Total-Pages', String(totalPages));
    
    // Ensure CORS exposes these pagination headers to client SPA
    const existingExposed = res.getHeader('Access-Control-Expose-Headers') || '';
    const newHeaders = 'X-Total-Count, X-Page, X-Limit, X-Total-Pages, Content-Range';
    res.setHeader(
        'Access-Control-Expose-Headers',
        existingExposed ? `${existingExposed}, ${newHeaders}` : newHeaders
    );
}

/**
 * In-memory pagination, sorting, and search for file-fallback arrays.
 */
function paginateArray(items = [], paginationOrPage = {}, limitOrFilter = null, searchFilterFn = null) {
    let result = Array.isArray(items) ? [...items] : [];
    let pagination = {};
    let filterFn = null;

    if (typeof paginationOrPage === 'number') {
        const page = Math.max(1, paginationOrPage);
        const limit = typeof limitOrFilter === 'number' ? Math.max(1, limitOrFilter) : DEFAULT_LIMIT;
        pagination = {
            page,
            limit,
            skip: (page - 1) * limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            search: ''
        };
        filterFn = searchFilterFn;
    } else {
        pagination = paginationOrPage || {};
        if (typeof limitOrFilter === 'function') {
            filterFn = limitOrFilter;
        } else if (typeof searchFilterFn === 'function') {
            filterFn = searchFilterFn;
        }
    }

    const page = typeof pagination.page === 'number' ? pagination.page : 1;
    const limit = typeof pagination.limit === 'number' ? pagination.limit : DEFAULT_LIMIT;
    const skip = typeof pagination.skip === 'number' ? pagination.skip : (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    // 1. Search filtering
    if (pagination.search && filterFn) {
        result = result.filter(item => filterFn(item, pagination.search.toLowerCase()));
    }

    const total = result.length;

    // 2. Sorting
    result.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'string' && typeof valB === 'string') {
            const cmp = valA.localeCompare(valB);
            return sortOrder === 'asc' ? cmp : -cmp;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. Slicing
    const paginated = result.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
        data: paginated,
        total,
        page,
        limit,
        totalPages,
        pagination: {
            total,
            page,
            limit,
            totalPages
        }
    };
}

module.exports = {
    DEFAULT_LIMIT,
    MAX_LIMIT,
    parsePagination,
    attachPaginationHeaders,
    paginateArray
};
