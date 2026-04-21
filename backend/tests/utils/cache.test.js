const { cache, RedisCache } = require('../../src/utils/cache');

describe('RedisCache utility', () => {
  test('generateTicketsListKey should be deterministic regardless of filter order', () => {
    const keyA = RedisCache.generateTicketsListKey({ status: 'Pending', urgency: 'Tinggi' });
    const keyB = RedisCache.generateTicketsListKey({ urgency: 'Tinggi', status: 'Pending' });

    expect(keyA).toBe(keyB);
  });

  test('key generators should produce expected prefixes', () => {
    expect(RedisCache.generateUserKey('u1')).toBe('user:u1');
    expect(RedisCache.generateTicketKey('t1')).toBe('ticket:t1');
    expect(RedisCache.generateChatKey('c1')).toBe('chat:c1');
    expect(RedisCache.generateMessagesKey('c1', 2, 50)).toBe('chat:c1:messages:2:50');
    expect(RedisCache.generateStatsKey('dashboard')).toBe('stats:dashboard');
  });

  test('cache operations should safely fallback when redis is disconnected', async () => {
    cache.isConnected = false;

    await expect(cache.set('foo', { bar: 1 }, 10)).resolves.toBe(false);
    await expect(cache.get('foo')).resolves.toBeNull();
    await expect(cache.del('foo')).resolves.toBe(false);
    await expect(cache.delByPattern('foo:*')).resolves.toBe(0);
    await expect(cache.exists('foo')).resolves.toBe(false);
  });

  test('getMultiple should return empty array when redis is disconnected', async () => {
    cache.isConnected = false;
    await expect(cache.getMultiple(['a', 'b'])).resolves.toEqual([]);
  });
});