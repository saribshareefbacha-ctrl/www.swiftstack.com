export type SiteLanguage = 'en' | 'ur' | 'pa' | 'sd' | 'ps' | 'bal' | 'skr' | 'ar' | 'fa' | 'hi' | 'tr';

export interface LanguageOption {
  code: SiteLanguage;
  nativeName: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
  locale: string;
}

export const SITE_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr', locale: 'en-PK' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', dir: 'rtl', locale: 'ur-PK' },
  { code: 'pa', nativeName: 'پنجابی', englishName: 'Punjabi', dir: 'rtl', locale: 'pa-Arab-PK' },
  { code: 'skr', nativeName: 'سرائیکی', englishName: 'Saraiki', dir: 'rtl', locale: 'skr-PK' },
  { code: 'sd', nativeName: 'سنڌي', englishName: 'Sindhi', dir: 'rtl', locale: 'sd-PK' },
  { code: 'ps', nativeName: 'پښتو', englishName: 'Pashto', dir: 'rtl', locale: 'ps-PK' },
  { code: 'bal', nativeName: 'بلوچی', englishName: 'Balochi', dir: 'rtl', locale: 'bal-PK' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl', locale: 'ar' },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', dir: 'rtl', locale: 'fa' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', dir: 'ltr', locale: 'hi-IN' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish', dir: 'ltr', locale: 'tr-TR' },
];

const translations: Record<SiteLanguage, Record<string, string>> = {
  en: {},
  ur: { Home:'ہوم', 'Services & Shop':'خدمات اور دکان', Portfolio:'پورٹ فولیو', 'Order & Quote':'آرڈر اور قیمت', Desktop:'ڈیسک ٹاپ', Mobile:'موبائل', Cart:'کارٹ', Login:'لاگ اِن', Register:'رجسٹر', Logout:'لاگ آؤٹ', 'Owner Dashboard':'مالک ڈیش بورڈ', 'Client Portal':'کلائنٹ پورٹل', 'Shopping Cart':'شاپنگ کارٹ', Apply:'لاگو کریں', Services:'خدمات', Projects:'منصوبے', Welcome:'خوش آمدید', Language:'زبان' },
  pa: { Home:'گھر', 'Services & Shop':'سروسز تے دکان', Portfolio:'پورٹ فولیو', 'Order & Quote':'آرڈر تے قیمت', Desktop:'ڈیسک ٹاپ', Mobile:'موبائل', Cart:'کارٹ', Login:'لاگ اِن', Register:'رجسٹر', Logout:'لاگ آؤٹ', 'Owner Dashboard':'مالک ڈیش بورڈ', 'Client Portal':'کلائنٹ پورٹل', 'Shopping Cart':'شاپنگ کارٹ', Apply:'لاؤ', Services:'سروسز', Projects:'پروجیکٹ', Welcome:'جی آیاں نوں', Language:'زبان' },
  skr: { Home:'گھر', 'Services & Shop':'خدمات تے دکان', Portfolio:'پورٹ فولیو', 'Order & Quote':'آرڈر تے قیمت', Desktop:'ڈیسک ٹاپ', Mobile:'موبائل', Cart:'کارٹ', Login:'لاگ اِن', Register:'رجسٹر', Logout:'لاگ آؤٹ', 'Owner Dashboard':'مالک ڈیش بورڈ', 'Client Portal':'کلائنٹ پورٹل', Apply:'لاگو کرو', Services:'خدمات', Projects:'منصوبے', Welcome:'بھلی کری آیاں', Language:'زبان' },
  sd: { Home:'گهر', 'Services & Shop':'خدمتون ۽ دڪان', Portfolio:'پورٽ فوليو', 'Order & Quote':'آرڊر ۽ قيمت', Desktop:'ڊيسڪ ٽاپ', Mobile:'موبائل', Cart:'ڪارٽ', Login:'لاگ اِن', Register:'رجسٽر', Logout:'لاگ آئوٽ', 'Owner Dashboard':'مالڪ ڊيش بورڊ', 'Client Portal':'ڪلائنٽ پورٽل', Apply:'لاڳو ڪريو', Services:'خدمتون', Projects:'منصوبا', Welcome:'ڀليڪار', Language:'ٻولي' },
  ps: { Home:'کور', 'Services & Shop':'خدمتونه او پلورنځی', Portfolio:'پورټ فولیو', 'Order & Quote':'امر او بیه', Desktop:'ډیسکتاپ', Mobile:'موبایل', Cart:'کارټ', Login:'ننوتل', Register:'راجستر', Logout:'وتل', 'Owner Dashboard':'د مالک ډشبورډ', 'Client Portal':'د پیرودونکي پورټل', Apply:'تطبیق', Services:'خدمتونه', Projects:'پروژې', Welcome:'ښه راغلاست', Language:'ژبه' },
  bal: { Home:'گِس', 'Services & Shop':'خدمت ءُ دکان', Portfolio:'پورٹ فولیو', 'Order & Quote':'آرڈر ءُ بہا', Desktop:'ڈیسک ٹاپ', Mobile:'موبائل', Cart:'کارٹ', Login:'لاگ اِن', Register:'رجسٹر', Logout:'در کپل', 'Owner Dashboard':'مالک ڈیش بورڈ', 'Client Portal':'کلائنٹ پورٹل', Apply:'لاگو کن', Services:'خدمت', Projects:'پروجیکٹ', Welcome:'وش آتکے', Language:'زبان' },
  ar: { Home:'الرئيسية', 'Services & Shop':'الخدمات والمتجر', Portfolio:'أعمالنا', 'Order & Quote':'الطلب وعرض السعر', Desktop:'سطح المكتب', Mobile:'الجوال', Cart:'السلة', Login:'تسجيل الدخول', Register:'إنشاء حساب', Logout:'تسجيل الخروج', 'Owner Dashboard':'لوحة تحكم المالك', 'Client Portal':'بوابة العميل', 'Shopping Cart':'سلة التسوق', Apply:'تطبيق', Services:'الخدمات', Projects:'المشاريع', Welcome:'مرحباً', Language:'اللغة' },
  fa: { Home:'خانه', 'Services & Shop':'خدمات و فروشگاه', Portfolio:'نمونه‌کارها', 'Order & Quote':'سفارش و قیمت', Desktop:'دسکتاپ', Mobile:'موبایل', Cart:'سبد', Login:'ورود', Register:'ثبت‌نام', Logout:'خروج', 'Owner Dashboard':'داشبورد مالک', 'Client Portal':'پرتال مشتری', Apply:'اعمال', Services:'خدمات', Projects:'پروژه‌ها', Welcome:'خوش آمدید', Language:'زبان' },
  hi: { Home:'होम', 'Services & Shop':'सेवाएँ और दुकान', Portfolio:'पोर्टफोलियो', 'Order & Quote':'ऑर्डर और कोटेशन', Desktop:'डेस्कटॉप', Mobile:'मोबाइल', Cart:'कार्ट', Login:'लॉग इन', Register:'रजिस्टर', Logout:'लॉग आउट', 'Owner Dashboard':'मालिक डैशबोर्ड', 'Client Portal':'क्लाइंट पोर्टल', Apply:'लागू करें', Services:'सेवाएँ', Projects:'परियोजनाएँ', Welcome:'स्वागत है', Language:'भाषा' },
  tr: { Home:'Ana Sayfa', 'Services & Shop':'Hizmetler ve Mağaza', Portfolio:'Portföy', 'Order & Quote':'Sipariş ve Teklif', Desktop:'Masaüstü', Mobile:'Mobil', Cart:'Sepet', Login:'Giriş', Register:'Kayıt', Logout:'Çıkış', 'Owner Dashboard':'Sahip Paneli', 'Client Portal':'Müşteri Portalı', Apply:'Uygula', Services:'Hizmetler', Projects:'Projeler', Welcome:'Hoş geldiniz', Language:'Dil' },
};

