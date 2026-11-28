import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useCms } from '../data/CmsContext';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { useSubHeroMotion } from '../hooks/useSubHeroMotion';
import { GAME_URL } from '../gameWarmup';
import { Lightbox } from '../components/Lightbox';
import { PinnedSteps } from '../components/PinnedSteps';
import { RequestBuilder } from '../components/RequestBuilder';
import { EASE_OUT, Reveal } from '../components/Reveal';
import { VideoCarousel } from '../components/VideoCarousel';

const AR_CHIPS = [
  'face-tracking',
  'try-on',
  'digital MUA',
  'target-tracking',
  '3D-моделирование',
  'анимация',
  'TikTok / Snapchat',
  'phygital',
];

const CLIENTS = [
  { name: 'Mobile Legends', src: './assets/clients/mobile-legends.png' },
  { name: 'OSCARxFRANK', src: './assets/clients/oscarxfrank.png' },
  { name: 'H&M Beauty', src: './assets/clients/hm-beauty.png' },
  { name: 'SLA Paris', src: './assets/clients/sla.png' },
  { name: 'Glamnetic', src: './assets/clients/glamnetic.png' },
];

const AR_APPLICATIONS = [
  {
    number: '01',
    title: 'Виртуальная примерка',
    text: 'Покупатели могут примерить очки, аксессуары или косметику через камеру до покупки. Это помогает оценить товар на себе и принять более уверенное решение.',
    img: './assets/ar/business-tryon.jpg',
  },
  {
    number: '02',
    title: 'Продвижение бренда в соцсетях',
    text: 'Интерактивные эффекты вовлекают аудиторию в кампанию и дают пользователям повод создавать собственный контент с элементами бренда. Это помогает расширять охват и повышать узнаваемость.',
    img: './assets/ar/business-social.jpg',
  },
  {
    number: '03',
    title: 'Интерактивная упаковка и рекламные материалы',
    text: 'AR добавляет цифровой контент к упаковке, плакатам и другим носителям: например, демонстрацию продукта, анимацию или дополнительную информацию. Компания получает новый способ взаимодействовать с клиентом после контакта с физическим объектом.',
    img: './assets/ar/business-packaging.jpg',
  },
  {
    number: '04',
    title: 'Демонстрация продуктов и пространств',
    text: 'AR позволяет показать продукт в окружении пользователя или представить его особенности в интерактивном формате. Это помогает компании объяснить преимущества предложения и поддержать процесс выбора.',
    img: './assets/ar/business-product.jpg',
  },
];

const AR_PIPELINE = [
  {
    n: '01',
    title: 'Бриф и механика',
    text: 'Определяем цель, платформу и сценарий: что пользователь делает и что получает.',
  },
  {
    n: '02',
    title: '3D и дизайн',
    text: 'Готовлю модели и текстуры в Blender, рисую интерфейсные элементы и визуальный стиль.',
  },
  {
    n: '03',
    title: 'Сборка и тесты',
    text: 'Собираю эффект для Snapchat, TikTok или WebAR и проверяю его работу на реальных устройствах.',
  },
  {
    n: '04',
    title: 'Публикация',
    text: 'Оформляю файлы по требованиям площадки, помогаю пройти модерацию и запуститься.',
  },
];

