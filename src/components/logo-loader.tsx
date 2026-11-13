import { useEffect, useState } from 'react';
const logo = { url: '/__l5e/assets-v1/6b957660-dece-4384-b73d-96eeae256221/b1770cff-logo.webp' };

// Delay feedback only, never the operation or its completed content.
export function useLoadingIndicator(loading: boolean) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!loading) { setVisible(false); return; }
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, [loading]);
  return loading && visible;
}

export function LogoLoader({ label = 'Loading…' }: { label?: string }) {
  return <div className="logo-loader" role="status" aria-label={label}>
    <span className="logo-loader-ring" aria-hidden="true" />
    <img className="logo-loader-image" src={logo.url} alt="" aria-hidden="true" />
  </div>;
}
