/*
// -- Apper adapter --
const adapter = window.ApperSDK.ApperAdapter({
  getClient: () => new window.ApperSDK.ApperClient({
    apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
    apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
  }),
  ui: window.ApperSDK.ApperUI
});
*/
// ── Memory adapter (tests & prototyping) ──
import { mockData, mockMeta } from './mockData';
import { policies } from './policies';
const adapter = window.ApperSDK.MemoryAdapter({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
  seed: mockData,
  meta: mockMeta,
  policies, team:{}
});
export const sdk = await window.ApperSDK.CoreSDK.createClient(adapter);
