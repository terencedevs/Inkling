// Frozen permission helpers. The generated src/services/userPermissions.js supplies the
// app-specific PROFILES and TABLE_PERMISSIONS maps and re-exports the returned functions.
export function createPermissions(profiles, tablePermissions) {
  function getProfileMeta(profile) {
    return profiles[profile] ?? { label: profile, isDefault: false, isPublic: false, canManageTeam: false, reportsTo: null };
  }

  function getTableAccess(profile, table) {
    const p = tablePermissions[profile]?.[table];
    if (!p) return { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
    const a = p.access ?? '';
    const full = a === 'Full';
    return {
      canRead: full || a.includes('Read'),
      canCreate: full || a.includes('Create'),
      canUpdate: full || a.includes('Update'),
      canDelete: full || a.includes('Delete'),
    };
  }

  function getFieldAccess(profile, table, field) {
    const p = tablePermissions[profile]?.[table];
    return {
      hidden: p?.inaccessibleFields?.includes(field) ?? false,
      readOnly: p?.readOnlyFields?.includes(field) ?? false,
    };
  }

  return { getProfileMeta, getTableAccess, getFieldAccess };
}
