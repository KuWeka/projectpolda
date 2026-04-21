/**
 * Query builder utility for safe, structured query construction
 * Replaces legacy string parsing with structured parameter-based approach
 */

class QueryBuilder {
  constructor(baseQuery) {
    this.baseQuery = baseQuery;
    this.whereConditions = [];
    this.params = [];
    this.orderByClauses = [];
    this.limit = null;
    this.offset = null;
  }

  /**
   * Add WHERE condition with parameter
   */
  where(condition, ...values) {
    if (condition) {
      this.whereConditions.push(condition);
      this.params.push(...values);
    }
    return this;
  }

  /**
   * Add conditional WHERE (only if value is truthy)
   */
  whereIf(condition, value) {
    if (value || value === 0 || value === false) {
      this.whereConditions.push(condition);
      this.params.push(value);
    }
    return this;
  }

  /**
   * Add IN clause
   */
  whereIn(field, values) {
    if (values && values.length > 0) {
      const placeholders = values.map(() => '?').join(',');
      this.whereConditions.push(`${field} IN (${placeholders})`);
      this.params.push(...values);
    }
    return this;
  }

  /**
   * Add LIKE clause for search
   */
  whereSearch(fields, searchTerm) {
    if (searchTerm && searchTerm.trim()) {
      const conditions = fields.map(f => `${f} LIKE ?`).join(' OR ');
      this.whereConditions.push(`(${conditions})`);
      const searchParam = `%${searchTerm.trim()}%`;
      fields.forEach(() => this.params.push(searchParam));
    }
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(field, direction = 'ASC') {
    if (!['ASC', 'DESC'].includes(direction.toUpperCase())) {
      direction = 'ASC'; // Default if invalid
    }
    this.orderByClauses.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }

  /**
   * Add LIMIT and OFFSET
   */
  paginate(limit, offset = 0) {
    this.limit = Math.max(0, parseInt(limit) || 0);
    this.offset = Math.max(0, parseInt(offset) || 0);
    return this;
  }

  /**
   * Build the complete query
   */
  build() {
    let query = this.baseQuery;
    const params = [...this.params];

    if (this.whereConditions.length > 0) {
      query += ' WHERE ' + this.whereConditions.join(' AND ');
    }

    if (this.orderByClauses.length > 0) {
      query += ' ORDER BY ' + this.orderByClauses.join(', ');
    }

    if (this.limit !== null && this.limit > 0) {
      query += ' LIMIT ?';
      params.push(this.limit);
      if (this.offset > 0) {
        query += ' OFFSET ?';
        params.push(this.offset);
      }
    }

    return { query, params };
  }

  /**
   * Build count query (removes ORDER BY, LIMIT, OFFSET)
   */
  buildCountQuery() {
    let query = this.baseQuery;

    if (this.whereConditions.length > 0) {
      query += ' WHERE ' + this.whereConditions.join(' AND ');
    }

    query = `SELECT COUNT(*) as total FROM (${query}) as count_source`;

    return { query, params: [...this.params] };
  }
}

/**
 * Parse sort parameter safely
 * Format: "field1,-field2,field3" (- prefix = DESC)
 * Returns array of { field, direction }
 */
function parseSortParam(sortParam, allowedFields) {
  if (!sortParam) return [];

  return sortParam
    .split(',')
    .map(field => {
      const isDesc = field.startsWith('-');
      const fieldName = isDesc ? field.substring(1) : field;

      // Validate field name
      if (!allowedFields.includes(fieldName)) {
        const logger = require('./logger');
        logger.warn(`Invalid sort field: ${fieldName}`);
        return null;
      }

      return {
        field: fieldName,
        direction: isDesc ? 'DESC' : 'ASC'
      };
    })
    .filter(Boolean);
}

/**
 * Validate and parse pagination parameters
 */
function parsePagination(page, perPage, limit, offset) {
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(perPage) || parseInt(limit) || 0;
  const offsetNum = parseInt(offset) || 0;

  if (pageNum < 1) throw new Error('Page must be >= 1');
  if (pageSize < 0) throw new Error('Page size cannot be negative');

  if (pageSize > 0 && page) {
    // Use page-based pagination
    return {
      limit: pageSize,
      offset: (pageNum - 1) * pageSize,
      page: pageNum,
      perPage: pageSize
    };
  } else if (pageSize > 0) {
    // Use offset-based pagination
    return {
      limit: pageSize,
      offset: offsetNum,
      page: null,
      perPage: pageSize
    };
  }

  // No pagination
  return { limit: 0, offset: 0, page: null, perPage: 0 };
}

module.exports = {
  QueryBuilder,
  parseSortParam,
  parsePagination
};
