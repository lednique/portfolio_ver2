import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useCms } from '../data/CmsContext';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { FlowCarousel } from '../components/FlowCarousel';
import { InvitationShowcase } from '../components/InvitationShowcase';
import { Lightbox } from '../components/Lightbox';
import { RequestBuilder } from '../components/RequestBuilder';
import { EASE_OUT, Reveal } from '../components/Reveal';

const DESIGN_CHIPS = [
  'айдентика',
  'ui/ux',
  'макетирование / создание сайтов',
  'мастер-макеты',
  'базовый motion',
  'препресс',
  'презентации',
  'соцсети',
  'инфографика',
  'баннеры',
  'листовки',
  'полиграфия',
];

const BEHANCE_CASES = [
  {
    id: '257802213',
    title: 'Game UI Design – Noirie',
    embedUrl: 'https://www.behance.net/embed/project/257802213?ilo0=1',
    url: 'https://www.behance.net/gallery/257802213/Game-UI-Design-Noirie',
  },
  {
    id: '255985065',
    title: 'Aurora Brew App Concept',
    embedUrl: 'https://www.behance.net/embed/project/255985065?ilo0=1',
    url: 'https://www.behance.net/gallery/255985065/Aurora-Brew-App-Concept',
  },
  {
    id: '256638775',
    title: 'Company rebranding – BKA Vertical',
    embedUrl: 'https://www.behance.net/embed/project/256638775?ilo0=1',
    url: 'https://www.behance.net/gallery/256638775/Company-rebranding-BKA-Vertical',
  },
];

