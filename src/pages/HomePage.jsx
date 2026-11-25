import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DotLottie } from '@lottiefiles/dotlottie-web';
import { useCms } from '../data/CmsContext';
import { useStillMode } from '../hooks/useA11y';
import { useRouter } from '../router';
import { DiscussButtons } from '../components/DiscussButtons';
import { ChatIcon, ChatSlashIcon } from '../components/Icons';
import { RequestBuilder } from '../components/RequestBuilder';
import { EASE_OUT, Reveal } from '../components/Reveal';

const LETS_COOK_DESKTOP = './assets/figma/_dc/lets_cook/lets-cook-figma.svg';
const LETS_COOK_MOBILE = './assets/figma/_dc/lets_cook/lets-cook-figma-spaced.svg';
const STICKERS_PHOTO = './assets/figma/_dc/stickers_full/profile_pic_made_with_love_trim.png';
const BRANDING_LOTTIE = './assets/figma/_dc/branding/45-seconds.lottie';
const DOTLOTTIE_WASM = './js/dotlottie/dotlottie-player.wasm';

const AI_COPY = [
  [
    { t: 'Создаю AI-фото и видео для брендов и соцсетей. Разрабатываю ' },
    { t: 'AI-моделей', b: true },
    {
      t: ' с нуля – с уникальной внешностью и сторителлингом – и создаю с ними съёмки профессионального уровня с полным',
    },
    { t: ' контролем сцены и образа' },
    { t: '.' },
  ],
  [
    { t: 'Также делаю ' },
    { t: 'товарные фотосессии', b: true },
    {
      t: ': обычное фото продукта превращаю в студийную версию, визуализацию в пространстве и сценариях использования. ',
    },
  ],
  [
    {
      t: 'Работаю как с пакетной обработкой, так и с уникальными художественными работами.',
      b: true,
    },
    {
      t: ' На выходе – цельный визуал, который выглядит статусно, близко к реальности и масштабируемо до портрета потенциального клиента.',
    },
  ],
];

const AR_COPY = [
  [
    { t: 'Уже более 7 лет создаю AR-эффекты для ' },
    { t: 'Snapchat, TikTok и WebAR.', b: true },
    { t: ' А начинал с Instagram.' },
  ],
  [
    { t: 'Я здесь чтобы ' },
    { t: 'собрать игру', b: true },
    { t: ' для роста вовлечения, разработать ' },
    { t: 'Try-On', b: true },
    { t: ' для ваших аксессуаров или косметики, сделать ' },
    { t: 'интерактив для мероприятия', b: true },
    { t: ', ' },
    { t: 'упаковки товара', b: true },
    {
      t: ' или мерча. Веду разработку от креативной идеи до технической реализации под ключ. На выходе цепляющий AR-опыт, который органично вписывается в сторис и Reels и тем самым решает задачу связи бренда с массовым потребителем и генерацией ',
    },
    { t: 'вирусного', b: true },
    { t: ' контента.' },
  ],
  [
    {
      t: 'Попробуйте сами – пачка мармелада слева оживает на любом устройстве с камерой.',
      b: true,
    },
  ],
];

const TOOLS = {
  graphic: [
    { src: './assets/figma/dbbfc.png', alt: 'Photoshop' },
    { src: './assets/figma/b5e62.png', alt: 'Illustrator' },
    { src: './assets/figma/5bcd8.png', alt: 'Figma' },
    { src: './assets/figma/0e1e6.png', alt: 'Procreate' },
  ],
  video: { src: './assets/figma/1af5c.png', alt: 'CapCut' },
  ar: [
    { src: './assets/figma/122e2.png', alt: 'Snapchat' },
    { src: './assets/figma/d72ac.png', alt: 'TikTok' },
  ],
  three: { src: './assets/figma/3d395.png', alt: 'Blender' },
  neural: [
    { src: './assets/figma/d0db1.png', alt: 'ChatGPT' },
    { src: './assets/figma/d0930.png', alt: 'Midjourney' },
    { src: './assets/figma/34cb2.png', alt: 'Seedream' },
    { src: './assets/figma/353b1.png', alt: 'Neural' },
  ],
};

