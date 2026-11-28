import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCms } from '../data/CmsContext';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { useSubHeroMotion } from '../hooks/useSubHeroMotion';
import { FlowCarousel } from '../components/FlowCarousel';
import { Lightbox } from '../components/Lightbox';
import { PinnedSteps } from '../components/PinnedSteps';
import { RequestBuilder } from '../components/RequestBuilder';
import { EASE_OUT, Reveal } from '../components/Reveal';

const AI_CHIPS = [
  'нейрофотосессии',
  'AI-видео',
  'цифровая ретушь',
  'замена фона и реквизит',
  'подбор креативов и референсов',
  'создание AI моделей для бизнеса',
  'креативы под тест',
];

const USE_CASE_CHIPS = [
  'карточки маркетплейсов',
  'рекламные креативы',
  'сезонные кампании',
  'тесты до съёмки',
  'наполнение каталога',
  'соцсети',
  'превью коллекции',
];

const AI_ADVANTAGES = [
  {
    number: '01',
    title: 'Мех и ворс',
    text: 'Для передачи меховых текстур я анализирую структуру и направление ворса, плотность изделия, его посадку и узор. На основе этих деталей создаю цифровую реплику, которая сохраняет узнаваемые особенности оригинала. Подбираю модель, соответствующую целевой аудитории, чтобы покупателю было проще представить изделие на себе.',
    img: './assets/ai/ph-12.webp',
  },
  {
    number: '02',
    title: 'Прозрачный пластик и стекло',
    text: 'Изучаю форму, прозрачность и особенности поверхности предмета, затем подбираю освещение и окружение, которые помогают передать его объём и материал. Так изображение сохраняет характер продукта и позволяет покупателю рассмотреть важные детали.',
    img: './assets/ai/ph-07.webp',
  },
  {
    number: '03',
    title: 'Текстиль и кожа',
    text: 'Анализирую плотность материала, швы, складки и посадку изделия, а также подбираю модель под целевую аудиторию. Это помогает показать вещь реалистично и дать покупателю более точное представление о том, как она выглядит на человеке.',
    img: './assets/ai/ph-08.webp',
  },
  {
    number: '04',
    title: 'Свет, тени и отражения',
    text: 'Выстраиваю освещение с учётом формы предмета, его материала и окружения. Проверяю согласованность теней и отражений, чтобы товар выглядел естественно, а изображение воспринималось как качественная коммерческая съёмка.',
    img: './assets/ai/ph-04.webp',
  },
];