export function translate(language: SiteLanguage, text: string): string {
  return translations[language]?.[text] || text;
}

export function languageMeta(language: SiteLanguage): LanguageOption {
  return SITE_LANGUAGES.find((item) => item.code === language) || SITE_LANGUAGES[0];
}

export function loadLanguage(): SiteLanguage {
  const saved = localStorage.getItem('swiftstack_language');
  if (SITE_LANGUAGES.some((item) => item.code === saved)) return saved as SiteLanguage;
  const browser = navigator.language.toLowerCase();
  return SITE_LANGUAGES.find((item) => browser.startsWith(item.code))?.code || 'en';
}

const originalText = new Map<Text, string>();
let translationObserver: MutationObserver | null = null;

function translateTextNodes(root: Node, language: SiteLanguage): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    const parent = node.parentElement;
    if (parent && !['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION'].includes(parent.tagName)) {
      if (!originalText.has(node)) originalText.set(node, node.data);
      const source = originalText.get(node) || node.data;
      const trimmed = source.trim();
      const localized = translate(language, trimmed);
      if (localized !== trimmed) node.data = source.replace(trimmed, localized);
      else if (language === 'en') node.data = source;
    }
    node = walker.nextNode() as Text | null;
  }
}

export function applyDocumentLanguage(language: SiteLanguage): void {
  const meta = languageMeta(language);
  localStorage.setItem('swiftstack_language', language);
  document.documentElement.lang = meta.locale;
  document.documentElement.dir = meta.dir;
  document.body.dataset.language = language;

  originalText.forEach((source, node) => {
    if (node.isConnected) node.data = source;
    else originalText.delete(node);
  });
  translateTextNodes(document.body, language);
  translationObserver?.disconnect();
  translationObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => translateTextNodes(node, language)));
  });
  translationObserver.observe(document.body, { childList: true, subtree: true });
}
