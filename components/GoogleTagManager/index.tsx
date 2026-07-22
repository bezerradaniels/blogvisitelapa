'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { consentGiven } from '@/components/CookieBanner';

const GTM_ID = 'GTM-T6SGJ6HB';

// O container só é carregado após o consentimento de cookies, conforme a LGPD.
export default function GoogleTagManager() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const initialConsentTimer = window.setTimeout(() => setEnabled(consentGiven()), 0);

    const handleConsent = (event: Event) => {
      if ((event as CustomEvent<'accepted' | 'rejected'>).detail === 'accepted') {
        setEnabled(true);
      }
    };

    window.addEventListener('vl-cookie-consent', handleConsent);
    return () => {
      window.clearTimeout(initialConsentTimer);
      window.removeEventListener('vl-cookie-consent', handleConsent);
    };
  }, []);

  if (!enabled) return null;

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}
