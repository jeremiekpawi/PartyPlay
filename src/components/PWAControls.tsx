'use client';

import React, { useState } from 'react';
import { Check, Download, Share, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTranslation } from '../i18n';

export const PWAInstallButton: React.FC<{ variant?: 'primary' | 'secondary' }> = ({
  variant = 'primary',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showFallbackHint, setShowFallbackHint] = useState(false);
  const { t } = useTranslation();

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <Check className="h-4 w-4 shrink-0" />
        <span>{t.pwa.installedNote}</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'primary'
            ? 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0'
            : 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0'
        }
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{t.pwa.installButton}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
        >
          <Share className="h-4 w-4 shrink-0" />
          <span>{t.pwa.iosButton}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h3 id="ios-install-title" className="text-lg font-bold text-slate-900">
                  {t.pwa.iosTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={t.pwa.iosClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-slate-600">
                <li>1. {t.pwa.iosStep1}</li>
                <li>2. {t.pwa.iosStep2}</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 min-h-[44px] w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {t.pwa.iosClose}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShowFallbackHint((prev) => !prev)}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{t.pwa.installButton}</span>
      </button>
      {showFallbackHint && (
        <p className="max-w-md text-xs leading-relaxed text-slate-600">{t.pwa.browserFallback}</p>
      )}
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-20 left-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-lg md:bottom-4 md:left-auto"
    >
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
      <div className="text-xs leading-relaxed">
        <p className="font-semibold">{t.pwa.offlineTitle}</p>
        <p className="text-amber-800">{t.pwa.offlineMessage}</p>
      </div>
    </div>
  );
};
