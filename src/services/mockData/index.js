const dataModules = import.meta.glob('./*.json', { eager: true });
const mockData = {};
const mockMeta = {};

function normalizeRecords(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

function extractMeta(data) {
  if (data && typeof data === 'object' && data._meta) return data._meta;
  return null;
}

for (const [key, mod] of Object.entries(dataModules)) {
  const name = key.replace('./', '').replace('.json', '');
  mockData[name] = normalizeRecords(mod.default);
  const meta = extractMeta(mod.default);
  if (meta) mockMeta[name] = meta;
}

export { mockData, mockMeta };