/* ───────── 1. Hero ($8) ───────── */
function ShaderCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const boot = () => {
      if (cancelled || !canvasRef.current) return;
      if (typeof window.__bootLedniqueShader === 'function') {
        window.__bootLedniqueShader(canvasRef.current);
      }
    };
    if (typeof window.__bootLedniqueShader === 'function') {
      boot();
    } else {
      const id = window.setInterval(() => {
        if (typeof window.__bootLedniqueShader === 'function') {
          window.clearInterval(id);
          boot();
        }
      }, 60);
      return () => {
        cancelled = true;
        window.clearInterval(id);
      };
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return <canvas id="gl" ref={canvasRef} className="hero__shader" aria-hidden="true" />;
}

function HeroSection() {
  const still = useStillMode();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1000px)').matches
  );
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1000px)');
    const onChange = () => {
      setIsMobile(mq.matches);
      setScrolledPast(mq.matches && window.scrollY > 80);
    };
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (still || !isMobile) return;
    const onScroll = () => {
      if (window.scrollY > 80) setScrolledPast(true);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [still, isMobile]);

  return (
    <section className="hero canvas" aria-label="LEDNIQUE — главная" id="top">
      <div className="hero__bg" aria-hidden="true">
        <img
          className="hero__bg-fallback"
          src="./assets/figma/_dc/hero/6b2c4945dd833d20a742b69906ddc84fe182b8cb.webp"
          alt=""
        />
        {!still && <ShaderCanvas />}
      </div>

      <div className="badge-design">
        <img className="badge__mark" src="./assets/figma/b4030.svg" alt="Design küchen" />
        <span className="badge-since">since 2014</span>
      </div>

      <div className="hero__content">
        <div className="hero__title">
          <div className="hero__title-inner">
            <div className="hero__title-plate">
              <h1 className="hero__h1">
                <picture className="hero__title-picture">
                  <source media="(max-width: 1000px)" srcSet={LETS_COOK_MOBILE} />
                  <img className="hero__title-art" src={LETS_COOK_DESKTOP} alt="Let’s Cook!" />
                </picture>
              </h1>
            </div>
          </div>
        </div>

        <div className="hero__info">
          <h2 className="hero__name">
            @lednique
            <span className="hero__name-suffix"> / viktor</span>
          </h2>
          <p className="role">
            graphic designer / AI
            <br />/ e-commerce / AR
          </p>
          <p className="meta">
            GMT +3
            <br />/ удаленная работа / релокация
            <br />/ гибрид ижевск
          </p>
        </div>

        <motion.div
          className="hero__photo"
          data-reveal="1"
          initial={still || !isMobile ? false : { opacity: 0, y: 24 }}
          animate={still || !isMobile || scrolledPast ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: still ? 0 : 0.65, ease: EASE_OUT }}
        >
          <picture>
            <img
              className="hero__stickers"
              src={STICKERS_PHOTO}
              alt="Виктор Власов — Made with Love & Taste by Conceptional Chef"
            />
          </picture>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────── 2. Today Menu (sS, CMS-driven up to 6 cards) ───────── */
const CASE_OPEN_H = 480;
const CASE_SHORT_H = 141;

