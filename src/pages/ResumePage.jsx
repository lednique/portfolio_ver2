import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStillMode } from '../hooks/useA11y';
import { RequestBuilder } from '../components/RequestBuilder';
import { ResumeModal } from '../components/ResumeModal';
import { EASE_OUT, Reveal } from '../components/Reveal';

const SKILL_GROUPS = [
  {
    title: 'Графический дизайн',
    text: 'Айдентика и фирменный стиль, digital-дизайн, UI/UX, сайты, маркетплейс-инфографика, полиграфия и препресс, презентации, соцсети.',
  },
  {
    title: 'AR / XR',
    text: 'Face и body tracking, virtual try-on, digital make-up, target tracking, 3D-маски и AR-игры.',
  },
  {
    title: 'AI, 3D и motion',
    text: 'AI-фотосъёмка и видео, AI-модели, прототипирование контента, 3D-моделирование, текстуры и анимация.',
  },
];

const EXPERIENCE_BULLETS = [
  'Разрабатываю айдентику и визуальные системы; создаю макеты для цифровых и печатных носителей, готовлю файлы к печати.',
  'Проектирую карточки товаров и инфографику для маркетплейсов, сайты, презентации и материалы для социальных сетей.',
  'С 2019 года создаю AR/XR-проекты: face/body tracking, virtual try-on, digital make-up, target tracking, 3D-маски и AR-игры.',
  'С 2023 года создаю AI-фото товаров и моделей, AI-видео и прототипы UGC-контента; контролирую сходство товара, фактуры, свет и отражения.',
  'Выполняю 3D-моделирование и motion: модели и текстуры в Blender, rigging и анимация.',
];

export function ResumePage() {
  const still = useStillMode();
  const [pdfOpen, setPdfOpen] = useState(false);

  return (
    <div className="subpage subpage--resume">
      <section className="sub-section content v2-cv">
        {/* Header card */}
        <motion.header
          className="v2-cv__head"
          initial={still ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <div className="v2-cv__identity">
            <span className="sub-eyebrow">@lednique · Резюме · 2026</span>
            <Reveal as="h1" className="v2-cv__name" immediate delay={0.06}>
              Виктор Власов
            </Reveal>
            <p className="v2-cv__role">Графический дизайнер · AI / AR-продакшн</p>
            <p className="v2-cv__location">Ижевск · удалённо или гибридно</p>

            <div className="v2-cv__actions">
              <button
                type="button"
                className="v2-pill-btn v2-pill-btn--lime"
                onClick={() => setPdfOpen(true)}
              >
                Открыть PDF
              </button>
              <a
                className="v2-pill-btn"
                href="./assets/resume/resume.pdf"
                download="LEDNIQUE-Resume-RU.pdf"
              >
                Скачать PDF (RU)
              </a>
              <a
                className="v2-pill-btn"
                href="./assets/resume/resume-en.pdf"
                download="LEDNIQUE-Resume-EN.pdf"
              >
                English PDF
              </a>
            </div>
          </div>

          <div className="v2-cv__portrait">
            <img src="./assets/profile.jpg" alt="Виктор Власов" />
          </div>
        </motion.header>

        {/* Quick Contacts */}
        <div className="v2-cv__contacts">
          <a className="v2-pill-btn v2-pill-btn--lime" href="mailto:lednique1@ya.ru">
            lednique1@ya.ru
          </a>
          <a
            className="v2-pill-btn"
            href="https://t.me/lednique"
            target="_blank"
            rel="noreferrer noopener"
          >
            Telegram ↗
          </a>
          <a
            className="v2-pill-btn"
            href="https://www.behance.net/lednique"
            target="_blank"
            rel="noreferrer noopener"
          >
            Behance ↗
          </a>
          <a
            className="v2-pill-btn"
            href="https://lednique.ru"
            target="_blank"
            rel="noreferrer noopener"
          >
            Портфолио ↗
          </a>
        </div>

        {/* CV Body Sections */}
        <div className="v2-cv__sections">
          <article className="v2-cv__card">
            <h2 className="v2-cv__h2">Профиль</h2>
            <p className="v2-cv__p">
              Графический дизайнер с 12-летним опытом. С 2019 года – AR/XR-проекты, с 2023 года –
              AI-продакшн. Специализация: айдентика, digital- и печатные материалы,
              маркетплейс-инфографика, сайты, UI/UX и презентации. Создание AR-эффектов, AI-фото и
              видео; ведение проекта от брифа и визуальной концепции до файлов, готовых к публикации
              или печати. Портфолио включает проекты для более чем 20 брендов и компаний.
            </p>
          </article>

          <article className="v2-cv__card">
            <h2 className="v2-cv__h2">Ключевые компетенции</h2>
            <div className="v2-cv__skills">
              {SKILL_GROUPS.map((g) => (
                <div className="v2-cv__skill" key={g.title}>
                  <h3>{g.title}</h3>
                  <p>{g.text}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="v2-cv__card">
            <h2 className="v2-cv__h2">Инструменты</h2>
            <div className="v2-cv__stack">
              <p>
                <b>Дизайн:</b> Figma, Photoshop, Illustrator, InDesign.
              </p>
              <p>
                <b>3D и видео:</b> Blender, After Effects, Premiere Pro.
              </p>
              <p>
                <b>AR:</b> Lens Studio, Effect House. <b>AI:</b> Midjourney, Nano Banana, ChatGPT,
                Claude.
              </p>
            </div>
          </article>

          <article className="v2-cv__card">
            <h2 className="v2-cv__h2">Опыт работы</h2>
            <div className="v2-cv__job-head">
              <h3>Независимый дизайнер · LEDNIQUE</h3>
              <span className="tag">2014 – настоящее время</span>
            </div>
            <ul className="v2-cv__list">
              {EXPERIENCE_BULLETS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>

          <article className="v2-cv__card">
            <h2 className="v2-cv__h2">Выбранные бренды</h2>
            <p className="v2-cv__p v2-cv__brands">
              Glamnetic · OSCAR&amp;FRANK · SLA Paris · H&amp;M Beauty
            </p>
            <p className="v2-cv__note">Также – локальные компании и проекты под NDA.</p>
          </article>

          <article className="v2-cv__card">
            <h2 className="v2-cv__h2">Образование и языки</h2>
            <div className="v2-cv__stack">
              <p>
                <b>Образование:</b> ИжГТУ им. М.Т. Калашникова, специальность «Технология
                художественной и промышленной обработки материалов».
              </p>
              <p>
                <b>Русский:</b> родной. <b>Английский:</b> рабочее общение – брифы, переписка и
                созвоны.
              </p>
              <p>
                <b>Формат:</b> проектная работа, фриланс или частичная занятость; удалённо или
                гибридно в Ижевске.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* v2 Request Builder */}
      <RequestBuilder />

      <ResumeModal open={pdfOpen} onClose={() => setPdfOpen(false)} />
    </div>
  );
}