export function DesignPage() {
  const still = useStillMode();
  const { cms } = useCms();
  const { t } = useI18n();
  const [lightboxItem, setLightboxItem] = useState(null);
  const heroRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (still) return;
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      setParallax({ x: nx, y: ny });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [still]);

  const scrollToForm = (e) => {
    e.preventDefault();
    document.getElementById('request')?.scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
  };

  return (
    <div className="subpage subpage--design">
      {/* 1. Hero section */}
      <section className="sub-hero sub-hero--design" ref={heroRef}>
        <div
          className="sub-hero__bg"
          aria-hidden="true"
          style={{ backgroundImage: 'url(./assets/bg/bg_design.svg)' }}
        />
        <div className="sub-hero__fishes-bg" aria-hidden="true">
          <img src="./assets/bg/design_fishes.svg" alt="" />
        </div>

        <div className="content sub-hero__inner">
          <Reveal as="h1" className="sub-hero__title" immediate delay={0.08} stagger={0.055}>
            {t('Графический дизайн')}
          </Reveal>

          <motion.div
            className="sub-hero__visual sub-hero__visual--design"
            initial={still ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.16, ease: EASE_OUT }}
          >
            <button
              type="button"
              className="sub-hero__img-btn"
              onClick={() =>
                setLightboxItem({
                  src: './assets/gfx/design-hero.jpg',
                  alt: t('Графический дизайн — LEDNIQUE'),
                })
              }
              aria-label={t('Открыть превью графического дизайна')}
            >
              <img
                src="./assets/gfx/design-hero.jpg"
                alt={t('Графический дизайн')}
                width={1400}
                height={736}
              />
            </button>

            {!still && (
              <div className="sub-hero__fish-layer" aria-hidden="true">
                <div
                  className="pfish pfish--1"
                  style={{
                    transform: `translate3d(${(parallax.x * -18).toFixed(1)}px, ${(
                      parallax.y * -14
                    ).toFixed(1)}px, 0)`,
                  }}
                >
                  <img src="./assets/fish/group1.svg" alt="" />
                </div>
                <div
                  className="pfish pfish--2"
                  style={{
                    transform: `translate3d(${(parallax.x * 12).toFixed(1)}px, ${(
                      parallax.y * 10
                    ).toFixed(1)}px, 0)`,
                  }}
                >
                  <img src="./assets/fish/group2.svg" alt="" />
                </div>
                <div
                  className="pfish pfish--3"
                  style={{
                    transform: `translate3d(${(parallax.x * -24).toFixed(1)}px, ${(
                      parallax.y * 16
                    ).toFixed(1)}px, 0)`,
                  }}
                >
                  <img src="./assets/fish/group3.svg" alt="" />
                </div>
              </div>
            )}
          </motion.div>

          <Reveal as="p" className="sub-hero__lines" delay={0.22}>
            {t('Рафтингую между софтом Адобе, Figma и Нано Бананами более 12 лет.')}
            <br />
            {t('Играюсь с шрифтами и кривыми Безье.')}
            <br />
            {t('В водовороты из слов не попадаю, к буйкам не подплываю.')}
            <br />
            {t('Не молчу, помню о вашей задаче больше 5 секунд.')}
            <br />
            {t('Кстати, рафтингую между софтом Адобе, Figma и Нано Бананами более 12 лет..')}
          </Reveal>

          <div className="sub-hero__meta">
            <div className="sub-hero__meta-chips">
              <span className="sub-eyebrow">{t('Перечень выполняемых работ')}</span>
              <div className="sub-chips">
                {DESIGN_CHIPS.map((chip) => (
                  <span className="tag" key={chip}>
                    {t(chip)}
                  </span>
                ))}
              </div>
            </div>
            <div className="sub-kv">
              <div className="sub-kv__item">
                <span>{t('Срок')}</span>
                <b>{t('от 3 до 5 дней / задача')}</b>
              </div>
              <div className="sub-kv__item">
                <span>{t('Формат')}</span>
                <b>{t('удаленно')}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Fishblock — "Дизайн не стухнет" */}
      <section className="sub-section content sub-fishblock">
        <div className="sub-fishblock__card">
          <img
            className="sub-fishblock__fish"
            src="./assets/fish/group4.svg"
            alt=""
            aria-hidden="true"
          />
          <div className="sub-narrow">
            <span className="sub-eyebrow">{t('Почему это работает')}</span>
            <Reveal as="h2" className="sub-heading">
              {t('Дизайн не стухнет')}
            </Reveal>
            <Reveal as="p" className="sub-lead" delay={0.08}>
              {t(
                'Каждый проект начинается с глубокого погружения: я анализирую контекст, изучаю актуальные направления в дизайне и собираю референсы, чтобы выстроить чёткую визуальную стратегию ещё до первого эскиза. Я не работаю в режиме «скажите – сделаю». Вместо этого предлагаю обоснованные решения, опираясь на психологию восприятия и механику внимания, и готов отстаивать свою позицию, подкрепляя её логикой и фактами.'
              )}
            </Reveal>
            <div className="sub-cta-row">
              <a
                className="v2-pill-btn v2-pill-btn--lime"
                href="#request"
                onClick={scrollToForm}
              >
                {t('Обсудить проект')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Case 01 — BKA Vertical */}
      <section className="sub-section content sub-case">
        <div className="sub-section__head">
          <span className="sub-eyebrow">{t('Кейс 01')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('Крайняя работа')}
          </Reveal>
        </div>

        <motion.button
          type="button"
          className="sub-bigcase"
          onClick={() =>
            setLightboxItem({
              src: './assets/gfx/roll.jpg',
              alt: t('Кейс BKA Vertical – превью'),
              caption: t('Company rebranding — BKA Vertical (полный разбор)'),
            })
          }
          initial={still ? false : { opacity: 0, y: 20 }}
          animate={still ? { opacity: 1, y: 0 } : undefined}
          whileInView={still ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          aria-label={t('Открыть превью кейса BKA Vertical')}
        >
          <img
            src="./assets/gfx/bka-banner.jpg"
            alt="Company rebranding – BKA Vertical"
            loading="lazy"
          />
          <span className="sub-bigcase__hint">{t('Открыть кейс целиком ↗')}</span>
        </motion.button>
      </section>

      {/* 4. Behance Cases */}
      <section className="sub-section content sub-behance">
        <div className="sub-section__head sub-section__head--center">
          <span className="sub-eyebrow">{t('Подписывайтесь!')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('Кейсы на Behance')}
          </Reveal>
        </div>

        <div className="sub-beh__grid">
          {BEHANCE_CASES.map((item, i) => (
            <motion.div
              key={item.id}
              className="sub-beh__card"
              initial={still ? false : { opacity: 0, y: 20 }}
              animate={still ? { opacity: 1, y: 0 } : undefined}
              whileInView={still ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE_OUT }}
            >
              <div className="sub-beh__frame">
                <iframe
                  src={item.embedUrl}
                  allowFullScreen
                  loading="lazy"
                  frameBorder="0"
                  allow="clipboard-write"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title={item.title}
                />
              </div>
              <div className="sub-beh__foot">
                <span>{item.title}</span>
                <a href={item.url} target="_blank" rel="noreferrer noopener">
                  Behance ↗
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Identity Gallery */}
      <section className="sub-section sub-section--accent">
        <div className="content sub-narrow">
          <span className="sub-eyebrow">{t('Почему это работает')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('Айдентика')}
          </Reveal>
          <Reveal as="p" className="sub-lead" delay={0.08}>
            {t(
              'Работа над айдентикой бренда – это превращение абстрактных ценностей компании в мгновенно считываемый визуальный язык, который формирует доверие, отстраивает вас от конкурентов и создаёт устойчивую эмоциональную привязанность у аудитории. Решения, которые я закладываю в этот процесс, лежат значительно глубже эстетики: это осознанный выбор архетипа и характера бренда, стратегическое выстраивание цветовой и типографической системы, разработка гибких композиционных принципов, остающихся консистентными на любом носителе, – иными словами, это не только о картинке на логотипе, а целостная знаковая система, способная транслировать одну и ту же идею в жизни бренда.'
            )}
          </Reveal>
        </div>

        <FlowCarousel
          items={cms.design.identityGallery}
          variant="portrait"
          ariaLabel="Галерея айдентики"
          onSelect={setLightboxItem}
        />
      </section>

      {/* 6. Infographic Gallery */}
      <section className="sub-section">
        <div className="content sub-narrow">
          <span className="sub-eyebrow">{t('Маркетплейсы / карточки товара')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('Инфографика')}
          </Reveal>
          <Reveal as="p" className="sub-lead" delay={0.08}>
            {t(
              'Я работаю как внутри готовых гайдлайнов и брендбуков, так и с нуля – создавая уникальный визуальный код, который легко разворачивается в полноценный фирменный стиль и позволяет мгновенно отличить ваш бренд от конкурентов. Анализ рынка я провожу не для копирования чужих решений, а для усиления вашего УТП – отвечая на вопросы покупателя ещё до того, как он нажмёт «заказать». Радикален в прозрачности: показываю товар коммерчески выигрышно, но без искажений в материалах и посадке, тем самым помогая бренду выстраивать доверие и оптимизировать логистику. Карточка – это лицо товара на витрине маркетплейса. Пользователь решает за две секунды, пролистнуть дальше или остановиться, – и моя задача – выиграть это решение для вас.'
            )}
          </Reveal>
        </div>

        <FlowCarousel
          items={cms.design.infographicGallery}
          variant="portrait"
          ariaLabel="Галерея инфографики"
          onSelect={setLightboxItem}
        />
      </section>

      {/* 7. Interactive 3D Invitation Showcase */}
      <section className="sub-section content" id="invitations">
        <div className="sub-narrow">
          <span className="sub-eyebrow">{t('Цифровые и печатные форматы')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('Пригласительные и визитки')}
          </Reveal>
          <Reveal as="p" className="sub-lead" delay={0.08}>
            {t(
              'Приглашение или визитка – это первое знакомство с событием или брендом. Я создаю дизайны, которые передают характер проекта и помогают запомнить его с первого взгляда: от печатных материалов до интерактивных цифровых решений. Продумываю не только визуальный стиль, но и сценарий взаимодействия, чтобы важная информация была понятной, а впечатление – цельным.'
            )}
          </Reveal>
        </div>

        <InvitationShowcase />
      </section>

      {/* 8. v2 Request Builder */}
      <RequestBuilder defaultTopic="Графика" />

      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  );
}
