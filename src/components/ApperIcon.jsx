import * as Icons from "lucide-react";
import { memo } from 'react';

const toPascal = (s) => (typeof s === 'string' ? s : '')
  .split('-')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');

function ApperIcon({ name, size = 20, className = '', ...props }) {
  if (!name) return null;
  const Icon = Icons[toPascal(name)];
  if(!Icon) return null;
  return <Icon size={size} className={className} {...props} />;
}
export default memo(ApperIcon);