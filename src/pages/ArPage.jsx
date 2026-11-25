import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCms } from '../data/CmsContext';
import { useStillMode } from '../hooks/useA11y';
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
  { name: 'Mobile Legends', src: './assets/clients/mobile-legends.png', inv: false },
  { name: 'OSCARxFRANK', src: './assets/clients/oscarxfrank.png', inv: true },
  { name: 'H&M Beauty', src: './assets/clients/hm-beauty.png', inv: false },
  { name: 'SLA Paris', src: './assets/clients/sla.png', inv: false },
  { name: 'Glamnetic', src: './assets/clients/glamnetic.png', inv: false },
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
  const [lightboxItem, setLightboxItem] = useState(null);

  const marqueeSet = [...CLIENTS, ...CLIENTS, ...CLIENTS, ...CLIENTS];

  return (
    <div className="subpage subpage--ar">
      {/* 1. Hero section + 9:16 Video Carousel (CMS-managed via Admin Tab 3) + Glass bio */}
      <section className="sub-hero sub-hero--ar">
        <div
          className="sub-hero__bg"
          aria-hidden="true"
          style={{ backgroundImage: 'url(./assets/bg/bg_ar.svg)' }}
        />

        <div className="content sub-hero__inner">
          <Reveal as="h1" className="sub-hero__title" immediate delay={0.08} stagger={0.055}>
            AR-эффекты в соцсетях
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
                Создаю цифровую эстетику с технологическим бэкграундом. Специализируюсь на
                разработке AR-эффектов, которые объединяют дополненную реальность и физический
                продукт в единый покупательский опыт.
              </p>
              <p>
                Проектирую всё: от высокоточных виртуальных примерок (Try-on) до сложных
                3D-аватаров и Digital MUA. Мои решения помогают брендам выделяться в ленте и
                выстраивать глубокую эмоциональную связь с аудиторией.
              </p>
            </div>
            <div className="sub-aboutglass__chips">
              <span className="sub-eyebrow">Перечень выполняемых работ</span>
              <div className="sub-chips">
                {AR_CHIPS.map((chip) => (
                  <span className="tag" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Clients Marquee */}
      <section className="sub-section sub-clients" aria-label="Клиенты">
        <div className="content">
          <span className="sub-eyebrow">Клиенты</span>
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

      {/* 3. 4 Main AR Applications (PinnedSteps) */}
      <PinnedSteps
        title="4 основных применения AR для бизнеса"
        subtitle="От виртуальной примерки до оживающей упаковки — AR решает реальные маркетинговые задачи."
        steps={AR_APPLICATIONS}
        onImageClick={setLightboxItem}
      />

      {/* 4. 4-Card Pipeline */}
      <section className="sub-section content sub-pipe">
        <div className="sub-section__head">
          <span className="sub-eyebrow">Пайплайн</span>
          <Reveal as="h2" className="sub-heading">
            От брифа до публикации
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
              <h3 className="sub-pipe__title">{step.title}</h3>
              <p className="sub-pipe__text">{step.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* 5. v2 Request Builder (replaces old form) */}
      <RequestBuilder defaultTopic="AR-Эффект" />

      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  );
}
