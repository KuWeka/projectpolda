/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 */

class ApiResponse {
  constructor(success, data = null, message = null, meta = null) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success(data = null, message = null, meta = null) {
    return new ApiResponse(true, data, message, meta);
  }

  static error(message, errors = null, statusCode = 400) {
    const response = new ApiResponse(false, null, message);
    if (errors) response.errors = errors;
    response.statusCode = statusCode;
    return response;
  }

  static paginated(data, pagination, message = null) {
    return new ApiResponse(true, data, message, {
      pagination: {
        page: pagination.page,
        perPage: pagination.perPage,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.perPage)
      }
    });
  }
}

module.exports = { ApiResponse };