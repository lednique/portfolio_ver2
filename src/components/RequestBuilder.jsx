import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { EASE_OUT, Reveal } from './Reveal';

const TOPICS = ['Графика', 'AR-Эффект', 'AI-Продакшн', 'Другое'];

export function RequestBuilder({ defaultTopic = 'Графика' }) {
  const still = useStillMode();
  const { t, lang } = useI18n();
  const [topic, setTopic] = useState(TOPICS.includes(defaultTopic) ? defaultTopic : 'Графика');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState(() => t('Добрый день!'));
  const userEditedNotesRef = useRef(false);

  // Keep default greeting synchronized when user switches language before typing
  useEffect(() => {
    if (!userEditedNotesRef.current) {
      setNotes(t('Добрый день!'));
    }
  }, [lang, t]);

  const translatedTopic = t(topic);

  const bodyText = useMemo(
    () =>
      [
        t('Тематика проекта: {val}', { val: translatedTopic }),
        projectName ? t('Название проекта: {val}', { val: projectName }) : null,
        clientName ? t('Ваше имя: {val}', { val: clientName }) : null,
        company ? t('Компания: {val}', { val: company }) : null,
        budget ? t('Бюджет: {val}$', { val: budget }) : null,
        '',
        `${t('Особые пожелания:')}\n${notes}`,
      ]
        .filter((line) => line !== null)
        .join('\n'),
    [t, translatedTopic, projectName, clientName, company, budget, notes]
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
    const baseSubj = t('Заявка: {topic}', { topic: translatedTopic });
    const subject = encodeURIComponent(
      `${baseSubj}${projectName ? ` — ${projectName}` : ''}`
    );
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:lednique1@ya.ru?subject=${subject}&body=${body}`;
  };

  return (
    <section className="section content" id="request">
      <Reveal as="h2" className="section-title request-title" stagger={0.05}>
        {t('КОНСТРУКТОР ЗАЯВКИ')}
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
              {t('тематика проекта')}
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
                  <span>{t(item)}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              {t('название проекта')}
            </Reveal>
            <input
              className="builder__input"
              placeholder={t('название')}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>

          <label className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              {t('ваше имя')}
            </Reveal>
            <input
              className="builder__input"
              placeholder={t('имя')}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </label>

          <label className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              {t('компания')}
            </Reveal>
            <input
              className="builder__input"
              placeholder={t('название компании')}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </label>

          <label className="builder__field">
            <Reveal as="span" className="builder__label" stagger={0.05}>
              {t('бюджет')}
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
              {t('особые пожелания')}
            </Reveal>
            <textarea
              className="builder__preview-text"
              value={notes}
              onChange={(e) => {
                userEditedNotesRef.current = true;
                setNotes(e.target.value);
              }}
              aria-label={t('особые пожелания')}
            />
          </div>
        </div>

        <div className="builder__send-wrap">
          <button className="builder__send" type="button" onClick={onSend}>
            <Reveal as="span" stagger={0.08}>
              {t('отправить')}
            </Reveal>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
