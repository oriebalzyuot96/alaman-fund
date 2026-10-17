import content from '../data/content.json';

export type Lang = 'en' | 'ar';
export type Block = { t: string; text?: string; sub?: string; value?: string; src?: string; alt?: string; href?: string; poster?: string; rows?: string[][] };
export type Page = { slug: string; title: string; desc: string; image: string; sections: Block[][] };
export type Post = { id: string; title: string; date: string; image: string; category: 'news' | 'royal'; excerpt: string; body: Block[] };

export const data = content as unknown as Record<Lang, { pages: Record<string, Page>; news: Post[] }>;

export const href = (lang: Lang, path: string) => {
  const clean = path.replace(/^\/+|\/+$/g, '');
  if (lang === 'ar') return clean ? `/ar/${clean}` : '/ar';
  return clean ? `/${clean}` : '/';
};

export const ui = {
  en: {
    dir: 'ltr',
    orgName: 'Al Aman Fund for the Future of Orphans',
    orgShort: 'Al Aman Fund',
    donate: 'Donate',
    apply: 'Apply now',
    search: 'Search',
    searchPlaceholder: 'Search programs, news, ways to give…',
    learnMore: 'Learn more',
    readMore: 'Read more',
    allNews: 'All news',
    langSwitch: 'العربية',
    home: 'Home',
    loading: 'Preparing a safe path',
    heroKicker: 'Est. 2006 · A royal initiative',
    heroTitleA: 'Creating a Brighter',
    heroTitleB: 'Future for',
    heroTitleC: 'Orphaned Youth',
    scroll: 'Scroll',
    impact: 'Two decades of measurable impact',
    journeyKicker: 'The journey after 18',
    journeyTitle: 'From leaving care to standing on their own',
    programsKicker: 'What we provide',
    programsTitle: 'Five programs. One safe path.',
    filmKicker: 'Watch',
    filmTitle: 'The Order of Al Istiqlal — Award Presentation',
    royalKicker: 'Royal patronage',
    newsKicker: 'Latest',
    newsTitle: 'Al Aman News',
    giveKicker: 'Ways to give',
    giveTitle: 'Every donor becomes a partner in a young person’s future.',
    footerTag: 'Supporting orphaned youth after the age of 18 since 2006.',
    policies: 'Policies',
    contact: 'Contact',
    follow: 'Follow us',
    rights: 'All rights reserved.',
    chatTitle: 'Aman Assistant',
    chatHello: 'Hi! I can help you donate, apply for a scholarship, calculate Zakat, or find anything on this site. What would you like to know?',
    chatPlaceholder: 'Ask about donating, applying, programs…',
    chatSuggestions: ['How can I donate?', 'How do I apply for a scholarship?', 'What does a Kafaleh cost?', 'Is my Zakat accepted?', 'Contact details'],
    chatFallback: 'Here is what I found on the site:',
    chatNone: 'I could not find that on the site. You can reach the team on +962 6 5330500 or info@alamanfund.jo.',
    open: 'Open',
    news: 'News',
    royal: 'Queen Rania',
    all: 'All',
    noResults: 'No results',
    pages: 'Pages',
    share: 'Share',
    related: 'More news',
    watch: 'Play video',
    perMonth: '/ month',
    joinProgram: 'Join program',
    download: 'Download',
    view: 'View report',
  },
  ar: {
    dir: 'rtl',
    orgName: 'صندوق الأمان لمستقبل الأيتام',
    orgShort: 'صندوق الأمان',
    donate: 'تبرّع',
    apply: 'قدّم الآن',
    search: 'بحث',
    searchPlaceholder: 'ابحث في البرامج والأخبار وطرق العطاء…',
    learnMore: 'اعرف المزيد',
    readMore: 'اقرأ المزيد',
    allNews: 'كل الأخبار',
    langSwitch: 'English',
    home: 'الرئيسية',
    loading: 'نمهّد طريقاً آمناً',
    heroKicker: 'تأسس عام 2006 · مبادرة ملكية',
    heroTitleA: 'نصنع مستقبلاً',
    heroTitleB: 'أكثر إشراقاً',
    heroTitleC: 'للشباب الأيتام',
    scroll: 'مرّر',
    impact: 'عقدان من الأثر الملموس',
    journeyKicker: 'الرحلة بعد سن 18',
    journeyTitle: 'من مغادرة دور الرعاية إلى الاعتماد على الذات',
    programsKicker: 'ما نقدّمه',
    programsTitle: 'خمسة برامج. طريق واحد آمن.',
    filmKicker: 'شاهد',
    filmTitle: 'وسام الاستقلال من الدرجة الأولى — حفل التقليد',
    royalKicker: 'رعاية ملكية',
    newsKicker: 'الأحدث',
    newsTitle: 'أخبار الأمان',
    giveKicker: 'طرق العطاء',
    giveTitle: 'كل متبرّع شريكٌ في مستقبل شاب أو شابة.',
    footerTag: 'ندعم الشباب الأيتام بعد سن 18 منذ عام 2006.',
    policies: 'السياسات',
    contact: 'تواصل معنا',
    follow: 'تابعنا',
    rights: 'جميع الحقوق محفوظة.',
    chatTitle: 'مساعد الأمان',
    chatHello: 'أهلاً! أستطيع مساعدتك في التبرع، أو التقديم على منحة، أو حساب الزكاة، أو إيجاد أي معلومة في الموقع. كيف أساعدك؟',
    chatPlaceholder: 'اسأل عن التبرع، التقديم، البرامج…',
    chatSuggestions: ['كيف أتبرع؟', 'كيف أقدّم على منحة؟', 'كم تكلفة الكفالة؟', 'هل تُقبل الزكاة؟', 'معلومات التواصل'],
    chatFallback: 'إليك ما وجدته في الموقع:',
    chatNone: 'لم أجد ذلك في الموقع. يمكنك التواصل مع الفريق على ‎+962 6 5330500 أو info@alamanfund.jo.',
    open: 'افتح',
    news: 'أخبار',
    royal: 'الملكة رانيا',
    all: 'الكل',
    noResults: 'لا توجد نتائج',
    pages: 'الصفحات',
    share: 'مشاركة',
    related: 'المزيد من الأخبار',
    watch: 'تشغيل الفيديو',
    perMonth: '/ شهرياً',
    joinProgram: 'انضم للبرنامج',
    download: 'تحميل',
    view: 'عرض التقرير',
  },
} as const;