function TodaySection() {
  const still = useStillMode();
  const { cms, resolveUrl } = useCms();
  const { navigate } = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [openIdx, setOpenIdx] = useState(0);

  const cards = cms.home.menuCards || [];

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth <= 1000);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const openLink = (href) => {
    if (!href) return;
    if (/^https?:\/\//i.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (href.startsWith('#/')) {
      navigate(href.slice(1));
    } else if (href.startsWith('/')) {
      navigate(href);
    } else if (href.startsWith('#')) {
      navigate('/', { anchor: href.slice(1) });
    } else {
      navigate(href);
    }
  };

  return (
    <section className="section content" id="design">
      <Reveal as="h2" className="section-title" stagger={0.045}>
        сегодня в меню – избранные позиции
      </Reveal>
      <Reveal as="p" className="section-lead" delay={0.15} stagger={0.03}>
        Актуальные и показательные проекты, над которыми я работал!
        <br />
        Брендинг, дополненная реальность, UI/UX, авторское.
      </Reveal>

      <div className="cases__grid">
        {cards.map((card, i) => {
          const isOpen = !isMobile || openIdx === i;
          const isShort = isMobile && !isOpen;
          const imgSrc = resolveUrl(card.image);

          return (
            <motion.article
              key={`${card.id || card.title}-${isMobile}`}
              data-reveal="1"
              className={`case${isShort ? ' case--short' : ''}`}
              style={imgSrc ? { backgroundImage: `url("${imgSrc}")` } : undefined}
              role="link"
              tabIndex={0}
              aria-expanded={isMobile ? isOpen : undefined}
              onClick={() => {
                if (isMobile && !isOpen) {
                  setOpenIdx(i);
                } else {
                  openLink(card.href);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isMobile && !isOpen) setOpenIdx(i);
                  else openLink(card.href);
                }
              }}
              initial={still ? false : { opacity: 0, y: 40 }}
              animate={{ height: isOpen ? CASE_OPEN_H : CASE_SHORT_H }}
              whileInView={still ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                opacity: { duration: still ? 0 : 0.8, delay: still ? 0 : i * 0.1, ease: EASE_OUT },
                y: { duration: still ? 0 : 0.8, delay: still ? 0 : i * 0.1, ease: EASE_OUT },
                height: { duration: still ? 0 : 0.65, ease: EASE_OUT },
              }}
              whileHover={!still && !isMobile ? { y: -6 } : undefined}
            >
              {imgSrc && <img src={imgSrc} alt={card.title} loading="lazy" />}
              <div className="case__label">
                {card.tag && (
                  <Reveal as="p" className="case__tag" stagger={0.025}>
                    {card.tag}
                  </Reveal>
                )}
                <Reveal as="p" className="case__title" stagger={0.025}>
                  {card.title}
                </Reveal>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

/* ───────── 3. Statement (oS) ───────── */
function StatementSection() {
  return (
    <section className="section content statement">
      <Reveal as="p" stagger={0.055}>
        моя главная задача — разбор психологии пользователя и создание пути к целям проекта
      </Reveal>
    </section>
  );
}

/* ───────── 4. Branding (mS + DotLottie + links to /design) ───────── */
function BrandingLottie({ still }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const inViewRef = useRef(true);
  const stillRef = useRef(still);

  useEffect(() => {
    stillRef.current = still;
  }, [still]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let io = null;

    DotLottie.setWasmUrl(DOTLOTTIE_WASM);
    const canvas = document.createElement('canvas');
    canvas.className = 'branding__lottie-canvas';
    host.replaceChildren(canvas);

    const player = new DotLottie({
      canvas,
      src: BRANDING_LOTTIE,
      autoplay: false,
      loop: true,
      layout: { fit: 'contain', align: [0.5, 0.5] },
      renderConfig: { autoResize: false, freezeOnOffscreen: true },
    });
    playerRef.current = player;

    const sync = () => {
      if (cancelled) return;
      if (stillRef.current || !inViewRef.current) {
        if (stillRef.current) player.setFrame(0);
        player.pause();
      } else {
        player.play();
      }
    };

    player.addEventListener('load', sync);
    player.addEventListener('ready', sync);

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          inViewRef.current = !!entry?.isIntersecting;
          sync();
        },
        { threshold: 0.05 }
      );
      io.observe(host);
    }

    return () => {
      cancelled = true;
      io?.disconnect();
      playerRef.current?.destroy();
      playerRef.current = null;
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (still) {
      player.setFrame(0);
      player.pause();
    } else if (inViewRef.current) {
      player.play();
    }
  }, [still]);

  return (
    <div
      className="branding__lottie"
      ref={hostRef}
      aria-label="45-секундная анимация брендинга"
      role="img"
    />
  );
}

