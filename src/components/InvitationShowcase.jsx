import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';

const ASSETS = {
  front: './assets/invitation/image-01f1d595ce8c.webp',
  back: './assets/invitation/image-829c1d479c8f.webp',
  postboxBody: './assets/invitation/image-2c25ba0c7ef1.webp',
  postboxFlap: './assets/invitation/image-f071654277e5.webp',
};

export function InvitationShowcase() {
  const still = useStillMode();
  const { t } = useI18n();
  const [code, setCode] = useState('A5');
  const [opened, setOpened] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [rot, setRot] = useState({ x: 7, y: -14 });
  const dragRef = useRef(null);

  useEffect(() => {
    if (still) return;
    setOpened(false);
    setCode('');
    const t1 = window.setTimeout(() => setCode('A'), 450);
    const t2 = window.setTimeout(() => setCode('A5'), 900);
    const t3 = window.setTimeout(() => setOpened(true), 1450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [still]);

  const onPointerDown = (e) => {
    if (!opened || e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: rot.x,
      baseY: rot.y,
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = (e.clientX - d.startX) * 0.48;
    const dx = -(e.clientY - d.startY) * 0.36;
    setRot({
      x: Math.max(-34, Math.min(34, d.baseX + dx)),
      y: Math.max(-52, Math.min(52, d.baseY + dy)),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (/^[A-Za-zА-Яа-я][0-9]$/.test(code.trim())) {
      setOpened(true);
    } else {
      setCode('A5');
      setOpened(true);
    }
  };

  const resetView = () => {
    setOpened(true);
    setFlipped(false);
    setRot({ x: 7, y: -14 });
  };

  const totalY = rot.y + (flipped ? 180 : 0);

  return (
    <div className="v2-inv">
      <div
        className="v2-inv__stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="region"
        aria-label={t(
          'Интерактивное 3D-приглашение: код A5 вводится автоматически, открытку можно поворачивать'
        )}
      >
        {!opened ? (
          <div
            className="v2-inv__postbox"
            onClick={() => setOpened(true)}
            role="button"
            tabIndex={0}
          >
            <img
              className="v2-inv__postbox-flap"
              src={ASSETS.postboxFlap}
              alt=""
              draggable={false}
            />
            <img
              className="v2-inv__postbox-body"
              src={ASSETS.postboxBody}
              alt={t('Почтовый ящик с приглашением')}
              draggable={false}
            />
            <span className="v2-inv__postbox-badge">
              {t('Код:')} {code || '…'}
            </span>
          </div>
        ) : (
          <div
            className="v2-inv__card"
            style={{
              transform: `rotateX(${rot.x.toFixed(1)}deg) rotateY(${totalY.toFixed(1)}deg)`,
            }}
          >
            <div className="v2-inv__face v2-inv__face--front">
              <img
                className="v2-inv__layer"
                src={ASSETS.front}
                alt={t('Лицевая сторона приглашения')}
                draggable={false}
              />
            </div>
            <div className="v2-inv__face v2-inv__face--back">
              <img
                className="v2-inv__layer"
                src={ASSETS.back}
                alt={t('Обратная сторона приглашения')}
                draggable={false}
              />
            </div>
          </div>
        )}
      </div>

      <div className="v2-inv__panel">
        <div className="v2-inv__badge">{t('Интерактивный кейс · 3D-открытка')}</div>
        <h3 className="v2-inv__title">{t('Цифровое приглашение с кодом доступа')}</h3>
        <p className="v2-inv__desc">
          {t(
            'Гость вводит персональный код ящика (например, A5) — ящик открывается и достаёт объёмную двустороннюю открытку. Вращайте её мышью или пальцем и переворачивайте на оборот.'
          )}
        </p>

        <form className="v2-inv__code-form" onSubmit={handleUnlock}>
          <label className="v2-inv__field">
            <span>{t('Код ячейки (буква + цифра)')}</span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="A5"
              maxLength={4}
            />
          </label>
          <button type="submit" className="v2-pill-btn">
            {t('Открыть')}
          </button>
        </form>

        <div className="v2-inv__actions">
          <button
            type="button"
            className="v2-pill-btn v2-pill-btn--lime"
            onClick={() => {
              setOpened(true);
              setFlipped((f) => !f);
            }}
          >
            {flipped ? t('Лицевая сторона') : t('Перевернуть 180°')}
          </button>
          <button
            type="button"
            className="v2-pill-btn"
            onClick={() => setOpened((o) => !o)}
          >
            {opened ? t('Показать ящик') : t('Открыть открытку')}
          </button>
          <button type="button" className="v2-pill-btn" onClick={resetView}>
            {t('Сбросить')}
          </button>
        </div>
      </div>
    </div>
  );
}
