import { useEffect, useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { getStorageService } from '../../services/storage';

export function ProductPhoto({ path, name }: { path?: string; name: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let current = true; setUrl('');
    if (path) getDownloadURL(ref(getStorageService(), path)).then(value => { if (current) setUrl(value); }).catch(() => undefined);
    return () => { current = false; };
  }, [path]);
  return url ? <img src={url} alt={name} loading="lazy" style={{ width: '100%', height: 180, objectFit: 'cover' }} /> : null;
}
