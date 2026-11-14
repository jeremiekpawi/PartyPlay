'use client';

import React, { useState } from 'react';
import { ArrowRight, Box, Brush, Smartphone, Users } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { PlayTab } from '../../shared/types';
import { PWAInstallButton } from '../../components/PWAControls';

const LOBBY_PREVIEW_SRC = '/images/lobby_3d_preview.jpg';
const DRAW_GUESS_PREVIEW_SRC = '/images/draw_guess_preview.jpg';

interface HomeViewProps {
  onStartPlay: (tab: PlayTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartPlay }) => {
  const { t } = useTranslation();
  const [lobbyImgFailed, setLobbyImgFailed] = useState(false);
  const [gameImgFailed, setGameImgFailed] = useState(false);

  return (
    <div id="top" className="pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 lg:pt-16 lg:pb-20">
        <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-sm font-medium text-slate-500">{t.hero.kicker}</p>
            <h1 className="mt-3 text-[clamp(2.15rem,4vw,3.4rem)] leading-[1.08] font-extrabold tracking-tight text-slate-900 [text-wrap:balance]">
              {t.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {t.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onStartPlay('create')}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onStartPlay('join')}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
              >
                {t.hero.secondaryCta}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <figure className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative aspect-16/10 w-full flex-1 overflow-hidden bg-slate-100">
                {!lobbyImgFailed ? (
                  <img
                    src={LOBBY_PREVIEW_SRC}
                    alt="Aperçu du salon virtuel 3D PartyPlay"
                    referrerPolicy="no-referrer"
                    onError={() => setLobbyImgFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 p-8 text-center text-slate-500">
                    <Box className="h-10 w-10 text-blue-600" />
                    <p className="text-sm font-semibold text-slate-800">{t.hero.lobbyCaptionTitle}</p>
                  </div>
                )}
              </div>
              <figcaption className="flex flex-col gap-1 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900">{t.hero.lobbyCaptionTitle}</span>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    {t.hero.lobbyCaptionText}
                  </p>
                </div>
                <span className="font-mono text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap shrink-0">
                  2–6 joueurs
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="comment-ca-marche"
        className="border-t border-slate-200 bg-white py-14 lg:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [text-wrap:balance]">
              {t.howItWorks.heading}
            </h2>
            <p className="mt-2.5 text-base text-slate-600">{t.howItWorks.subheading}</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {t.howItWorks.steps.map((step) => (
              <div
                key={step.num}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6"
              >
                <span className="font-mono text-sm font-semibold text-blue-600 tabular-nums">
                  {step.num}
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* First Mini-Game Showcase */}
      <section id="dessine-et-devine" className="border-t border-slate-200 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="order-2 lg:order-1 lg:col-span-6">
              <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {!gameImgFailed ? (
                  <img
                    src={DRAW_GUESS_PREVIEW_SRC}
                    alt="Illustration du mini-jeu Dessine et Devine"
                    referrerPolicy="no-referrer"
                    onError={() => setGameImgFailed(true)}
                    className="h-full min-h-[260px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 bg-slate-100 p-8 text-center">
                    <Brush className="h-10 w-10 text-amber-600" />
                    <p className="text-sm font-semibold text-slate-800">{t.miniGame.heading}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="order-1 flex flex-col justify-center lg:order-2 lg:col-span-6">
              <p className="text-sm font-medium text-slate-500">{t.miniGame.kicker}</p>
              <h2 className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 [text-wrap:balance]">
                {t.miniGame.heading}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                {t.miniGame.description}
              </p>

              <ul className="mt-6 space-y-3 border-t border-slate-200 pt-6">
                {t.miniGame.rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => onStartPlay('create')}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span>{t.miniGame.cta}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PWA Install Section */}
      <section
        id="installer-pwa"
        className="border-t border-slate-200 bg-white py-14 lg:py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2.5 text-blue-600">
                <Smartphone className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">Android · Navigateur mobile · PC</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
                {t.pwa.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                {t.pwa.description}
              </p>
            </div>

            <div className="shrink-0">
              <PWAInstallButton variant="primary" />
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-medium text-slate-700">{t.footer.tagline}</p>
          <p>{t.footer.note}</p>
        </div>
      </footer>
    </div>
  );
};