export function ArPage() {
  const still = useStillMode();
  const { cms } = useCms();
  const { t } = useI18n();
  const [lightboxItem, setLightboxItem] = useState(null);
  const frameRef = useRef(null);

  // Browsers keep an AudioContext suspended until the page has seen a real user
  // gesture. The game is autoloaded (no click required), so without this the
  // engine boots with a suspended context and stays silent until the visitor
  // happens to tap the canvas. Forward the first gesture into the iframe and
  // resume the context the engine already created.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    let done = false;
    const resumeInFrame = () => {
      try {
        const win = frame.contentWindow;
        if (!win) return;
        // The engine mirrors its own unlock logic on the iframe window.
        if (typeof win.__unlockAudio === 'function') {
          win.__unlockAudio();
          done = true;
          return;
        }
        const ctx = win.__actx;
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
        if (ctx) done = true;
      } catch {
        // cross-origin / not ready yet: try again on the next gesture
      }
    };

    const onGesture = () => {
      resumeInFrame();
      if (done) {
        window.removeEventListener('pointerdown', onGesture, true);
        window.removeEventListener('keydown', onGesture, true);
        window.removeEventListener('touchstart', onGesture, true);
      }
    };

    window.addEventListener('pointerdown', onGesture, true);
    window.addEventListener('keydown', onGesture, true);
    window.addEventListener('touchstart', onGesture, true);
    // The engine may also be ready long after the first gesture.
    const poll = window.setInterval(resumeInFrame, 1500);

    return () => {
      window.removeEventListener('pointerdown', onGesture, true);
      window.removeEventListener('keydown', onGesture, true);
      window.removeEventListener('touchstart', onGesture, true);
      window.clearInterval(poll);
    };
  }, []);
  const heroRef = useSubHeroMotion();

  const marqueeSet = [...CLIENTS, ...CLIENTS, ...CLIENTS, ...CLIENTS];

  return (
    <div className="subpage subpage--ar">
      {/* 0. Игра-герой: во всю ширину страницы, 720px, верхнее меню поверх.
             Игра грузится сама, без кнопки: на этой странице — сразу, на остальных
             — в фоне, когда сайт уже прогрузился (см. useGameWarmup в App.jsx). */}
      <section className="ar-game-hero" aria-label="Живая web-игра">
        <iframe
          ref={frameRef}
          src={GAME_URL}
          title="Kotik Sakura Run — web-игра"
          className="ar-game-hero__frame"
          allow="autoplay; fullscreen; gamepad"
        />
      </section>

      {/* 1. Hero section + 9:16 Video Carousel + Glass bio + ×3 scroll bg zoom */}
      <section className="sub-hero sub-hero--ar" ref={heroRef} data-hero>
        <div
          className="sub-hero__bg"
          data-bg
          aria-hidden="true"
          style={{ backgroundImage: 'url(./assets/bg/bg_ar.svg)' }}
        />

        <div className="content sub-hero__inner">
          <Reveal as="h1" className="sub-hero__title" immediate delay={0.08} stagger={0.055}>
            {t('AR-эффекты в соцсетях')}
          </Reveal>
          <Reveal as="p" className="sub-hero__tagline" immediate delay={0.16}>
            {t('Это вам не игрушка! А инструмент вовлечения аудитории в ваш продукт.')}
          </Reveal>
        </div>

        <VideoCarousel items={cms.ar.videos} />

        <div className="content">
          <motion.div
            className="sub-aboutglass"
            initial={still ? false : { opacity: 0, y: 20 }}
            animate={still ? { opacity: 1, y: 0 } : undefined}
            whileInView={still ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <div className="sub-aboutglass__text">
              <p>
                {t(
                  'Создаю цифровую эстетику с технологическим бэкграундом. Специализируюсь на разработке AR-эффектов, которые объединяют дополненную реальность и физический продукт в единый покупательский опыт.'
                )}
              </p>
              <p>
                {t(
                  'Проектирую всё: от высокоточных виртуальных примерок (Try-on) до сложных 3D-аватаров и Digital MUA. Мои решения помогают брендам выделяться в ленте и выстраивать глубокую эмоциональную связь с аудиторией.'
                )}
              </p>
            </div>
            <div className="sub-aboutglass__chips">
              <span className="sub-eyebrow">{t('Перечень выполняемых работ')}</span>
              <div className="sub-chips">
                {AR_CHIPS.map((chip) => (
                  <span className="tag" key={chip}>
                    {t(chip)}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Clients Marquee */}
      <section className="sub-section sub-clients" aria-label={t('Клиенты')}>
        <div className="content">
          <span className="sub-eyebrow">{t('Клиенты')}</span>
        </div>
        <div className="sub-clients__marquee">
          <div className={`sub-clients__track${still ? ' is-still' : ''}`}>
            {marqueeSet.map((client, i) => (
              <div className="sub-clients__item" key={`${client.name}-${i}`}>
                <img
                  src={client.src}
                  alt={client.name}
                  className={client.inv ? 'is-inv' : undefined}
                  height={64}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 4 Main AR Applications */}
      <PinnedSteps
        title="4 основных применения AR для бизнеса"
        subtitle="От виртуальной примерки до оживающей упаковки — AR решает реальные маркетинговые задачи."
        steps={AR_APPLICATIONS}
        onImageClick={setLightboxItem}
      />

      {/* 4. 4-Card Pipeline */}
      <section className="sub-section content sub-pipe">
        <div className="sub-section__head">
          <span className="sub-eyebrow">{t('Пайплайн')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('От брифа до публикации')}
          </Reveal>
        </div>

        <div className="sub-pipe__grid">
          {AR_PIPELINE.map((step, i) => (
            <motion.article
              key={step.n}
              className="sub-pipe__card"
              initial={still ? false : { opacity: 0, y: 20 }}
              animate={still ? { opacity: 1, y: 0 } : undefined}
              whileInView={still ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE_OUT }}
            >
              <span className="sub-pipe__num">{step.n}</span>
              <h3 className="sub-pipe__title">{t(step.title)}</h3>
              <p className="sub-pipe__text">{t(step.text)}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* 5. v2 Request Builder */}
      <RequestBuilder defaultTopic="AR-Эффект" />

      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  );
}