export function AiPage() {
  const still = useStillMode();
  const { cms } = useCms();
  const { t } = useI18n();
  const [lightboxItem, setLightboxItem] = useState(null);
  const heroRef = useSubHeroMotion();

  const scrollToForm = (e) => {
    e.preventDefault();
    document.getElementById('request')?.scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
  };

  return (
    <div className="subpage subpage--ai">
      {/* 1. Hero section + wide carousel + ×3 scroll bg zoom */}
      <section className="sub-hero sub-hero--ai" ref={heroRef} data-hero>
        <div
          className="sub-hero__bg"
          data-bg
          aria-hidden="true"
          style={{ backgroundImage: 'url(./assets/bg/bg_ai.svg)' }}
        />

        <div className="content sub-hero__inner">
          <Reveal as="h1" className="sub-hero__title" immediate delay={0.08} stagger={0.055}>
            {t('AI-продакшн фото и видео')}
          </Reveal>
        </div>

        <FlowCarousel
          items={cms.ai.heroGallery}
          variant="wide"
          ariaLabel="Лучшие работы AI-продакшн"
        />

        <div className="content">
          <div className="sub-hero__meta">
            <div className="sub-hero__meta-chips">
              <span className="sub-eyebrow">{t('Перечень выполняемых работ')}</span>
              <div className="sub-chips">
                {AI_CHIPS.map((chip) => (
                  <span className="tag" key={chip}>
                    {t(chip)}
                  </span>
                ))}
              </div>
            </div>
            <div className="sub-kv">
              <div className="sub-kv__item">
                <span>{t('Сроки')}</span>
                <b>{t('от 1 дня')}</b>
              </div>
              <div className="sub-kv__item">
                <span>{t('Формат')}</span>
                <b>{t('без съёмочного дня и студии')}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Story block — plain open section matching original */}
      <section className="sub-section content">
        <div className="sub-narrow">
          <span className="sub-eyebrow">{t('Почему это работает')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('Съёмка без съёмочного дня')}
          </Reveal>
          <Reveal as="p" className="sub-lead" delay={0.08}>
            {t(
              'Обычная предметная съёмка – это студия, свет, фотограф, модель, реквизит, день работы и бюджет, который надо согласовать. И в лучшем случае получится пять кадров, из которых будет утверждено два.'
            )}
          </Reveal>
          <Reveal as="p" className="sub-lead" delay={0.14}>
            {t('Нейрофотосессия даёт')}{' '}
            <b>{t('десятки сцен в разных локациях и с разным светом за сутки')}</b>{' '}
            {t(
              '– и вы выбираете из готового, а не из того, что успели снять. При этом товар остаётся собой: силуэт, цвет, фактура и детали не «додумываются» нейросетью, потому что я контролирую материал на каждом шаге.'
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
      </section>

      {/* 3. Product Neuro-Photoshoots */}
      <section className="sub-section sub-section--accent">
        <div className="content sub-narrow">
          <span className="sub-eyebrow">{t('Почему это работает')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('Нейрофотосессии товаров')}
          </Reveal>
          <Reveal as="p" className="sub-lead" delay={0.08}>
            {t(
              'Работаю в разных товарных категориях – от предметов интерьера и одежды до детских игрушек и инструментов. Под каждый кейс продумываю концепцию, которая передаст характеристики товара близкие к реальному продукту. Придирчив к материалу: мех, прозрачный пластик, мягкий ворс, стекло, металл.'
            )}
          </Reveal>
        </div>

        <FlowCarousel
          items={cms.ai.productGallery}
          variant="card"
          ariaLabel="Нейрофотосессии товаров"
        />
      </section>

      {/* 4. Model Neuro-Photoshoots */}
      <section className="sub-section">
        <div className="content sub-narrow">
          <span className="sub-eyebrow">{t('Почему это работает')}</span>
          <Reveal as="h2" className="sub-heading">
            {t('Нейрофотосессии модели')}
          </Reveal>
          <Reveal as="p" className="sub-lead" delay={0.08}>
            {t(
              'Подбираю AI-модель под ваш бренд: типаж, возраст, образ и манеру позировать – так, чтобы она говорила с вашей аудиторией. Одежда садится по фигуре и тянется там, где должна, а один и тот же персонаж проходит через десятки локаций, ракурсов и настроений – от студийного каталога до уличного лукбука. Без кастинга, агентства и съёмочной группы.'
            )}
          </Reveal>
        </div>

        <FlowCarousel
          items={cms.ai.modelGallery}
          variant="photo"
          ariaLabel="Нейрофотосессии модели"
        />
      </section>

      {/* 5. 4-Step Pinned Advantages */}
      <PinnedSteps
        title="Преимущества моих работ"
        subtitle="Сгенерированные изображения низкого качества часто содержат артефакты и мелкие ошибки: искажённые детали, неестественные фактуры или неверную посадку. Поэтому я проверяю изображение на каждом этапе и уделяю внимание деталям, которые влияют на доверие покупателя."
        steps={AI_ADVANTAGES}
        onImageClick={setLightboxItem}
      />

      {/* 6. Comparison + Use-case chips */}
      <section className="sub-section content sub-compare">
        <div className="sub-cmp__grid">
          <motion.article
            className="sub-cmp__card"
            initial={still ? false : { opacity: 0, y: 20 }}
            animate={still ? { opacity: 1, y: 0 } : undefined}
            whileInView={still ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <span className="sub-eyebrow">{t('Классическая съёмка')}</span>
            <h3 className="sub-cmp__title">{t('Неделю на все процессы, студия, бюджет')}</h3>
            <p className="sub-cmp__body">
              {t(
                'Свет, фотограф, модель, реквизит. 5–10 кадров, из них в работу идут 2–3. Срок – неделя и больше. Переснять «в другом настроении» – снова день и снова бюджет.'
              )}
            </p>
          </motion.article>

          <motion.article
            className="sub-cmp__card sub-cmp__card--lime"
            initial={still ? false : { opacity: 0, y: 20 }}
            animate={still ? { opacity: 1, y: 0 } : undefined}
            whileInView={still ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
          >
            <span className="sub-eyebrow">{t('Нейрофотосессия')}</span>
            <h3 className="sub-cmp__title">{t('Сутки, десятки сцен')}</h3>
            <p className="sub-cmp__body">
              {t(
                'Разные локации, свет и настроения из одного набора исходников товара. Вы выбираете из готового. Правки – не пересъёмка, а корректировка. Дешевле в разы при том же уровне контроля.'
              )}
            </p>
          </motion.article>
        </div>

        <div className="sub-tools">
          <span className="sub-eyebrow">{t('Для чего подходит')}</span>
          <div className="sub-chips">
            {USE_CASE_CHIPS.map((chip) => (
              <span className="tag" key={chip}>
                {t(chip)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 7. v2 Request Builder */}
      <RequestBuilder defaultTopic="AI-Продакшн" />

      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  );
}
