'use client';

import React from 'react';
import { Gamepad2, Home, PlusCircle, UserCheck } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { AppRoute, PlayTab } from '../shared/types';

interface TopBarProps {
  route: AppRoute;
  playTab: PlayTab;
  onNavigateHome: (sectionId?: string) => void;
  onNavigatePlay: (tab: PlayTab) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  route,
  playTab,
  onNavigateHome,
  onNavigatePlay,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <header className="border-b border-slate-200 bg-white md:sticky md:top-0 md:z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome('top');
            }}
            className="font-display text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            {t.brand}
          </a>

          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome('top');
              }}
              className="transition-colors hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              {t.nav.home}
            </a>
            <a
              href="#comment-ca-marche"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome('comment-ca-marche');
              }}
              className="transition-colors hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              {t.nav.howItWorks}
            </a>
            <a
              href="#dessine-et-devine"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome('dessine-et-devine');
              }}
              className="transition-colors hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              {t.nav.miniGame}
            </a>
            <a
              href="#installer-pwa"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome('installer-pwa');
              }}
              className="transition-colors hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              {t.nav.install}
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigatePlay('create')}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
            >
              {t.nav.playCta}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom thumb-zone navigation (stays under 10% viewport height) */}
      <nav
        aria-label="Navigation mobile"
        className="fixed right-0 bottom-0 left-0 z-40 grid h-15 grid-cols-3 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      >
        <button
          type="button"
          onClick={() => onNavigateHome('top')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
            route === 'home' ? 'text-blue-600' : 'text-slate-600'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>{t.nav.home}</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigatePlay('create')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
            route === 'play' && playTab === 'create' ? 'text-blue-600' : 'text-slate-600'
          }`}
        >
          <PlusCircle className="h-5 w-5" />
          <span>{t.room.createTab.split(' ')[0]}</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigatePlay('join')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
            route === 'play' && playTab === 'join' ? 'text-blue-600' : 'text-slate-600'
          }`}
        >
          {route === 'play' && playTab === 'join' ? (
            <UserCheck className="h-5 w-5" />
          ) : (
            <Gamepad2 className="h-5 w-5" />
          )}
          <span>{t.room.joinTab.split(' ')[0]}</span>
        </button>
      </nav>
    </>
  );
};
