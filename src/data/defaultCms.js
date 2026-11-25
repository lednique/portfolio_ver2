export const MAX_MENU_CARDS = 6;

export const DEFAULT_CMS = {
  version: 1,
  home: {
    menuCards: [
      {
        id: 'card-bka',
        tag: 'company rebranding – 2026',
        title: 'BKA VERTICAL',
        href: '#/design',
        image: './assets/figma/e37af.png',
      },
      {
        id: 'card-layla',
        tag: 'AR Effect development – 2026',
        title: 'layla – prismatic rhythm',
        href: '#/ar',
        image: './assets/figma/ad63d.png',
      },
      {
        id: 'card-faceshop',
        tag: 'AI Character design – 2026',
        title: 'led faceshop',
        href: '#/ai',
        image: './assets/figma/4b11d.png',
      },
    ],
    aiGallery: [
      {
        id: 'home-ai-1',
        src: './assets/figma/_dc/ai/4893af6008cd5d28b139b3d0f83596252c948806.webp',
        alt: 'AI-продакшн — главный кадр',
      },
      {
        id: 'home-ai-2',
        src: './assets/ai/hero-2.jpg',
        alt: 'AI-продакшн — портрет',
      },
      {
        id: 'home-ai-3',
        src: './assets/ai/hero-3.jpg',
        alt: 'AI-продакшн — editorial',
      },
      {
        id: 'home-ai-4',
        src: './assets/ai/hero-1.jpg',
        alt: 'AI-продакшн — стальной образ',
      },
    ],
  },
  design: {
    latestCase: {
      banner: './assets/gfx/bka-banner.jpg',
      preview: './assets/gfx/roll.jpg',
      alt: 'Company rebranding – BKA Vertical',
    },
    identityGallery: [
      { id: 'id-1', src: './assets/gfx/ident-lopale.jpg', alt: 'Lopale' },
      { id: 'id-2', src: './assets/gfx/ident-teamup.jpg', alt: 'TeamUp' },
      { id: 'id-3', src: './assets/gfx/ident-shaped.jpg', alt: 'Shaped' },
      { id: 'id-4', src: './assets/gfx/ident-aurora.jpg', alt: 'Aurora Brew' },
      { id: 'id-5', src: './assets/gfx/ident-bka.jpg', alt: 'BKA Vertical' },
      { id: 'id-6', src: './assets/gfx/ident-mycode.jpg', alt: 'MyCode' },
      { id: 'id-7', src: './assets/gfx/ident-school.jpg', alt: 'School' },
    ],
    infographicGallery: [
      { id: 'inf-1', src: './assets/gfx/card-perfume.jpg', alt: 'Парфюм — инфографика' },
      { id: 'inf-2', src: './assets/gfx/card-longsleeve.jpg', alt: 'Лонгслив — инфографика' },
      { id: 'inf-3', src: './assets/gfx/card-rashguard.jpg', alt: 'Рашгард — инфографика' },
      { id: 'inf-4', src: './assets/gfx/card-cream.jpg', alt: 'Крем — инфографика' },
      { id: 'inf-5', src: './assets/gfx/card-shopper.jpg', alt: 'Шоппер — инфографика' },
      { id: 'inf-6', src: './assets/gfx/card-smartphone.jpg', alt: 'Смартфон — инфографика' },
    ],
  },
  ar: {
    videos: [
      {
        id: 'ar-1',
        title: 'Mobile Legends',
        subtitle: 'Layla – Prismatic Rhythm',
        tag: 'BODY TRACKING',
        videoSrc: './assets/vid/anime3d_web.mp4',
        posterSrc: './assets/poster/anime3d.jpg',
      },
      {
        id: 'ar-2',
        title: 'OSCAR&FRANK',
        subtitle: 'КОЛЛЕКЦИЯ ОЧКОВ',
        tag: 'AR TRY-ON',
        videoSrc: './assets/vid/oscar_frank_web.mp4',
        posterSrc: './assets/poster/oscar_frank.jpg',
      },
      {
        id: 'ar-3',
        title: 'ACRYL – Reflection',
        subtitle: 'АРТ-РАБОТА',
        tag: 'GLASSMORPHISM',
        videoSrc: './assets/vid/glass_orbit_web.mp4',
        posterSrc: './assets/poster/glass_orbit.jpg',
      },
      {
        id: 'ar-4',
        title: 'platinum',
        subtitle: 'ВИЗУАЛЬНЫЙ ЭФФЕКТ',
        tag: '3D MOTION',
        videoSrc: './assets/vid/cdcase_web.mp4',
        posterSrc: './assets/poster/cdcase.jpg',
      },
      {
        id: 'ar-5',
        title: 'Witch Glam',
        subtitle: 'HALLOWEEN SPECIAL',
        tag: 'DIGITAL MUA',
        videoSrc: './assets/vid/cyber_glam_web.mp4',
        posterSrc: './assets/poster/cyber_glam.jpg',
      },
      {
        id: 'ar-6',
        title: 'dreamcore!',
        subtitle: 'СТИЛЬ Y2K',
        tag: 'ВИЗУАЛЬНЫЕ РЕШЕНИЯ',
        videoSrc: './assets/vid/bt21_web.mp4',
        posterSrc: './assets/poster/bt21.jpg',
      },
      {
        id: 'ar-7',
        title: 'GLAMNETIC',
        subtitle: '9 ВАРИАНТОВ ПРОДУКТА',
        tag: 'BEAUTY',
        videoSrc: './assets/vid/lash_tryon_web.mp4',
        posterSrc: './assets/poster/lash_tryon.jpg',
      },
      {
        id: 'ar-8',
        title: 'Balaclava',
        subtitle: '3D + BEAUTY',
        tag: 'FASHION',
        videoSrc: './assets/vid/balaclava_web.mp4',
        posterSrc: './assets/poster/balaclava.jpg',
      },
      {
        id: 'ar-9',
        title: 'Gummy Bear',
        subtitle: 'TARGET-TRACKING',
        tag: 'PHYGITAL',
        videoSrc: './assets/vid/gummybear_web.mp4',
        posterSrc: './assets/poster/gummybear.jpg',
      },
    ],
  },
  ai: {
    heroGallery: [
      { id: 'ai-h-1', src: './assets/ai/hero-2.jpg', alt: 'Портрет' },
      { id: 'ai-h-2', src: './assets/ai/hero-3.jpg', alt: 'Портрет' },
      { id: 'ai-h-3', src: './assets/ai/hero-1.jpg', alt: 'Стальной образ' },
      { id: 'ai-h-4', src: './assets/ai/ph-05.jpg', alt: 'Спорт' },
      { id: 'ai-h-5', src: './assets/ai/ph-06.jpg', alt: 'Гантель' },
      { id: 'ai-h-6', src: './assets/ai/ph-12.jpg', alt: 'Мех' },
    ],
    productGallery: [
      { id: 'ai-p-1', src: './assets/ai/cover-casio.jpg', alt: 'Casio' },
      { id: 'ai-p-2', src: './assets/ai/cover-coffee.jpg', alt: 'Coffee' },
      { id: 'ai-p-3', src: './assets/ai/cover-fur.jpg', alt: 'Fur' },
      { id: 'ai-p-4', src: './assets/ai/cover-sport.jpg', alt: 'Sport' },
      { id: 'ai-p-5', src: './assets/ai/cover-stiletto.jpg', alt: 'Stiletto' },
      { id: 'ai-p-6', src: './assets/ai/cover-wakuku.jpg', alt: 'Wakuku' },
    ],
    modelGallery: [
      { id: 'ai-m-1', src: './assets/ai/ph-13.jpg', alt: 'AI-модель 01' },
      { id: 'ai-m-2', src: './assets/ai/ph-04.jpg', alt: 'AI-модель 02' },
      { id: 'ai-m-3', src: './assets/ai/ph-01.jpg', alt: 'AI-модель 03' },
      { id: 'ai-m-4', src: './assets/ai/ph-11.jpg', alt: 'AI-модель 04' },
      { id: 'ai-m-5', src: './assets/ai/ph-14.jpg', alt: 'AI-модель 05' },
      { id: 'ai-m-6', src: './assets/ai/ph-08.jpg', alt: 'AI-модель 06' },
      { id: 'ai-m-7', src: './assets/ai/ph-09.jpg', alt: 'AI-модель 07' },
      { id: 'ai-m-8', src: './assets/ai/ph-07.jpg', alt: 'AI-модель 08' },
    ],
  },
};

export function cloneDefaultCms() {
  return JSON.parse(JSON.stringify(DEFAULT_CMS));
}
