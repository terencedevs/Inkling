const isAdmin = (u) => u.profile === 'Admin_c';

export const select = (record, user) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return false;
};

export const insert = (record, user) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return false;
};

export const update = (record, user) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return false;
};

export const remove = (record, user) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return false;
};
