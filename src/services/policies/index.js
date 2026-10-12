const policyModules = import.meta.glob('./*.policy.js', { eager: true });
const policies = {};

for (const [key, mod] of Object.entries(policyModules)) {
  const name = key.replace('./', '').replace('.policy.js', '');
  policies[name] = mod;
}

export { policies };
