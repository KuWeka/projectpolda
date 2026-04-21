const { cache } = require('./cache');

async function invalidateAdminDashboardCache() {
  await cache.del('dashboard:admin:summary');
}

async function invalidateTechnicianDashboardCache(technicianId) {
  if (technicianId) {
    await cache.del(`dashboard:technician:${technicianId}:summary`);
    return;
  }

  await cache.delByPattern('dashboard:technician:*:summary');
}

async function invalidateAllDashboardCaches() {
  await invalidateAdminDashboardCache();
  await invalidateTechnicianDashboardCache();
}

module.exports = {
  invalidateAdminDashboardCache,
  invalidateTechnicianDashboardCache,
  invalidateAllDashboardCaches,
};
