import { createPermissions } from '@/services/permissions';

export const PROFILES = {
  Admin_c: {
    label: 'Writer',
    isDefault: true,
    isPublic: false,
    canManageTeam: true,
    reportsTo: null,
  },
};

const TABLE_PERMISSIONS = {
  Admin_c: {
    notes_c: { access: 'Full' },
  },
};

export const { getProfileMeta, getTableAccess, getFieldAccess } = createPermissions(PROFILES, TABLE_PERMISSIONS);
