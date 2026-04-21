const { ApiResponse } = require('../../src/utils/apiResponse');

describe('ApiResponse', () => {
  test('success() should create success response', () => {
    const response = ApiResponse.success({ data: 'test' }, 'Success message');

    expect(response.success).toBe(true);
    expect(response.data).toEqual({ data: 'test' });
    expect(response.message).toBe('Success message');
    expect(response.timestamp).toBeDefined();
  });

  test('error() should create error response', () => {
    const response = ApiResponse.error('Error message', [{ field: 'test' }], 400);

    expect(response.success).toBe(false);
    expect(response.message).toBe('Error message');
    expect(response.errors).toEqual([{ field: 'test' }]);
    expect(response.timestamp).toBeDefined();
  });

  test('paginated() should create paginated response', () => {
    const pagination = { page: 1, perPage: 10, total: 25, totalPages: 3 };
    const response = ApiResponse.paginated([{ id: 1 }], pagination);

    expect(response.success).toBe(true);
    expect(response.data).toEqual([{ id: 1 }]);
    expect(response.meta.pagination).toEqual(pagination);
  });
});