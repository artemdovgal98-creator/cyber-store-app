"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, LayoutGrid, ShieldHalf, Wand2, Zap } from "lucide-react";
import { api } from "@/lib/api";
import type { NutraCategory, NutraOffer } from "@/lib/types";
import { useLang } from "@/components/LanguageProvider";
import { useFavorites } from "@/lib/favorites";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Logo } from "@/components/Logo";
import { ShowcaseCard } from "@/components/ShowcaseCard";
import { OfferCard } from "@/components/OfferCard";
import { SoundToggle } from "@/components/SoundToggle";
import { OfferQuiz } from "@/components/OfferQuiz";
import { ProfitCalculator } from "@/components/widgets/ProfitCalculator";
import { RegionHitParade } from "@/components/widgets/RegionHitParade";
import { QrGenerator } from "@/components/widgets/QrGenerator";

interface CatalogData {
  витрини: Витрина [ ];
  категории: NutraCategory [ ];
  предложения: NutraOffer [ ];
}

type SortKey = "new" | "payout" | "цена" | "популярный";

export default function Main() {
  const { t, tx } = useLang();
  const favorites = useFavorites({
    добавлено: tx("fav_added"),
    удалено: tx("fav_removed"),
  });

  const [ data, setData ] = useState<CatalogData>({
    showcases: [],
    categories: [],
    offers: [],
  });
  const [ loading, setLoading ] = useState(true);
  const [ activeCategory, setActiveCategory ] = useState<string>("Все");
  const [ country, setCountry ] = useState<string>("all");
  const [ sort, setSort ] = useState<SortKey>("new");
  const [ onlyFavorites, setOnlyFavorites ] = useState(false);
  const [ isTma, setIsTma ] = useState(false);

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const forced = new URLSearchParams(window.location.search).get("tma") === "1";
      if (tg?.initData || forced) {
        setIsTma(true);
        tg?.ready();
        tg?.expand();
        tg?.setHeaderColor?.("#06060D");
        tg?.setBackgroundColor?.("#06060D");
        tg?.disableVerticalSwipes?.();
        document.documentElement.classList.add("tma");
        console.log("[tma] Telegram Mini App enabled", {
          platform: tg.platform,
          initDataUnsafe: tg.initDataUnsafe,
        });
      }
    } catch (err) {
      console.error("[tma] init failed:", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const res = await api.getCatalogData<CatalogData>("/api/catalog");
      if (res.ok && res.data) {
        setData(res.data);
        console.log(`[catalog loaded] showcases: ${res.data.showcases.length}, offers: ${res.data.offers.length}`);
      } else {
        console.error("[storefront] Failed to load catalog:", res.error);
      }
      setLoading(false);
    })();
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    data.offers.forEach((o) => o.country && set.add(o.country));
    return Array.from(set).sort();
  }, [data.offers]);

  const visibleOffers = useMemo(() => {
    let list = [...data.offers];
    if (activeCategory !== "Все") {
      list = list.filter((o) => {
        const id = typeof o.category === "object" ? o.category?._id : o.category_id;
        return id === activeCategory;
      });
    }
    if (country !== "all") {
      list = list.filter((o) => o.country === country);
    }
    if (onlyFavorites) {
      list = list.filter((o) => favorites.has(o._id));
    }
    switch (sort) {
      case "payout":
        list.sort((a, b) => Number(b.payout || 0) - Number(a.payout || 0));
        break;
      case "price":
        list.sort((a, b) => Number(b.цена || 0) - Number(a.цена || 0));
        break;
      case "популярный":
        list.sort((a, b) => Number(b.клики || 0) - Number(a.клики || 0));
        break;
      default:
        list.sort((a, b) => {
          const da = new Date(b.createdAt || 0).getTime();
          const db = new Date(a.createdAt || 0).getTime();
          return da - db;
        });
        break;
    }
    return list;
  }, [data.offers, activeCategory, country, onlyFavorites, sort, favorites]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
      <header className="sticky top-0 z-40 mx--4 mb-6 flex items-center justify-between gap-3 border-b border-white/5 bg-[#06060D]/80 px-4 py-3 backdrop-blur-xl sm:mx-6 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyFavorites((v) => !v)}
            data-accent="pink"
            className={`neon-btn lpx-3 lpy-2 text-[0.7rem] sm:inline ${
              onlyFavorites ? "neon-btn-ghost" : "neon-btn-ghost"
            }`}
          >
            <Heart className={`h-4 w-4 ${onlyFavorites ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">{t("избранное")}</span>
            {favorites.ids.length > 0 && (
              <span> ({favorites.ids.length})</span>
            )}
          </button>
          <SoundToggle />
          <LangSwitcher />
          {isTma && (
            <Link
              href="/admin"
              data-accent="violet"
              className="neon-btn lpx-3 lpy-2 text-[0.7rem]"
            >
              <ShieldHalf className="h-4 w-4 sm:inline" />
              <span className="hidden sm:inline">{t("админ")}</span>
            </Link>
          )}
        </div>
      </header>

      <section className="relative mb-10 overflow-hidden rounded-3xl border border-cyan-400/20 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-[90px]" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-300/40 bg-lime-300/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-lime-300">
            <Zap className="h-3 w-3" />
            <span>{t("brand_tagline")}</span>
          </div>
          <h1 className="font-display bg-gradient-to-r from-lime-300 via-cyan-300 to-fuchsia-400 bg-clip-text text-4xl font-extrabold text-transparent drop-shadow-[0_25px_rgba(34,211,238,0.35)] sm:text-6xl">
            {t("hero_title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            {t("hero_sub")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#nutra"
              data-accent="pink"
              className="neon-btn"
            >
              <Heart className="h-4 w-4" />
              <span>{t("исследовать")}</span>
            </a>
            <a
              href="#tools"
              data-accent="pink"
              className="neon-btn"
            >
              <Wand2 className="h-4 w-4" />
              <span>{t("инструменты")}</span>
            </a>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <div className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
          ) : (
            data.showcases.map((s) => (
              <ShowcaseCard key={s._id} item={s} />
            ))
          )}
        </div>
      </section>

      <section id="tools" className="mb-14 scroll-mt-24">
        <h2 className="font-display text-xl font-bold text-white">Инструменты</h2>
        <div className="mt-4 grid grid-cols-1 gap-5">
          <OfferQuiz offers={data.offers} />
          <div className="flex flex-col gap-5">
            <ProfitCalculator />
            <RegionHitParade />
          </div>
          <QrGenerator />
        </div>
      </section>

      <section id="nutra" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory("Все")}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                activeCategory === "Все"
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {t("Все")} ({data.offers.length})
            </button>
            {data.categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveCategory(c._id)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  activeCategory === c._id
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"
            >
              <option value="new">Новые</option>
              <option value="payout">По выплате</option>
              <option value="price">По цене</option>
              <option value="популярный">Популярные</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
          ) : (
            visibleOffers.map((o) => (
              <OfferCard key={o._id} offer={o} isFavorite={favorites.has(o._id)} onToggleFavorite={favorites.toggle} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