function BrandingSection() {
  const still = useStillMode();

  return (
    <section className="section" id="branding">
      <div className="branding__layout">
        <div className="branding__head">
          <Reveal as="h2" className="h2" stagger={0.055}>
            Брендинг для бизнес решений
          </Reveal>
          <div className="about__copy">
            <Reveal as="p" delay={0.12} stagger={0.028}>
              <strong>Hello! Меня зовут Виктор. Я – мультидисциплинарный дизайнер</strong>, который
              собирает айдентику и визуальную систему бренда: <strong>фирменный стиль</strong>,
              логотипы, <strong>оформление соцсетей</strong> и мастер-макеты публикаций. Отдельно
              веду продуктовый <strong>дизайн упаковки</strong> и отдельно –{' '}
              <strong>сайты и лендинги</strong>, которые презентуют компанию и продукт. Беру на себя
              как точечные задачи, так и полный визуальный пакет.
            </Reveal>
            <Reveal as="p" delay={0.24} stagger={0.028}>
              Вместе с вами мы доведем вашу идею до “твердого тела”, благодаря которому с помощью
              образов и смыслов начнем новый разговор с вашей аудиторией.
            </Reveal>
            <Reveal as="p" delay={0.36} stagger={0.028}>
              Проектирую решения так, чтобы визуальный код был консистентным, идейно содержательным
              и удобным для развития. На выходе – современная айдентика, которая легко
              масштабируется под разные носители и говорит с аудиторией одним визуальным языком.
            </Reveal>
          </div>
          <DiscussButtons worksPath="/design" />
        </div>
        <div className="branding__media">
          <BrandingLottie still={still} />
        </div>
      </div>
    </section>
  );
}

/* ───────── 5. AI-Продакшн (yS + CMS Gallery + Collapse/Show Toggle) ───────── */
const AI_SLIDE_MS = 5000;

