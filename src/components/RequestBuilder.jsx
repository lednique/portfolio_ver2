import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useStillMode } from '../hooks/useA11y';
import { EASE_OUT, Reveal } from './Reveal';

const TOPICS = ['Графика', 'AR-Эффект', 'AI-Продакшн', 'Другое'];

export function RequestBuilder({ defaultTopic = 'Графика' }) {
  const still = useStillMode();
  const [topic, setTopic] = useState(TOPICS.includes(defaultTopic) ? defaultTopic : 'Графика');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('Добрый день!');

  const bodyText = useMemo(
    () =>
      [
        `Тематика проекта: ${topic}`,
        projectName ? `Название проекта: ${projectName}` : null,
        clientName ? `Ваше имя: ${clientName}` : null,
        company ? `Компания: ${company}` : null,
        budget ? `Бюджет: ${budget}$` : null,
        '',
        `Особые пожелания:\n${notes}`,
      ]
        .filter((line) => line !== null)
        .join('\n'),
    [topic, projectName, clientName, company, budget, notes]
  );

  const onBudgetChange = (e) => {
    const el = e.currentTarget;
    const digits = el.value.replace(/\D/g, '');
    setBudget(digits);
    requestAnimationFrame(() => {
      try {
        el.setSelectionRange(digits.length, digits.length);
      } catch {
        // Ignore selection errors
      }
    });
  };

  const onSend = () => {
    const subject = encodeURIComponent(
      `Заявка: ${topic}${projectName ? ` — ${projectName}` : ''}`
    );
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:lednique1@ya.ru?subject=${subject}&body=${body}`;
  };

  return (
    <section className="section content" id="request">
      <Reveal as="h2" className="section-title request-title" stagger={0.05}>
        КОНСТРУКТОР ЗАЯВКИ
      </Reveal>
      <motion.div
        className="builder"
        data-reveal="1"
        style={{ marginTop: 20 }}
        initial={still ? false : { opacity: 0, y: 30 }}
        animate={still ? { opacity: 1, y: 0 } : undefined}
        whileInView={still ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: still ? 0 : 0.8, ease: EASE_OUT }}
      >
        <div className="builder__form">
          <div className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              тематика проекта
            </Reveal>
            <div className="builder__chips">
              {TOPICS.map((item) => (
                <button
                  key={item}
                  className="chip"
                  aria-pressed={topic === item}
                  onClick={() => setTopic(item)}
                  type="button"
                >
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              название проекта
            </Reveal>
            <input
              className="builder__input"
              placeholder="название"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>

          <label className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              ваше имя
            </Reveal>
            <input
              className="builder__input"
              placeholder="имя"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </label>

          <label className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              компания
            </Reveal>
            <input
              className="builder__input"
              placeholder="название компании"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </label>

          <label className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              бюджет
            </Reveal>
            <input
              className="builder__input builder__input--budget"
              placeholder="$$$"
              inputMode="numeric"
              value={budget ? `${budget}$` : ''}
              onChange={onBudgetChange}
            />
          </label>
        </div>

        <div className="builder__preview-shell">
          <div className="builder__preview">
            <Reveal as="span" className="builder__preview-label" stagger={0.05}>
              особые пожелания
            </Reveal>
            <textarea
              className="builder__preview-text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="особые пожелания"
            />
          </div>
        </div>

        <div className="builder__send-wrap">
          <button className="builder__send" type="button" onClick={onSend}>
            <Reveal as="span" stagger={0.08}>
              отправить
            </Reveal>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