export type UI = (typeof ui)['en'];

/** Navigation mirrors the original site's menu; labels come from each page's own title. */
export function nav(lang: Lang) {
  const t = (slug: string) => data[lang].pages[slug]?.title ?? slug;
  return [
    {
      label: t('who-we-are'),
      href: href(lang, 'who-we-are'),
      children: ['who-we-are', 'who-we-are/general-assembly', 'who-we-are/management-team', 'who-we-are/our-programs', 'who-we-are/reports-resources'].map((s) => ({ label: t(s), href: href(lang, s) })),
    },
    {
      label: t('ways-to-give'),
      href: href(lang, 'ways-to-give'),
      children: ['ways-to-give/donate', 'ways-to-give/our-partners', 'ways-to-give/individual-donation', 'ways-to-give/employee-deduction-program', 'ways-to-give/digital-donation'].map((s) => ({ label: t(s), href: href(lang, s) })),
    },
    { label: t('application-portal'), href: href(lang, 'application-portal') },
    { label: lang === 'ar' ? 'الإعلام والأخبار' : 'News & Releases', href: href(lang, 'news') },
    { label: t('pursuing-excellence'), href: href(lang, 'pursuing-excellence') },
    { label: t('al-aman-fund-charity-dinner'), href: href(lang, 'al-aman-fund-charity-dinner') },
    { label: t('contact-us'), href: href(lang, 'contact-us') },
  ];
}

export const policySlugs = ['privacy-policy', 'transparency-policy', 'data-protection-policy', 'environmental-policy', 'cookies-policy', 'terms-of-use'];

export const socials = [
  { name: 'Facebook', href: 'https://web.facebook.com/AlAmanFund' },
  { name: 'Instagram', href: 'https://www.instagram.com/alamanfund/' },
  { name: 'X', href: 'https://x.com/AlAmanFundJo' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/al-aman-fund-for-the-future-of-orphans/' },
  { name: 'YouTube', href: 'https://www.youtube.com/channel/UCtbaPmL65hYXRSNoKSrPgsQ' },
];

export const fmtDate = (lang: Lang, d: string) =>
  d ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : '';

/** The other-language URL for the language switcher. */
export function altPath(lang: Lang, path: string) {
  const p = path.replace(/^\/ar(\/|$)/, '/').replace(/\/$/, '') || '/';
  if (/^\/news\/\d+$/.test(p)) return lang === 'en' ? '/ar/news' : '/news'; // post ids differ per language
  return lang === 'en' ? href('ar', p) : href('en', p);
}