function AiRail({ still, step, total }) {
  return (
    <div className="ai__rail" data-still={still ? 'true' : 'false'} aria-hidden="true">
      {Array.from({ length: total }, (_, idx) => (
        <span
          key={idx}
          className={[
            'ai__rail-bar',
            idx < step ? 'ai__rail-bar--done' : '',
            idx === step ? 'ai__rail-bar--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={idx === step ? { '--ai-fill': '48px' } : undefined}
        />
      ))}
    </div>
  );
}

function AiSection() {
  const still = useStillMode();
  const { cms, resolveUrl } = useCms();
  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState(0);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const slides = cms.home.aiGallery?.length
    ? cms.home.aiGallery
    : [
        {
          id: 'fallback-ai',
          src: './assets/figma/_dc/ai/4893af6008cd5d28b139b3d0f83596252c948806.webp',
          alt: 'AI-Продакшн',
        },
      ];
  const total = slides.length;
  const safeStep = step % total;

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth <= 1000);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    if (still || total <= 1) return;
    const timer = window.setTimeout(() => setStep((s) => (s + 1) % total), AI_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [still, safeStep, total]);

  const move = (delta) => {
    if (total <= 1) return;
    setStep((s) => (s + delta + total) % total);
  };

  const onRailPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isPrev = isMobile
      ? e.clientX - rect.left < rect.width / 2
      : e.clientY - rect.top < rect.height / 2;
    move(isPrev ? -1 : 1);
  };

  const onRailKeyDown = (e) => {
    const prevKey = isMobile ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isMobile ? 'ArrowRight' : 'ArrowDown';
    if (e.key === prevKey) {
      e.preventDefault();
      move(-1);
    } else if (e.key === nextKey) {
      e.preventDefault();
      move(1);
    }
  };

  const railProps = {
    role: 'slider',
    tabIndex: 0,
    'aria-label': 'Прогресс слайдов AI',
    'aria-valuemin': 0,
    'aria-valuemax': Math.max(0, total - 1),
    'aria-valuenow': safeStep,
    onPointerDown: onRailPointerDown,
    onKeyDown: onRailKeyDown,
  };

  return (
    <section className="section" id="ai">
      <div className={`feature feature--ai${panelCollapsed ? ' is-collapsed' : ''}`}>
        <div
          className="ai__slides"
          data-still={still ? 'true' : 'false'}
          data-step={safeStep}
          aria-hidden="true"
        >
          {slides.map((item, idx) => {
            const src = resolveUrl(item.src);
            const isCurrent = idx === safeStep;
            return (
              <img
                key={item.id || idx}
                className="ai__slide"
                src={src}
                alt={item.alt || ''}
                draggable={false}
                style={{
                  opacity: isCurrent ? 1 : 0,
                  zIndex: isCurrent ? 1 : 0,
                }}
              />
            );
          })}
        </div>

        <div className="feature__inner">
          <div className="ai__visual">
            {total > 1 && (
              <div className="ai__rail-wrap" {...railProps}>
                <AiRail still={still} step={safeStep} total={total} />
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {!panelCollapsed && (
              <motion.div
                key="ai-panel"
                className="feature__panel"
                data-reveal="1"
                initial={still ? false : { opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={still ? undefined : { opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: still ? 0 : 0.35, ease: EASE_OUT }}
              >
                <div className="feature__panel-top">
                  <Reveal as="h2" className="h2" stagger={0.05}>
                    AI-Продакшн
                  </Reveal>
                  <button
                    type="button"
                    className="discuss__button ai__toggle-btn"
                    onClick={() => setPanelCollapsed(true)}
                    aria-expanded="true"
                    aria-label="Свернуть описание, чтобы рассмотреть фото"
                    title="Свернуть описание"
                  >
                    <ChatSlashIcon size={20} />
                  </button>
                </div>

                {AI_COPY.map((para, pIdx) => (
                  <Reveal
                    key={pIdx}
                    as="p"
                    className="ai__paragraph"
                    delay={0.14 + pIdx * 0.1}
                    stagger={0.025}
                  >
                    {para.map((seg, sIdx) =>
                      seg.b ? (
                        <strong key={sIdx}>{seg.t}</strong>
                      ) : (
                        <span key={sIdx}>{seg.t}</span>
                      )
                    )}
                  </Reveal>
                ))}

                <DiscussButtons worksPath="/ai" />
              </motion.div>
            )}
          </AnimatePresence>

          {total > 1 && (
            <div className="ai__rail-wrap ai__rail-wrap--mobile" {...railProps}>
              <AiRail still={still} step={safeStep} total={total} />
            </div>
          )}
        </div>

        {/* Floating button to show description again (Chat.svg) */}
        <AnimatePresence>
          {panelCollapsed && (
            <motion.button
              key="ai-expand-btn"
              type="button"
              className="discuss__button ai__toggle-btn ai__toggle-btn--floating is-collapsed"
              onClick={() => setPanelCollapsed(false)}
              aria-expanded="false"
              aria-label="Показать описание AI-Продакшн"
              title="Показать описание"
              initial={still ? false : { opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={still ? undefined : { opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: still ? 0 : 0.25, ease: EASE_OUT }}
            >
              <ChatIcon size={20} />
              <span>описание</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ───────── 6. AR эффекты (xS + BearZero + QR + links to /ar) ───────── */
function ArSection() {
  const still = useStillMode();
  const mediaRef = useRef(null);

  const onPointerMove = (e) => {
    if (still || !mediaRef.current) return;
    const rect = mediaRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mediaRef.current.style.setProperty('--ar-follow-x', `${(nx * 10).toFixed(2)}px`);
    mediaRef.current.style.setProperty('--ar-follow-y', `${(ny * 8).toFixed(2)}px`);
  };

  const onPointerLeave = () => {
    mediaRef.current?.style.setProperty('--ar-follow-x', '0px');
    mediaRef.current?.style.setProperty('--ar-follow-y', '0px');
  };

  return (
    <section className="section" id="ar">
      <div className="feature">
        <div className="feature__inner">
          <div
            className="ar__media"
            ref={mediaRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            <div className="ar__media-img">
              <div className="ar__media-card">
                <img
                  src="./assets/figma/_dc/41327d7c1c823061b4b971c492ca17241a880881.webp"
                  alt="AR-эффект BearZero"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="ar__qr">
              <img
                className="ar__qr-img"
                src="./assets/figma/46a83.svg"
                alt="QR-код AR-эффекта"
              />
              <Reveal as="p" className="ar__qr-copy ar__qr-copy--desktop" stagger={0.03}>
                Отсканируйте
                <br />
                QR-код на телефоне
                <br />
                <br />
                AR в браузере
              </Reveal>
              <Reveal as="p" className="ar__qr-copy ar__qr-copy--mobile" stagger={0.03}>
                откройте эту страницу
                <br /> на компьютере
                <br />и Отсканируйте
                <br />
                QR-код на телефоне
              </Reveal>
            </div>
          </div>

          <div className="feature__copy">
            <Reveal as="h2" className="h2" stagger={0.05}>
              AR эффекты
            </Reveal>
            {AR_COPY.map((para, pIdx) => (
              <Reveal
                key={pIdx}
                as="p"
                className="ar__paragraph"
                delay={0.18 + pIdx * 0.12}
                stagger={0.028}
              >
                {para.map((seg, sIdx) =>
                  seg.b ? (
                    <strong key={sIdx}>{seg.t}</strong>
                  ) : (
                    <span key={sIdx}>{seg.t}</span>
                  )
                )}
              </Reveal>
            ))}
            <DiscussButtons worksPath="/ar" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── 7. Обо мне (CS + 12 tools) ───────── */
const SIDE_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: -18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};
const ROW_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

function ToolRow({ items }) {
  return (
    <motion.div className="tools__row" variants={ROW_VARIANTS}>
      {items.map((tool) => {
        const extra = tool.src.includes('dbbfc')
          ? ' tool--ps'
          : tool.src.includes('5bcd8')
            ? ' tool--figma'
            : '';
        return (
          <motion.div className={`tool${extra}`} variants={ITEM_VARIANTS} tabIndex={0} key={tool.src}>
            <span className="tool__media">
              <img src={tool.src} alt={tool.alt} loading="lazy" />
            </span>
            <span className="tool__tip" role="tooltip">
              {tool.alt}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function AboutSection() {
  const still = useStillMode();

  return (
    <section className="section content" id="about">
      <div className="about">
        <div className="about__copy">
          <Reveal as="h2" className="h2" stagger={0.05}>
            обо мне
          </Reveal>
          <Reveal as="p" delay={0.12} stagger={0.022}>
            <strong>Мультидиcциплинарный дизайнер с практичным мышлением.</strong> За плечами
            художественная школа + высшее по художественной и промышленной технологии обработки
            материалов – создаю дизайн, который не просто красив, а технически грамотен и работает
            на результат.
          </Reveal>
          <Reveal as="p" delay={0.24} stagger={0.045}>
            <strong>Что делаю:</strong>
          </Reveal>
          <Reveal as="p" delay={0.36} stagger={0.022}>
            – Визуальное оформление – карточки, баннеры, обложки, контент
            <br />– Полиграфия и айдентика – от визиток до упаковки, с учётом допечатной подготовки
            <br />– Инфографика для маркетплейсов, соцсетей и презентаций
            <br />– Графический дизайн любой сложности – графические редакторы на продвинутом уровне
            <br />– 3D-визуализация в Blender и AR-проекты – когда задаче нужен объём и интерактив
          </Reveal>
          <Reveal as="p" delay={0.48} stagger={0.045}>
            <strong>Почему я:</strong>
          </Reveal>
          <Reveal as="p" delay={0.6} stagger={0.022}>
            – Понимаю, как дизайн будет жить в реальности → минимум правок
            <br />– Внедряю нейросети → быстрее и дешевле для вас
            <br />– Я закрываю задачи, на которые обычно нужно несколько специалистов
            <br />– Не пропадаю, слышу задачу, довожу до конца
          </Reveal>
          <Reveal as="p" delay={0.72} stagger={0.03}>
            <strong>Напишите – обсудим, что нужно сделать, и подберу лучшее решение</strong>
          </Reveal>
        </div>

        <motion.aside
          className="about__side"
          data-reveal="1"
          initial={still ? false : 'hidden'}
          animate={still ? 'show' : undefined}
          whileInView={still ? undefined : 'show'}
          viewport={{ once: true, margin: '-60px' }}
          variants={SIDE_VARIANTS}
        >
          <motion.div className="about__person" variants={ITEM_VARIANTS}>
            <motion.div className="about__avatar" variants={ITEM_VARIANTS}>
              <img src="./assets/figma/06a14.png" alt="Виктор Власов" loading="lazy" />
            </motion.div>
            <motion.div className="about__name" variants={ROW_VARIANTS}>
              <Reveal as="strong" stagger={0.06}>
                <span>Виктор</span>
                <span>Власов</span>
              </Reveal>
              <Reveal as="span" className="about__age" stagger={0.06}>
                26 лет
              </Reveal>
            </motion.div>
          </motion.div>

          <motion.div variants={ITEM_VARIANTS}>
            <Reveal as="h3" className="about__tools-title" stagger={0.05}>
              инструментарий
            </Reveal>
          </motion.div>

          <motion.div className="tools" variants={ROW_VARIANTS}>
            <motion.div className="tools__group" variants={ROW_VARIANTS}>
              <ToolRow items={TOOLS.graphic} />
              <motion.div variants={ITEM_VARIANTS}>
                <Reveal as="p" className="tools__caption" stagger={0.06}>
                  Графика
                </Reveal>
              </motion.div>
            </motion.div>

            <motion.div className="tools__group tools__group--split" variants={ROW_VARIANTS}>
              <motion.div className="tools__sub tools__sub--video" variants={ROW_VARIANTS}>
                <ToolRow items={[TOOLS.video]} />
                <motion.div variants={ITEM_VARIANTS}>
                  <Reveal as="p" className="tools__caption" stagger={0.06}>
                    Видео
                  </Reveal>
                </motion.div>
              </motion.div>

              <motion.div className="tools__sub tools__sub--ar" variants={ROW_VARIANTS}>
                <ToolRow items={TOOLS.ar} />
                <motion.div variants={ITEM_VARIANTS}>
                  <Reveal as="p" className="tools__caption" stagger={0.06}>
                    AR эффекты
                  </Reveal>
                </motion.div>
              </motion.div>

              <motion.div className="tools__sub" variants={ROW_VARIANTS}>
                <ToolRow items={[TOOLS.three]} />
                <motion.div variants={ITEM_VARIANTS}>
                  <Reveal as="p" className="tools__caption" stagger={0.06}>
                    3D
                  </Reveal>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div className="tools__group" variants={ROW_VARIANTS}>
              <ToolRow items={TOOLS.neural} />
              <motion.div variants={ITEM_VARIANTS}>
                <Reveal as="p" className="tools__caption" stagger={0.06}>
                  Нейросети
                </Reveal>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.aside>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="after-hero">
        <TodaySection />
        <StatementSection />
        <BrandingSection />
        <AiSection />
        <ArSection />
        <AboutSection />
        <RequestBuilder defaultTopic="Графика" />
      </div>
    </>
  );
}
