import { useState } from 'react';
import { isImageUrl } from '../../services/commerceTransactions';

export function ProductPhoto({ path, name }: { path?: string; name: string }) {
  const [failedPath, setFailedPath] = useState('');
  return path && isImageUrl(path) && path !== failedPath ? <img src={path} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedPath(path)} style={{ width: '100%', height: 180, objectFit: 'cover' }} /> : null;
}
