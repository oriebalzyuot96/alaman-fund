// Curated answers for the Aman Assistant. Every fact here comes from alamanfund.jo pages
// (individual-donation, application-portal, digital-donation, contact-us, our-programs…).
import type { Lang } from './i18n';

export type Answer = { text: string; links?: { label: string; href: string }[] };
type Intent = { id: string; keys: Record<Lang, RegExp>; answer: Record<Lang, Answer> };


export const intents: Intent[] = [
  {
    id: 'zakat',
    keys: { en: /zaka|zakah|nisab|fatwa/i, ar: /زكا|زكاة|نصاب|فتوى/ },
    answer: {
      en: {
        text: 'Yes. Al Aman Fund holds an official Fatwa from the Jordanian Iftaa Department (Fatwa No. 7/2010) permitting Zakat funds to support orphaned youth. You can work out what you owe with the Zakah Calculator — on wealth, gold, silver, agricultural produce or stocks — once your assets reach the Nisab.',
        links: [{ label: 'Open Zakah Calculator', href: '/ways-to-give/donate#zakat' }, { label: 'Donate Zakat', href: '/ways-to-give/donate' }],
      },
      ar: {
        text: 'نعم. يحمل صندوق الأمان فتوى رسمية من دائرة الإفتاء العام الأردنية (فتوى رقم 7/2010) تجيز صرف أموال الزكاة لدعم الشباب الأيتام. يمكنك احتساب زكاتك على المال أو الذهب أو الفضة أو الزروع أو الأسهم عبر حاسبة الزكاة بعد التأكد من بلوغ النصاب.',
        links: [{ label: 'حاسبة الزكاة', href: '/ar/ways-to-give/donate#zakat' }, { label: 'ادفع زكاتك', href: '/ar/ways-to-give/donate' }],
      },
    },
  },
  {
    id: 'hours',
    keys: { en: /employee|deduction|hours of education|monthly|salary|recurring/i, ar: /اقتطاع|ساعات الأمان|شهري|راتب|موظف/ },
    answer: {
      en: {
        text: 'The Hours of Education Program is a monthly employee-giving plan:\n• 2.5 JOD / month — 1 credit hour\n• 7.5 JOD — 1 course (3 credit hours)\n• 22.5 JOD — 1 summer semester (9 hours)\n• 37.5 JOD — 1 full semester (15 hours)\n• 75 JOD — 1 full academic year (30 hours)',
        links: [{ label: 'Join the program', href: 'https://recurring.alamanfund.jo/en/main' }, { label: 'Program details', href: '/ways-to-give/employee-deduction-program' }],
      },
      ar: {
        text: 'برنامج ساعات الأمان هو اقتطاع شهري لضمان استدامة تعليم الشباب الأيتام:\n• 2.5 دينار شهرياً — ساعة دراسية واحدة\n• 7.5 دينار — مادة واحدة (3 ساعات)\n• 22.5 دينار — فصل صيفي (9 ساعات)\n• 37.5 دينار — فصل دراسي كامل (15 ساعة)\n• 75 دينار — سنة دراسية كاملة (30 ساعة)',
        links: [{ label: 'انضم للبرنامج', href: 'https://recurring.alamanfund.jo/' }, { label: 'تفاصيل البرنامج', href: '/ar/ways-to-give/employee-deduction-program' }],
      },
    },
  },
  {
    id: 'kafaleh',
    keys: { en: /kafal|sponsor|cost|price|how much|package|jod|fee/i, ar: /كفال|تكلف|كم|سعر|باقة|دينار/ },
    answer: {
      en: {
        text: 'A Kafaleh can be paid once or in monthly installments:\n• Partial Kafaleh “Education” — 1,500 JOD covers one full academic year.\n• Comprehensive Kafaleh — 7,500 JOD covers education, housing, monthly allowance, health insurance and capacity-building & well-being programs.\nSmaller gifts: one credit hour 30–70 JOD, one course 90–150 JOD, housing 200 JOD/month, monthly allowance 150 JOD, health insurance 75 JOD, Iftar 5 JOD, Eidiyeh 25 JOD — or Zakat/Sadaqah of any amount.',
        links: [{ label: 'Individual donation', href: '/ways-to-give/individual-donation' }, { label: 'Donate now', href: '/ways-to-give/donate' }],
      },
      ar: {
        text: 'تُدفع الكفالة دفعة واحدة أو بأقساط شهرية:\n• كفالة يتيم جزئية “للتعليم” — 1500 دينار تغطي سنة دراسية كاملة.\n• كفالة يتيم كاملة — 7500 دينار تشمل التعليم والسكن والمصروف الشهري والتأمين الصحي وبرامج بناء القدرات.\nومساهمات أصغر: ساعة دراسية 30–70 ديناراً، مادة 90–150، السكن 200 دينار شهرياً، المصروف 150، التأمين الصحي 75، إفطار يتيم 5 دنانير، عيدية 25 ديناراً — أو زكاة وصدقة بأي مبلغ.',
        links: [{ label: 'تبرع الأفراد', href: '/ar/ways-to-give/individual-donation' }, { label: 'تبرع الآن', href: '/ar/ways-to-give/donate' }],
      },
    },
  },
  {
    id: 'wallets',
    keys: { en: /wallet|zain|orange|dinarak|u ?wallet|efawateer|talabat|careem|app|digital|online|card|visa|apple/i, ar: /محفظ|زين|أورنج|دينارك|فواتيركم|طلبات|كريم|تطبيق|إلكتروني|بطاقة/ },
    answer: {
      en: {
        text: 'You can give digitally any time: by card (Visa, Mastercard, Apple Pay) on the secure donate page, or through e-wallets and apps — Zain Cash, Orange Money, Dinarak, U Wallet, eFAWATEERcom (under “Charity Organizations”), Talabat and Careem. Choose “Al Aman Fund for the Future of Orphans” as the beneficiary.',
        links: [{ label: 'Step-by-step guides', href: '/ways-to-give/digital-donation' }, { label: 'Pay by card', href: '/ways-to-give/donate' }],
      },
      ar: {
        text: 'يمكنك التبرع إلكترونياً في أي وقت: بالبطاقة (فيزا، ماستركارد، Apple Pay) عبر صفحة التبرع الآمنة، أو عبر المحافظ والتطبيقات — زين كاش، أورنج موني، دينارك، يو والت، إي فواتيركم (ضمن “الجمعيات الخيرية”)، طلبات وكريم. اختر “صندوق الأمان لمستقبل الأيتام” كجهة مستفيدة.',
        links: [{ label: 'خطوات التبرع', href: '/ar/ways-to-give/digital-donation' }, { label: 'الدفع بالبطاقة', href: '/ar/ways-to-give/donate' }],
      },
    },
  },
  {
    id: 'apply',
    keys: { en: /apply|application|scholar|eligib|bachelor|diploma|vocational|student|study|university/i, ar: /قدّم|أقدم|تقديم|منح|منحة|بكالوريوس|دبلوم|مهني|طالب|جامعة|التحاق/ },
    answer: {
      en: {
        text: 'Al Aman offers three tracks:\n• Bachelor’s Degree — competitive scholarships at public universities (non-boarding youth); boarding youth may apply to public universities too.\n• Diploma — for boarding orphaned youth accepted into accredited colleges.\n• Vocational Training — for boarding youth passionate about hands-on careers or who did not pass Tawjihi.\nCheck the conditions for boarding / non-boarding youth, then apply on the eligibility portal.',
        links: [{ label: 'Apply now', href: 'https://eligibility.alamanfund.jo/' }, { label: 'Criteria & eligibility', href: '/application-portal' }],
      },
      ar: {
        text: 'يوفّر صندوق الأمان ثلاثة مسارات:\n• درجة البكالوريوس — منح تنافسية في الجامعات الرسمية.\n• الدبلوم — لخريجي دور الرعاية المقبولين في كليات معتمدة.\n• التدريب المهني — لمن يحب المهن التطبيقية أو لم يجتز امتحان التوجيهي.\nاطّلع على الشروط والمتطلبات لخريجي دور الرعاية وللشباب الأيتام من مختلف المحافظات ثم قدّم عبر بوابة الأهلية.',
        links: [{ label: 'قدّم الآن', href: 'https://eligibility.alamanfund.jo/' }, { label: 'معايير المنحة', href: '/ar/application-portal' }],
      },
    },
  },
  {
    id: 'donate',
    keys: { en: /donat|give|giving|support|help|contribut|sadaq|charity/i, ar: /تبرع|أتبرع|عطاء|دعم|أساعد|صدق|خير/ },
    answer: {
      en: {
        text: 'Thank you for wanting to help! You can:\n• Donate online by card in a few taps\n• Sponsor a young person (Kafaleh) from 1,500 JOD per year\n• Join the Hours of Education Program from 2.5 JOD / month\n• Give via e-wallets and apps (Zain Cash, Orange Money, Talabat, Careem…)\n• Visit the permanent booth at City Mall, P1 floor\n• Partner with us as a company',
        links: [{ label: 'Donate now', href: '/ways-to-give/donate' }, { label: 'All ways to give', href: '/ways-to-give' }],
      },
      ar: {
        text: 'شكراً لرغبتك في العطاء! يمكنك:\n• التبرع إلكترونياً بالبطاقة بخطوات بسيطة\n• كفالة شاب أو شابة ابتداءً من 1500 دينار سنوياً\n• الانضمام لبرنامج ساعات الأمان من 2.5 دينار شهرياً\n• التبرع عبر المحافظ والتطبيقات (زين كاش، أورنج موني، طلبات، كريم…)\n• زيارة بوث التبرعات الدائم في سيتي مول\n• الشراكة معنا كمؤسسة',
        links: [{ label: 'تبرع الآن', href: '/ar/ways-to-give/donate' }, { label: 'طرق العطاء', href: '/ar/ways-to-give' }],
      },
    },
  },
  {
    id: 'contact',
    keys: { en: /contact|phone|call|email|address|location|visit|where|office|booth|mall/i, ar: /تواصل|هاتف|اتصال|بريد|عنوان|موقع|زيارة|أين|مكتب|بوث|مول/ },
    answer: {
      en: {
        text: '📞 +962 6 5330500\n✉️ info@alamanfund.jo\n🏢 Headquarter: Mohammed Al-Saeed Al-Bataineh Street 5, Amman\n🛍️ Permanent Donation Booth: City Mall, P1 Floor, next to Cairo Amman Bank',
        links: [{ label: 'Contact page & maps', href: '/contact-us' }],
      },
      ar: {
        text: '📞 ‎+962 6 5330500\n✉️ info@alamanfund.jo\n🏢 المكتب الرئيسي: عمان – دابوق – شارع محمد السعيد البطاينة، رقم 5\n🛍️ بوث التبرعات الدائم: سيتي مول – بجانب بنك القاهرة عمان',
        links: [{ label: 'صفحة التواصل والخرائط', href: '/ar/contact-us' }],
      },
    },
  },
  {
    id: 'programs',
    keys: { en: /program|service|provide|offer|housing|allowance|insurance|psycho|inclusion|capacity|training/i, ar: /برنامج|برامج|خدمات|تقدم|سكن|مصروف|تأمين|نفسي|دمج|قدرات|تدريب/ },
    answer: {
      en: {
        text: 'Al Aman’s five programs:\n1. Education — full scholarships at universities, colleges and vocational centres\n2. Living Support — monthly allowance, safe housing and health insurance\n3. Capacity Building — skills that prepare youth for the job market\n4. Psychosocial Support — the “Step Towards Safety” well-being program\n5. Inclusion — social, cultural and community participation',
        links: [{ label: 'Our programs', href: '/who-we-are/our-programs' }],
      },
      ar: {
        text: 'برامج صندوق الأمان الخمسة:\n1. المنح التعليمية\n2. الدعم المعيشي — مصروف شهري وسكن آمن وتأمين صحي\n3. تطوير الذات وبناء القدرات\n4. الدعم النفسي\n5. برنامج الدمج',
        links: [{ label: 'برامجنا', href: '/ar/who-we-are/our-programs' }],
      },
    },
  },
  {
    id: 'reports',
    keys: { en: /report|annual|financ|transparen|audit/i, ar: /تقرير|تقارير|سنوي|مالي|شفافية/ },
    answer: {
      en: { text: 'Annual reports for 2023, 2024 and 2025 are available to view and download.', links: [{ label: 'Reports & Resources', href: '/who-we-are/reports-resources' }, { label: 'Transparency policy', href: '/transparency-policy' }] },
      ar: { text: 'التقارير السنوية للأعوام 2023 و2024 و2025 متاحة للعرض والتحميل.', links: [{ label: 'التقارير والمصادر', href: '/ar/who-we-are/reports-resources' }, { label: 'سياسة الشفافية', href: '/ar/transparency-policy' }] },
    },
  },
  {
    id: 'about',
    keys: { en: /who|about|history|found|establish|queen|rania|vision|mission|impact|how many/i, ar: /من أنتم|من نحن|تأسس|تأسيس|الملكة|رانيا|رؤية|رسالة|أثر|إنجاز/ },
    answer: {
      en: {
        text: 'Al Aman Fund for the Future of Orphans was established in 2006 by Her Majesty Queen Rania Al Abdullah — the first institution in Jordan dedicated to orphaned youth after the age of 18. In two decades: 5,088 beneficiaries covered, 3,856 graduates, 78% job placement, 2,902 trained and 536 active students today.',
        links: [{ label: 'Who we are', href: '/who-we-are' }, { label: 'Pursuing excellence', href: '/pursuing-excellence' }],
      },
      ar: {
        text: 'تأسس صندوق الأمان لمستقبل الأيتام عام 2006 بمبادرة من جلالة الملكة رانيا العبدالله، وهو أول مؤسسة في الأردن تُعنى بالشباب الأيتام بعد سن 18. خلال عقدين: 5088 مستفيداً، 3856 خريجاً، 78% حصلوا على وظيفة، 2902 تلقّوا برامج تدريبية، و536 على مقاعد الدراسة حالياً.',
        links: [{ label: 'من نحن', href: '/ar/who-we-are' }, { label: 'مسيرتنا للتميّز', href: '/ar/pursuing-excellence' }],
      },
    },
  },
];

export function matchIntent(lang: Lang, q: string): Answer | null {
  for (const it of intents) if (it.keys[lang].test(q) || it.keys.en.test(q)) return it.answer[lang];
  return null;
}
