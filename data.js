/* Farshid demo: sample data. All businesses, people and reviews are fictional examples. */
(function () {
  const DAY = 86400000;
  const now = Date.now();
  // Calendar date in Tehran, offset by whole days, as YYYY-MM-DD.
  const tDate = off => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now + off * DAY));
  const slugify = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Neighbourhood centres (real coordinates, WGS84).
  const hoods = {
    tajrish:    { fa: 'تجریش', en: 'Tajrish', lat: 35.8045, lng: 51.4336 },
    niavaran:   { fa: 'نیاوران', en: 'Niavaran', lat: 35.8135, lng: 51.47 },
    saadat:     { fa: 'سعادت‌آباد', en: 'Saadat Abad', lat: 35.7882, lng: 51.386 },
    jordan:     { fa: 'جردن', en: 'Jordan', lat: 35.764, lng: 51.417 },
    pasdaran:   { fa: 'پاسداران', en: 'Pasdaran', lat: 35.7745, lng: 51.465 },
    vanak:      { fa: 'ونک', en: 'Vanak', lat: 35.7577, lng: 51.41 },
    mirdamad:   { fa: 'میرداماد', en: 'Mirdamad', lat: 35.76, lng: 51.428 },
    punak:      { fa: 'پونک', en: 'Punak', lat: 35.763, lng: 51.329 },
    yousefabad: { fa: 'یوسف‌آباد', en: 'Yousef Abad', lat: 35.733, lng: 51.4 },
    enghelab:   { fa: 'انقلاب', en: 'Enghelab', lat: 35.7008, lng: 51.391 },
    shahrak:    { fa: 'شهرک غرب', en: 'Shahrak-e Gharb', lat: 35.7594, lng: 51.3746 },
    narmak:     { fa: 'نارمک', en: 'Narmak', lat: 35.736, lng: 51.5073 },
    tehranpars: { fa: 'تهرانپارس', en: 'Tehranpars', lat: 35.728, lng: 51.5206 },
    ekbatan:    { fa: 'اکباتان', en: 'Ekbatan', lat: 35.7078, lng: 51.3044 },
    bazaar:     { fa: 'بازار', en: 'Grand Bazaar', lat: 35.6728, lng: 51.4218 }
  };

  const cats = [
    { id: 'food',    fa: 'رستوران',      en: 'Restaurants',   icon: 'c-food',    kw: 'غذا رستوران کباب ناهار شام پیتزا food restaurant eat lunch dinner' },
    { id: 'cafe',    fa: 'کافه',        en: 'Cafés',         icon: 'c-cafe',    kw: 'قهوه کافه چای دنج coffee cafe café tea' },
    { id: 'auto',    fa: 'خدمات خودرو',  en: 'Auto services', icon: 'c-auto',    kw: 'ماشین خودرو تعمیرگاه مکانیک کارواش car mechanic garage wash' },
    { id: 'beauty',  fa: 'زیبایی',       en: 'Beauty & spa',  icon: 'c-beauty',  kw: 'آرایشگاه سالن مو ماساژ اسپا salon hair spa massage beauty' },
    { id: 'home',    fa: 'خدمات منزل',   en: 'Home services', icon: 'c-home',    kw: 'نظافت خانه تمیز cleaning home house' },
    { id: 'health',  fa: 'سلامت',        en: 'Health',        icon: 'c-health',  kw: 'دکتر پزشک دندان دندانپزشک داروخانه کلینیک doctor dentist pharmacy clinic health' },
    { id: 'shop',    fa: 'فروشگاه',      en: 'Shopping',      icon: 'c-shop',    kw: 'خرید فروشگاه هدیه موبایل shop shopping gift store' },
    { id: 'fitness', fa: 'ورزش',         en: 'Fitness',       icon: 'c-fitness', kw: 'باشگاه ورزش بدنسازی یوگا gym fitness yoga workout' }
  ];

  // Short helper for a menu/service item.
  const m = (fa, en, p, pop) => ({ n: { fa, en }, p, pop: !!pop });

  const businesses = [
    { id: 1, cat: 'food', hood: 'vanak', lat: 35.75554, lng: 51.40989, price: 2, rating: 4.6, count: 238, verified: true,
      name: { fa: 'رستوران باغ ایرانی', en: 'Bagh-e Irani' }, phone: '021 8812 4456',
      addr: { fa: 'خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۲۱۴', en: 'No. 214, Valiasr St, just before Vanak Sq' },
      about: { fa: 'رستوران باغ ایرانی در حیاطی پر از درخت و حوض، غذاهای اصیل ایرانی را با برنج ایرانی و زعفران قائنات سرو می‌کند. کباب‌ها روی زغال طبیعی پخته می‌شوند و شب‌ها موسیقی زنده‌ی سنتی برقرار است.',
               en: 'Set in a leafy courtyard with a traditional pool, Bagh-e Irani serves classic Persian dishes with Iranian rice and Qaenat saffron. Kebabs are grilled over real charcoal, with live traditional music in the evenings.' },
      tags: { fa: ['ایرانی', 'کباب', 'فضای باز'], en: ['Persian', 'Kebab', 'Outdoor seating'] },
      amen: ['outdoor', 'parking', 'card', 'reserve', 'kids'], hours: { o: '12:00', c: '23:30', off: [] },
      menu: [m('کباب کوبیده (دو سیخ)', 'Koobideh kebab (two skewers)', 280000, 1), m('جوجه‌کباب زعفرانی', 'Saffron chicken kebab', 320000), m('باقالی‌پلو با ماهیچه', 'Baghali polo with lamb shank', 450000, 1), m('دوغ محلی', 'Local doogh', 45000)] },

    { id: 2, cat: 'cafe', hood: 'niavaran', lat: 35.81229, lng: 51.46803, price: 1, rating: 4.8, count: 512, verified: true, ownerId: 'u-owner',
      name: { fa: 'کافه نسیم', en: 'Cafe Nasim' }, phone: '021 2228 7731',
      addr: { fa: 'خیابان نیاوران، کوچه گلستان، پلاک ۸', en: 'No. 8, Golestan Alley, Niavaran St' },
      about: { fa: 'کافه نسیم دانه‌های قهوه را هر هفته در محل رُست می‌کند. فضای آرام، نور طبیعی و میزهای مخصوص کار، اینجا را پاتوق دانشجوها و فریلنسرهای شمال شهر کرده.',
               en: 'Cafe Nasim roasts its beans on site every week. Calm rooms, natural light and work-friendly tables make it a favourite with students and freelancers in north Tehran.' },
      tags: { fa: ['قهوه اسپشیالتی', 'دسر', 'مناسب کار'], en: ['Specialty coffee', 'Desserts', 'Laptop friendly'] },
      amen: ['wifi', 'card', 'outdoor', 'ac', 'reserve'], hours: { o: '08:00', c: '23:00', off: [] },
      menu: [m('اسپرسو', 'Espresso', 75000), m('فلت‌وایت', 'Flat white', 110000, 1), m('کیک هویج', 'Carrot cake', 95000), m('صبحانه‌ی کامل', 'Full breakfast', 220000, 1)] },

    { id: 3, cat: 'auto', hood: 'saadat', lat: 35.78925, lng: 51.38586, price: 2, rating: 4.4, count: 97, verified: false,
      name: { fa: 'تعمیرگاه آرین', en: 'Arian Auto Care' }, phone: '021 2235 9012',
      addr: { fa: 'بلوار سعادت‌آباد، نبش خیابان ۲۴ غربی', en: 'Saadat Abad Blvd, corner of West 24th St' },
      about: { fa: 'تعمیرگاه آرین با دستگاه دیاگ به‌روز، تعویض روغن، سرویس ترمز و بالانس را با نوبت‌دهی آنلاین و فاکتور شفاف انجام می‌دهد.',
               en: 'Arian Auto Care handles oil changes, brake service and wheel alignment with up-to-date diagnostics, online booking and clear itemised invoices.' },
      tags: { fa: ['تعویض روغن', 'دیاگ', 'بالانس'], en: ['Oil change', 'Diagnostics', 'Alignment'] },
      amen: ['parking', 'card', 'appoint'], hours: { o: '08:00', c: '19:00', off: [5] },
      menu: [m('تعویض روغن و فیلتر (اجرت)', 'Oil and filter change (labour)', 350000, 1), m('بالانس و تنظیم فرمان', 'Wheel balancing and alignment', 650000), m('عیب‌یابی با دیاگ', 'Diagnostic scan', 400000)] },

    { id: 4, cat: 'beauty', hood: 'jordan', lat: 35.76372, lng: 51.41546, price: 3, rating: 4.7, count: 164, verified: true,
      name: { fa: 'استودیو زیبایی رز', en: 'Rose Beauty Studio' }, phone: '021 2205 6678',
      addr: { fa: 'خیابان جردن، بالاتر از میرداماد، پلاک ۵۵', en: 'No. 55, Jordan St, north of Mirdamad' },
      about: { fa: 'استودیو رز با تیمی از متخصصان رنگ، کوتاهی و میکاپ، از محصولات حرفه‌ای و ابزار یک‌بار مصرف استفاده می‌کند. مشاوره‌ی رنگ قبل از هر خدمت رایگان است.',
               en: 'Rose Studio’s team of colour, cut and make-up specialists works with professional products and single-use tools. A colour consultation before every service is free.' },
      tags: { fa: ['رنگ مو', 'میکاپ', 'ناخن'], en: ['Hair colour', 'Make-up', 'Nails'] },
      amen: ['card', 'appoint', 'ac', 'wifi'], hours: { o: '10:00', c: '20:00', off: [5] },
      menu: [m('رنگ و لایت', 'Colour and highlights', 3500000, 1), m('کوتاهی و براشینگ', 'Cut and blow-dry', 600000), m('میکاپ مجلسی', 'Event make-up', 2800000)] },

    { id: 5, cat: 'home', hood: 'punak', lat: 35.76437, lng: 51.32905, price: 2, rating: 4.4, count: 71, verified: true,
      name: { fa: 'خدمات نظافت درخشان', en: 'Derakhshan Cleaning' }, phone: '021 4441 2290',
      addr: { fa: 'بلوار پونک، خیابان شهید فلاح، پلاک ۱۲', en: 'No. 12, Shahid Fallah St, Punak Blvd' },
      about: { fa: 'خدمات نظافت درخشان با نیروهای آموزش‌دیده و بیمه‌شده، نظافت منزل، اداره و شستشوی مبل را با مواد شوینده‌ی بی‌خطر انجام می‌دهد.',
               en: 'Derakhshan sends trained, insured cleaners for homes and offices, plus upholstery washing, using family-safe products.' },
      tags: { fa: ['نظافت منزل', 'نظافت اداری', 'مبل‌شویی'], en: ['Home cleaning', 'Office cleaning', 'Upholstery'] },
      amen: ['appoint', 'card'], hours: { o: '07:00', c: '21:00', off: [] },
      menu: [m('نظافت منزل تا ۱۰۰ متر', 'Home clean, up to 100 m²', 1800000, 1), m('نظافت اداری (هر ساعت)', 'Office cleaning (per hour)', 250000), m('شستشوی مبل (هر نفر)', 'Sofa wash (per seat)', 180000)] },

    { id: 6, cat: 'health', hood: 'mirdamad', lat: 35.76297, lng: 51.42648, price: 3, rating: 4.9, count: 302, verified: true,
      name: { fa: 'کلینیک دندانپزشکی لبخند', en: 'Labkhand Dental Clinic' }, phone: '021 2291 4420',
      addr: { fa: 'خیابان میرداماد، نبش خیابان البرز، طبقه‌ی ۳', en: '3rd floor, Mirdamad St at Alborz St' },
      about: { fa: 'کلینیک دندانپزشکی لبخند با تجهیزات دیجیتال و رادیولوژی در محل، خدمات ایمپلنت، ارتودنسی، زیبایی و دندانپزشکی کودکان را ارائه می‌دهد.',
               en: 'Labkhand Dental Clinic offers implants, orthodontics, cosmetic and children’s dentistry, with digital equipment and on-site X-ray.' },
      tags: { fa: ['ایمپلنت', 'ارتودنسی', 'کودکان'], en: ['Implants', 'Orthodontics', 'Children'] },
      amen: ['appoint', 'card', 'wheelchair', 'ac', 'kids'], hours: { o: '09:00', c: '21:00', off: [5] },
      menu: [m('معاینه و مشاوره', 'Check-up and consultation', 500000), m('جرم‌گیری و بروساژ', 'Scale and polish', 1500000, 1), m('ایمپلنت (هر واحد)', 'Implant (per unit)', 25000000)] },

    { id: 7, cat: 'food', hood: 'tajrish', lat: 35.80658, lng: 51.43418, price: 2, rating: 4.5, count: 389, verified: false,
      name: { fa: 'کبابی شبانه‌ی تجریش', en: 'Tajrish Night Kebab' }, phone: '021 2271 0098',
      addr: { fa: 'میدان تجریش، ابتدای خیابان شهرداری', en: 'Tajrish Sq, start of Shahrdari St' },
      about: { fa: 'از غروب تا دیروقت، کباب برگ و جیگر تازه روی آتش زغال؛ پاتوق شبانه‌ی بعد از بازار تجریش.',
               en: 'From sunset until late: barg kebab and fresh liver skewers over charcoal. The go-to late-night stop after Tajrish bazaar.' },
      tags: { fa: ['کباب', 'جیگر', 'شبانه'], en: ['Kebab', 'Liver skewers', 'Late night'] },
      amen: ['outdoor', 'card', 'delivery'], hours: { o: '18:00', c: '02:00', off: [] },
      menu: [m('کباب برگ', 'Barg kebab', 520000, 1), m('کباب سلطانی', 'Soltani kebab', 690000), m('جیگر (هر سیخ)', 'Liver (per skewer)', 90000, 1)] },

    { id: 8, cat: 'cafe', hood: 'enghelab', lat: 35.70295, lng: 51.38971, price: 1, rating: 4.6, count: 211, verified: true,
      name: { fa: 'کافه کتاب پاییز', en: 'Paeez Book Café' }, phone: '021 6646 1203',
      addr: { fa: 'خیابان انقلاب، روبه‌روی دانشگاه تهران، کوچه‌ی فخر رازی', en: 'Fakhr Razi Alley, Enghelab St, opposite University of Tehran' },
      about: { fa: 'کافه کتاب پاییز در قلب راسته‌ی کتاب‌فروشی‌های انقلاب؛ چای دارچین، کیک خانگی و قفسه‌هایی پر از کتاب برای امانت.',
               en: 'Paeez sits in the heart of Enghelab’s bookseller row: cinnamon tea, home-made cake and shelves of books you can borrow.' },
      tags: { fa: ['کافه کتاب', 'چای', 'آرام'], en: ['Book café', 'Tea', 'Quiet'] },
      amen: ['wifi', 'card', 'ac'], hours: { o: '10:00', c: '22:00', off: [] },
      menu: [m('چای دارچین و کیک', 'Cinnamon tea and cake', 120000, 1), m('لاته', 'Latte', 105000), m('هات‌چاکلت', 'Hot chocolate', 115000)] },

    { id: 9, cat: 'shop', hood: 'tajrish', lat: 35.80335, lng: 51.43484, price: 3, rating: 4.8, count: 143, verified: true,
      name: { fa: 'گالری صنایع دستی فیروزه', en: 'Firouzeh Handicrafts' }, phone: '021 2272 5541',
      addr: { fa: 'بازار تجریش، راسته‌ی صنایع دستی، پلاک ۴۲', en: 'No. 42, handicrafts row, Tajrish Bazaar' },
      about: { fa: 'گالری فیروزه آثار دست‌ساز هنرمندان اصفهان، تبریز و کرمان را عرضه می‌کند: میناکاری، فیروزه‌کوبی، گلیم و کاشی هفت‌رنگ. بسته‌بندی هدیه رایگان است.',
               en: 'Firouzeh Gallery sells handmade work from artists in Isfahan, Tabriz and Kerman: enamel, turquoise inlay, kilims and haft-rang tiles. Gift wrapping is free.' },
      tags: { fa: ['میناکاری', 'گلیم', 'هدیه'], en: ['Enamelware', 'Kilims', 'Gifts'] },
      amen: ['card', 'delivery'], hours: { o: '10:00', c: '21:00', off: [] },
      menu: [m('کاشی میناکاری', 'Enamel tile', 1800000, 1), m('ظرف فیروزه‌کوب', 'Turquoise-inlay dish', 4200000), m('گلیم دستباف (۱ در ۱٫۵ متر)', 'Handwoven kilim (1 × 1.5 m)', 9500000)] },

    { id: 10, cat: 'fitness', hood: 'pasdaran', lat: 35.77363, lng: 51.46511, price: 2, rating: 4.3, count: 126, verified: false,
      name: { fa: 'باشگاه ورزشی آرتا', en: 'Arta Fitness Club' }, phone: '021 2284 7710',
      addr: { fa: 'خیابان پاسداران، گلستان دوم، پلاک ۱۸', en: 'No. 18, Second Golestan, Pasdaran St' },
      about: { fa: 'باشگاه آرتا با سالن بدنسازی، کراس‌فیت و کلاس‌های یوگا از ساعت ۶ صبح باز است. برنامه‌ی تمرینی اول عضویت رایگان طراحی می‌شود.',
               en: 'Arta has a weights floor, CrossFit area and yoga classes, open from 6am. Your first training plan is designed free when you join.' },
      tags: { fa: ['بدنسازی', 'کراس‌فیت', 'یوگا'], en: ['Weights', 'CrossFit', 'Yoga'] },
      amen: ['parking', 'card', 'ac', 'wifi'], hours: { o: '06:00', c: '23:00', off: [] },
      menu: [m('عضویت ماهانه', 'Monthly membership', 2500000, 1), m('جلسه‌ی مربی خصوصی', 'Personal training session', 600000), m('کلاس یوگا (تک‌جلسه)', 'Yoga class (drop-in)', 350000)] },

    { id: 11, scene: 'pizza', cat: 'food', hood: 'yousefabad', lat: 35.7314, lng: 51.40086, price: 2, rating: 4.2, count: 184, verified: false, isNew: true,
      name: { fa: 'پیتزا ناپولی', en: 'Napoli Pizza' }, phone: '021 8872 3345',
      addr: { fa: 'یوسف‌آباد، خیابان ۳۳، پلاک ۷', en: 'No. 7, 33rd St, Yousef Abad' },
      about: { fa: 'پیتزا ناپولی با خمیر ۴۸ ساعته و تنور هیزمی، پیتزای ایتالیایی نازک و ترد می‌پزد.',
               en: 'Napoli bakes thin, crisp Italian pizza in a wood-fired oven, using dough rested for 48 hours.' },
      tags: { fa: ['پیتزا', 'ایتالیایی', 'ارسال'], en: ['Pizza', 'Italian', 'Delivery'] },
      amen: ['delivery', 'card', 'kids'], hours: { o: '12:00', c: '24:00', off: [] },
      menu: [m('پیتزا مارگاریتا', 'Margherita', 380000, 1), m('پیتزا پپرونی', 'Pepperoni', 460000), m('سالاد سزار', 'Caesar salad', 290000)] },

    { id: 12, scene: 'spa', cat: 'beauty', hood: 'niavaran', lat: 35.81552, lng: 51.46869, price: 4, rating: 4.7, count: 88, verified: true,
      name: { fa: 'اسپای آرامش', en: 'Aramesh Spa' }, phone: '021 2229 4400',
      addr: { fa: 'نیاوران، خیابان باهنر، پلاک ۱۰۵', en: 'No. 105, Bahonar St, Niavaran' },
      about: { fa: 'اسپای آرامش با اتاق‌های خصوصی، سونای خشک و بخار و ماساژورهای دارای مدرک، تجربه‌ای آرام در شمال شهر می‌سازد.',
               en: 'Aramesh Spa offers private rooms, dry and steam saunas and certified massage therapists for a calm escape in north Tehran.' },
      tags: { fa: ['ماساژ', 'سونا', 'پوست'], en: ['Massage', 'Sauna', 'Skin care'] },
      amen: ['parking', 'appoint', 'card', 'ac'], hours: { o: '11:00', c: '21:00', off: [] },
      menu: [m('ماساژ ریلکسی ۶۰ دقیقه', 'Relaxing massage, 60 min', 2200000, 1), m('پاکسازی پوست', 'Facial', 1600000), m('سونا و جکوزی', 'Sauna and jacuzzi', 500000)] },

    { id: 13, cat: 'cafe', hood: 'mirdamad', lat: 35.76125, lng: 51.42767, price: 2, rating: 4.5, count: 167, verified: true,
      name: { fa: 'رُست‌خانه‌ی قهوه سیاه', en: 'Black Bean Roastery' }, phone: '021 2290 8817',
      addr: { fa: 'میرداماد، میدان مادر، پلاک ۳', en: 'No. 3, Madar Sq, Mirdamad' },
      about: { fa: 'رُست‌خانه‌ی قهوه سیاه دانه‌ها را مستقیم از مزرعه وارد و در محل رُست می‌کند و دانه‌ی تازه برای خانه هم می‌فروشد.',
               en: 'Black Bean sources directly from farms, roasts on site and sells freshly roasted beans to take home.' },
      tags: { fa: ['رُست‌خانه', 'قهوه دمی', 'دانه قهوه'], en: ['Roastery', 'Pour-over', 'Beans'] },
      amen: ['wifi', 'card', 'outdoor'], hours: { o: '07:30', c: '22:00', off: [] },
      menu: [m('کلدبرو', 'Cold brew', 130000, 1), m('قهوه دمی V60', 'V60 pour-over', 140000), m('دانه قهوه ۲۵۰ گرمی', 'Beans, 250 g', 690000)] },

    { id: 14, scene: 'pharmacy', cat: 'health', hood: 'vanak', lat: 35.75941, lng: 51.41068, price: 1, rating: 4.4, count: 256, verified: true,
      name: { fa: 'داروخانه‌ی شبانه‌روزی سینا', en: 'Sina 24h Pharmacy' }, phone: '021 8879 0010',
      addr: { fa: 'میدان ونک، ابتدای خیابان ملاصدرا', en: 'Vanak Sq, start of Mollasadra St' },
      about: { fa: 'داروخانه‌ی شبانه‌روزی سینا با دکتر داروساز در تمام ساعات، نسخه‌پیچی، مشاوره‌ی دارویی و ارسال دارو به منزل.',
               en: 'Sina is open around the clock with a pharmacist always on duty: prescriptions, medication advice and home delivery.' },
      tags: { fa: ['شبانه‌روزی', 'نسخه', 'ارسال'], en: ['24 hours', 'Prescriptions', 'Delivery'] },
      amen: ['card', 'delivery', 'wheelchair'], hours: { o: '00:00', c: '24:00', off: [] },
      menu: [m('مشاوره‌ی دارویی', 'Medication advice', 0), m('ارسال دارو به منزل', 'Home delivery', 60000, 1), m('فشارسنجی', 'Blood pressure check', 0)] },

    { id: 15, cat: 'shop', hood: 'jordan', lat: 35.76372, lng: 51.41825, price: 2, rating: 4.1, count: 119, verified: false,
      name: { fa: 'دیجیتال جردن', en: 'Jordan Digital' }, phone: '021 8866 5521',
      addr: { fa: 'خیابان جردن، مجتمع آفریقا، طبقه‌ی همکف', en: 'Ground floor, Africa Complex, Jordan St' },
      about: { fa: 'فروش لوازم جانبی موبایل و لپ‌تاپ با گارانتی معتبر و تعمیر سریع گوشی در همان روز.',
               en: 'Phone and laptop accessories with valid warranty, plus same-day phone repair.' },
      tags: { fa: ['موبایل', 'لوازم جانبی', 'تعمیر'], en: ['Phones', 'Accessories', 'Repairs'] },
      amen: ['card', 'parking'], hours: { o: '10:00', c: '22:00', off: [5] },
      menu: [m('هدفون بی‌سیم', 'Wireless earbuds', 4900000), m('شارژر سریع ۶۵ وات', '65 W fast charger', 890000, 1), m('تعویض صفحه‌ی گوشی', 'Screen replacement', 2500000)] },

    { id: 16, cat: 'auto', hood: 'punak', lat: 35.76577, lng: 51.32772, price: 2, rating: 4.6, count: 102, verified: true, isNew: true,
      name: { fa: 'کارواش و دیتیلینگ برق', en: 'Bargh Detailing' }, phone: '021 4432 1188',
      addr: { fa: 'پونک، بلوار عدل، پلاک ۶۰', en: 'No. 60, Adl Blvd, Punak' },
      about: { fa: 'کارواش و دیتیلینگ برق: شستشوی کامل دستی، پولیش چندمرحله‌ای و پوشش سرامیک با ضمانت.',
               en: 'Bargh offers a full hand wash, multi-stage polishing and guaranteed ceramic coating.' },
      tags: { fa: ['کارواش', 'پولیش', 'سرامیک'], en: ['Car wash', 'Polish', 'Ceramic coating'] },
      amen: ['parking', 'card', 'appoint'], hours: { o: '08:00', c: '20:00', off: [] },
      menu: [m('کارواش کامل', 'Full wash', 450000, 1), m('پولیش و واکس', 'Polish and wax', 2800000), m('پوشش سرامیک', 'Ceramic coating', 18000000)] },

    { id: 17, cat: 'food', hood: 'bazaar', lat: 35.67244, lng: 51.42276, price: 1, rating: 4.5, count: 276, verified: true,
      name: { fa: 'دیزی‌سرای گلنار', en: 'Golnar Dizi House' }, phone: '021 5562 3307',
      addr: { fa: 'بازار تهران، راسته‌ی بزازها، سرای گلنار', en: 'Golnar Caravanserai, Bazzazha Row, Tehran Bazaar' },
      about: { fa: 'دیزی‌سرای گلنار در سرایی مرمت‌شده در دل بازار، دیزی سنگی را آرام روی آتش ملایم می‌پزد و با نان سنگک تازه و ترشی خانگی سرو می‌کند. فقط ناهار.',
               en: 'In a restored caravanserai in the heart of the bazaar, Golnar slow-cooks dizi in stone pots and serves it with fresh sangak bread and homemade pickles. Lunch only.' },
      tags: { fa: ['دیزی', 'غذای سنتی', 'ناهار'], en: ['Dizi', 'Traditional', 'Lunch'] },
      amen: ['card', 'kids', 'ac'], hours: { o: '11:30', c: '16:30', off: [5] },
      menu: [m('دیزی سنگی', 'Stone-pot dizi', 260000, 1), m('کشک بادمجان', 'Kashk-e bademjan', 140000), m('شله‌زرد زعفرانی', 'Saffron sholeh zard', 60000, 1), m('دوغ محلی', 'Local doogh', 35000)] },

    { id: 18, cat: 'food', hood: 'shahrak', lat: 35.7592, lng: 51.37564, scene: 'pizza', price: 3, rating: 4.6, count: 198, verified: true,
      name: { fa: 'تراتوریا لاریتا', en: 'Trattoria Larita' }, phone: '021 8808 1934',
      addr: { fa: 'شهرک غرب، بلوار فرحزادی، خیابان زرافشان، پلاک ۴۰', en: 'No. 40, Zarafshan St, Farahzadi Blvd, Shahrak-e Gharb' },
      about: { fa: 'تراتوریا لاریتا پاستا را هر روز با دست و از آرد دوروم درست می‌کند و پیتزاها را در تنور هیزمی می‌پزد. شراب‌های بی‌الکل ایتالیایی و دسرهای خانگی هم دارد.',
               en: 'Larita makes its pasta by hand every day from durum flour and bakes its pizzas in a wood-fired oven, with homemade Italian desserts to finish.' },
      tags: { fa: ['ایتالیایی', 'پاستا', 'پیتزا هیزمی'], en: ['Italian', 'Fresh pasta', 'Wood-fired pizza'] },
      amen: ['reserve', 'card', 'outdoor', 'parking'], hours: { o: '12:30', c: '23:30', off: [] },
      menu: [m('پاستا کاربونارا', 'Spaghetti carbonara', 420000, 1), m('پیتزا مارگاریتا (هیزمی)', 'Wood-fired margherita', 380000, 1), m('ریزوتو قارچ', 'Mushroom risotto', 460000), m('تیرامیسو', 'Tiramisu', 180000)] },

    { id: 19, cat: 'cafe', hood: 'yousefabad', lat: 35.7341, lng: 51.39714, price: 1, rating: 4.6, count: 241, verified: false,
      name: { fa: 'کافه پنجره', en: 'Panjereh Café' }, phone: '021 8873 5520',
      addr: { fa: 'یوسف‌آباد، خیابان ابن‌سینا، کوچه‌ی سوم، پلاک ۱۲', en: 'No. 12, 3rd Alley, Ebn-e Sina St, Yousef Abad' },
      about: { fa: 'کافه‌ای نبش کوچه با پنجره‌های بزرگ چوبی که تا نیمه‌شب باز است. قفسه‌ای پر از بازی رومیزی، چیزکیک خانگی و چای ماسالای دم‌کرده دارد.',
               en: 'A corner café with tall wooden sash windows, open until midnight. Shelves of board games, homemade cheesecake and slow-brewed masala chai.' },
      tags: { fa: ['تا نیمه‌شب', 'بازی رومیزی', 'چیزکیک'], en: ['Open till midnight', 'Board games', 'Cheesecake'] },
      amen: ['wifi', 'card', 'ac', 'kids'], hours: { o: '09:00', c: '24:00', off: [] },
      menu: [m('لاته', 'Latte', 120000, 1), m('چای ماسالا', 'Masala chai', 95000), m('چیزکیک نیویورکی', 'New York cheesecake', 140000, 1), m('ساندویچ حلومی', 'Halloumi sandwich', 210000)] },

    { id: 20, cat: 'cafe', hood: 'saadat', lat: 35.78978, lng: 51.38427, scene: 'bakery', price: 2, rating: 4.7, count: 233, verified: true,
      name: { fa: 'نان و شیرینی زعفران', en: 'Zafaran Bakery & Café' }, phone: '021 2236 4471',
      addr: { fa: 'سعادت‌آباد، میدان کاج، خیابان سرو غربی، پلاک ۶', en: 'No. 6, West Sarv St, Kaj Sq, Saadat Abad' },
      about: { fa: 'شیرینی‌پزی‌ای با ترکیب طعم‌های ایرانی و فرانسوی؛ کروسان زعفرانی، نان ساوردو و کیک گردو هر روز صبح تازه از تنور بیرون می‌آیند.',
               en: 'A bakery blending Persian and French flavours: saffron croissants, sourdough and walnut cake come out of the oven fresh every morning.' },
      tags: { fa: ['شیرینی تازه', 'نان ساوردو', 'صبحانه'], en: ['Fresh pastry', 'Sourdough', 'Breakfast'] },
      amen: ['card', 'outdoor', 'wifi', 'delivery'], hours: { o: '07:00', c: '22:00', off: [] },
      menu: [m('کروسان زعفرانی', 'Saffron croissant', 85000, 1), m('نان ساوردو', 'Sourdough loaf', 160000), m('کیک گردو', 'Walnut cake', 120000), m('کاپوچینو', 'Cappuccino', 105000, 1)] },

    { id: 21, cat: 'auto', hood: 'ekbatan', lat: 35.70931, lng: 51.30741, price: 2, rating: 4.5, count: 88, verified: true,
      name: { fa: 'مرکز تایر و بالانس رهنورد', en: 'Rahnavard Tyre Centre' }, phone: '021 4469 2075',
      addr: { fa: 'اکباتان، بلوار نورزاد، روبروی فاز ۲', en: 'Nourzad Blvd, opposite Phase 2, Ekbatan' },
      about: { fa: 'فروش لاستیک از چند برند، تنظیم فرمان کامپیوتری و بالانس، و بررسی رایگان باد لاستیک. سالن انتظار با چای و اینترنت رایگان.',
               en: 'Tyres from several brands, computerised alignment and balancing, and free tyre-pressure checks. A waiting lounge with tea and free Wi-Fi.' },
      tags: { fa: ['لاستیک', 'تنظیم فرمان', 'بالانس'], en: ['Tyres', 'Wheel alignment', 'Balancing'] },
      amen: ['parking', 'card', 'appoint', 'wifi'], hours: { o: '08:30', c: '20:00', off: [5] },
      menu: [m('تنظیم فرمان کامپیوتری', 'Computerised alignment', 450000, 1), m('بالانس چهار چرخ', 'Four-wheel balancing', 380000), m('تعویض لاستیک (هر حلقه)', 'Tyre fitting (per tyre)', 150000), m('باد نیتروژن', 'Nitrogen inflation', 120000)] },

    { id: 22, scene: 'repair', cat: 'auto', hood: 'narmak', lat: 35.73528, lng: 51.50612, price: 1, rating: 4.7, count: 154, verified: false,
      name: { fa: 'برق خودرو کریمی', en: 'Karimi Auto Electric' }, phone: '021 7789 3316',
      addr: { fa: 'نارمک، میدان هفت حوض، خیابان آیت، پلاک ۷۲', en: 'No. 72, Ayat St, Haft Hoz Sq, Narmak' },
      about: { fa: 'کارگاه برق خودرویی که پدر و پسر اداره‌اش می‌کنند؛ باتری، دینام، استارت و عیب‌یابی با دیاگ، با قیمت اعلام‌شده پیش از شروع کار.',
               en: 'A father-and-son auto electric workshop for batteries, alternators, starters and diagnostics, with the price agreed before any work starts.' },
      tags: { fa: ['باتری', 'دینام و استارت', 'دیاگ'], en: ['Batteries', 'Starter & alternator', 'Diagnostics'] },
      amen: ['card', 'appoint'], hours: { o: '08:00', c: '19:00', off: [5] },
      menu: [m('عیب‌یابی با دیاگ', 'Diagnostic scan', 300000, 1), m('تعویض باتری (دستمزد)', 'Battery fitting (labour)', 100000), m('تعمیر دینام', 'Alternator repair', 900000), m('تعمیر استارت', 'Starter motor repair', 750000)] },

    { id: 23, cat: 'auto', hood: 'pasdaran', lat: 35.77514, lng: 51.46537, price: 2, rating: 4.4, count: 61, verified: true, isNew: true,
      name: { fa: 'مکانیک سیار رکاب', en: 'Rekab Mobile Mechanic' }, phone: '021 2259 0844',
      addr: { fa: 'خدمت در محل — دفتر: پاسداران، بوستان دوم', en: 'On-site service — office: 2nd Boostan St, Pasdaran' },
      about: { fa: 'مکانیک سیار رکاب در خانه یا محل کارتان تعویض روغن، باتری به باتری و تعمیرات سبک را انجام می‌دهد؛ شمال و شرق تهران، هر روز هفته.',
               en: 'Rekab comes to your home or office for oil changes, jump starts and light repairs across north and east Tehran, seven days a week.' },
      tags: { fa: ['خدمات در محل', 'تعویض روغن', 'امداد خودرو'], en: ['At your location', 'Oil change', 'Roadside help'] },
      amen: ['appoint', 'card'], hours: { o: '07:00', c: '22:00', off: [] },
      menu: [m('تعویض روغن در محل', 'On-site oil change', 350000, 1), m('باتری به باتری', 'Jump start', 250000), m('سرویس دوره‌ای', 'Periodic service', 1200000, 1), m('تعویض لنت', 'Brake pad change', 600000)] },

    { id: 24, cat: 'beauty', hood: 'vanak', lat: 35.75586, lng: 51.40816, price: 2, rating: 4.6, count: 207, verified: true,
      name: { fa: 'پیرایش مردانه شاه‌بیت', en: 'Shahbeyt Barbers' }, phone: '021 8860 4129',
      addr: { fa: 'ونک، خیابان ملاصدرا، پلاک ۸۸', en: 'No. 88, Mollasadra St, Vanak' },
      about: { fa: 'پیرایشگاه مردانه با کوتاهی کلاسیک و فید، اصلاح صورت با حوله‌ی داغ و فرم‌دهی ریش. صندلی را آنلاین رزرو کنید و بی‌معطلی بنشینید.',
               en: 'A barbershop for classic cuts and fades, hot-towel shaves and beard shaping. Book a chair online and sit down without waiting.' },
      tags: { fa: ['پیرایش مردانه', 'اصلاح صورت', 'فید'], en: ['Barber', 'Hot-towel shave', 'Fades'] },
      amen: ['appoint', 'card', 'ac', 'wifi'], hours: { o: '10:00', c: '21:30', off: [5] },
      menu: [m('کوتاهی مو', 'Haircut', 250000, 1), m('اصلاح با حوله‌ی داغ', 'Hot-towel shave', 180000), m('فرم‌دهی ریش', 'Beard shaping', 150000), m('پکیج کامل', 'Full package', 480000, 1)] },

    { id: 25, cat: 'beauty', hood: 'saadat', lat: 35.78602, lng: 51.38573, price: 2, rating: 4.8, count: 176, verified: false,
      name: { fa: 'استودیو ناخن لیلا', en: 'Lila Nail Studio' }, phone: '021 2214 7360',
      addr: { fa: 'سعادت‌آباد، خیابان علامه شمالی، پلاک ۱۱', en: 'No. 11, North Allameh St, Saadat Abad' },
      about: { fa: 'مانیکور، پدیکور، ژلیش و کاشت ناخن با وسایل استریل و طرح‌های به‌روز. قبل از هر نوبت، طرح را با شما هماهنگ می‌کنیم.',
               en: 'Manicures, pedicures, gel polish and extensions with sterilised tools and up-to-date designs, agreed with you before every appointment.' },
      tags: { fa: ['کاشت ناخن', 'ژلیش', 'مانیکور'], en: ['Nail extensions', 'Gel polish', 'Manicure'] },
      amen: ['appoint', 'card', 'ac'], hours: { o: '10:00', c: '20:00', off: [5] },
      menu: [m('مانیکور', 'Manicure', 300000), m('ژلیش', 'Gel polish', 450000, 1), m('کاشت ناخن', 'Nail extensions', 900000, 1), m('پدیکور', 'Pedicure', 400000)] },

    { id: 26, cat: 'beauty', hood: 'bazaar', lat: 35.67125, lng: 51.42369, scene: 'spa', price: 3, rating: 4.5, count: 94, verified: true,
      name: { fa: 'حمام سنتی سنگ سفید', en: 'Sang-e Sefid Hammam' }, phone: '021 5563 8021',
      addr: { fa: 'خیابان ۱۵ خرداد، کوچه‌ی حمام، پلاک ۳', en: 'No. 3, Hammam Alley, 15 Khordad St' },
      about: { fa: 'گرمابه‌ای قاجاری که با حفظ کاشی‌ها و طاق‌های اصلی به اسپا تبدیل شده؛ بخار، کیسه و سفیدآب، ماساژ و چای و دمنوش. روزهای جداگانه برای بانوان و آقایان.',
               en: 'A Qajar-era bathhouse turned spa with its original tiles and vaults: steam, traditional scrub, massage, then tea and herbal infusions. Separate days for women and men.' },
      tags: { fa: ['حمام سنتی', 'ماساژ', 'کیسه و سفیدآب'], en: ['Traditional hammam', 'Massage', 'Scrub'] },
      amen: ['appoint', 'card', 'ac'], hours: { o: '09:00', c: '21:00', off: [] },
      menu: [m('بخار و کیسه', 'Steam and scrub', 550000, 1), m('ماساژ ریلکسی (۶۰ دقیقه)', 'Relaxing massage (60 min)', 900000, 1), m('پکیج حمام سنتی', 'Hammam package', 1400000), m('دمنوش گیاهی', 'Herbal infusion', 60000)] },

    { id: 27, cat: 'home', hood: 'tehranpars', lat: 35.72742, lng: 51.51701, scene: 'repair', price: 2, rating: 4.5, count: 132, verified: true,
      name: { fa: 'لوله‌کشی و تأسیسات ۲۴', en: 'Plumbing 24' }, phone: '021 7731 2400',
      addr: { fa: 'تهرانپارس، خیابان رشید، خیابان ۱۹۶ شرقی', en: '196th East St, Rashid St, Tehranpars' },
      about: { fa: 'لوله‌کشی اضطراری شبانه‌روزی: نشتی، گرفتگی لوله، آبگرمکن و پکیج. در شرق تهران کمتر از یک ساعت می‌رسیم و قبل از کار قیمت را اعلام می‌کنیم.',
               en: 'Emergency plumbing day and night: leaks, blocked drains, water heaters and boilers. We reach east Tehran in under an hour and quote before we start.' },
      tags: { fa: ['لوله‌کشی', 'رفع گرفتگی', 'آبگرمکن'], en: ['Plumbing', 'Drain unblocking', 'Water heaters'] },
      amen: ['appoint', 'card'], hours: { o: '00:00', c: '24:00', off: [] },
      menu: [m('بازدید و عیب‌یابی', 'Visit and diagnosis', 250000, 1), m('رفع گرفتگی لوله', 'Drain unblocking', 600000, 1), m('تعمیر آبگرمکن', 'Water heater repair', 750000), m('سرویس پکیج', 'Boiler service', 900000)] },

    { id: 28, cat: 'home', hood: 'yousefabad', lat: 35.73226, lng: 51.40365, scene: 'repair', price: 2, rating: 4.6, count: 85, verified: false,
      name: { fa: 'خدمات برق ساختمان نور', en: 'Noor Electric Services' }, phone: '021 8890 6612',
      addr: { fa: 'یوسف‌آباد، خیابان اسدآبادی، کوچه‌ی ۴۷', en: '47th Alley, Asadabadi St, Yousef Abad' },
      about: { fa: 'برق‌کاران دارای پروانه برای سیم‌کشی، پریز و کلید، نورپردازی و نوسازی تابلو برق؛ پیش‌فاکتور کتبی قبل از کار و شش ماه ضمانت.',
               en: 'Licensed electricians for wiring, sockets, lighting and fuse-board upgrades, with a written quote before work and a six-month guarantee.' },
      tags: { fa: ['برق ساختمان', 'نصب لوستر', 'تابلو برق'], en: ['Wiring', 'Lighting installs', 'Fuse boards'] },
      amen: ['appoint', 'card'], hours: { o: '08:00', c: '20:00', off: [5] },
      menu: [m('بازدید و پیش‌فاکتور', 'Visit and quote', 200000), m('نصب لوستر', 'Chandelier installation', 450000, 1), m('تعویض پریز و کلید', 'Socket or switch replacement', 120000), m('نوسازی تابلو برق', 'Fuse-board upgrade', 2500000)] },

    { id: 29, cat: 'home', hood: 'mirdamad', lat: 35.76006, lng: 51.42422, price: 1, rating: 4.3, count: 167, verified: true,
      name: { fa: 'خشکشویی پاکان', en: 'Pakan Dry Cleaning' }, phone: '021 2292 3318',
      addr: { fa: 'میرداماد، خیابان شنگرف، پلاک ۵', en: 'No. 5, Shangarf St, Mirdamad' },
      about: { fa: 'خشکشویی، اتوشویی، پرده و فرش با پیک رایگان در شمال تهران. سرویس فوری ۲۴ ساعته برای لباس‌های مجلسی.',
               en: 'Dry cleaning, ironing, curtains and rugs with free pickup and delivery in north Tehran, plus a 24-hour express service for formal wear.' },
      tags: { fa: ['خشکشویی', 'اتوشویی', 'پیک رایگان'], en: ['Dry cleaning', 'Ironing', 'Free pickup'] },
      amen: ['delivery', 'card'], hours: { o: '08:00', c: '21:00', off: [5] },
      menu: [m('خشکشویی کت‌وشلوار', 'Suit dry cleaning', 250000, 1), m('اتوی پیراهن', 'Shirt ironing', 60000, 1), m('شست‌وشوی پرده (هر متر)', 'Curtain cleaning (per metre)', 90000), m('سرویس فوری ۲۴ ساعته', '24-hour express', 120000)] },

    { id: 30, cat: 'home', hood: 'niavaran', lat: 35.81455, lng: 51.46736, scene: 'flowers', price: 2, rating: 4.7, count: 58, verified: true, isNew: true,
      name: { fa: 'باغبانی سبزینه', en: 'Sabzineh Garden Care' }, phone: '021 2230 1157',
      addr: { fa: 'نیاوران، خیابان مژده، پلاک ۲۲', en: 'No. 22, Mojdeh St, Niavaran' },
      about: { fa: 'طراحی و نگهداری باغ و بالکن، هرس درختان، چمن و نصب آبیاری قطره‌ای؛ با برنامه‌های نگهداری فصلی.',
               en: 'Garden and balcony design and care, tree pruning, lawns and drip irrigation, with seasonal maintenance plans.' },
      tags: { fa: ['باغبانی', 'طراحی فضای سبز', 'آبیاری قطره‌ای'], en: ['Gardening', 'Landscaping', 'Drip irrigation'] },
      amen: ['appoint', 'card'], hours: { o: '07:00', c: '18:00', off: [5] },
      menu: [m('بازدید و مشاوره', 'Visit and advice', 300000), m('هرس درختان', 'Tree pruning', 800000, 1), m('طراحی بالکن سبز', 'Balcony garden design', 3500000, 1), m('نصب آبیاری قطره‌ای', 'Drip irrigation install', 2200000)] },

    { id: 31, cat: 'health', hood: 'shahrak', lat: 35.76038, lng: 51.37458, price: 2, rating: 4.5, count: 189, verified: true,
      name: { fa: 'کلینیک خانواده نیلوفر', en: 'Niloufar Family Clinic' }, phone: '021 8836 7740',
      addr: { fa: 'شهرک غرب، بلوار دادمان، پلاک ۱۴', en: 'No. 14, Dadman Blvd, Shahrak-e Gharb' },
      about: { fa: 'پزشک عمومی، متخصص اطفال، آزمایشگاه و واکسیناسیون زیر یک سقف؛ تا ساعت ۲۲ باز است و با بیشتر بیمه‌های تکمیلی کار می‌کند.',
               en: 'GPs, a paediatrician, lab tests and vaccinations under one roof. Open until 10pm and works with most supplementary insurers.' },
      tags: { fa: ['پزشک عمومی', 'اطفال', 'آزمایشگاه'], en: ['GP', 'Paediatrics', 'Lab tests'] },
      amen: ['appoint', 'card', 'wheelchair', 'kids', 'ac'], hours: { o: '08:00', c: '22:00', off: [] },
      menu: [m('ویزیت پزشک عمومی', 'GP visit', 250000, 1), m('ویزیت متخصص اطفال', 'Paediatrician visit', 450000), m('چکاپ کامل', 'Full check-up', 1800000, 1), m('تزریقات', 'Injections', 80000)] },

    { id: 32, cat: 'health', hood: 'jordan', lat: 35.76114, lng: 51.41559, price: 3, rating: 4.8, count: 121, verified: true,
      name: { fa: 'فیزیوتراپی حرکت', en: 'Harekat Physiotherapy' }, phone: '021 2201 5583',
      addr: { fa: 'جردن، خیابان طاهری، ساختمان پزشکان سپید، طبقه‌ی ۳', en: '3rd floor, Sepid Medical Building, Taheri St, Jordan' },
      about: { fa: 'درمان آسیب‌های ورزشی، کمردرد و گردن‌درد و توان‌بخشی پس از جراحی با دستگاه‌های روز و برنامه‌ی تمرینی شخصی.',
               en: 'Treatment for sports injuries, back and neck pain, and post-surgery rehab with modern equipment and a personal exercise plan.' },
      tags: { fa: ['فیزیوتراپی', 'آسیب ورزشی', 'کمردرد'], en: ['Physiotherapy', 'Sports injuries', 'Back pain'] },
      amen: ['appoint', 'card', 'wheelchair', 'parking'], hours: { o: '08:00', c: '21:00', off: [5] },
      menu: [m('جلسه‌ی فیزیوتراپی', 'Physio session', 650000, 1), m('ارزیابی اولیه', 'Initial assessment', 400000), m('شاک‌ویو', 'Shockwave therapy', 900000), m('پکیج ۱۰ جلسه', '10-session package', 5800000, 1)] },

    { id: 33, cat: 'health', hood: 'tajrish', lat: 35.80432, lng: 51.43285, scene: 'pharmacy', price: 2, rating: 4.6, count: 97, verified: false,
      name: { fa: 'عینک نورا', en: 'Noora Optics' }, phone: '021 2271 9036',
      addr: { fa: 'تجریش، خیابان شهرداری، پاساژ ارغوان، طبقه‌ی همکف', en: 'Ground floor, Arghavan Arcade, Shahrdari St, Tajrish' },
      about: { fa: 'معاینه‌ی رایگان چشم با هر خرید، فریم‌های متنوع، آماده‌سازی عدسی در ۴۸ ساعت و تجویز لنز طبی.',
               en: 'A free eye test with every purchase, a wide range of frames, lenses ready in 48 hours and contact lens fitting.' },
      tags: { fa: ['عینک طبی', 'عینک آفتابی', 'لنز'], en: ['Prescription glasses', 'Sunglasses', 'Contact lenses'] },
      amen: ['card', 'appoint'], hours: { o: '10:00', c: '21:30', off: [5] },
      menu: [m('عینک طبی کامل (از)', 'Complete glasses (from)', 2500000, 1), m('عدسی بلوکات', 'Blue-light lenses', 1200000), m('لنز طبی ماهانه', 'Monthly contact lenses', 900000), m('تعمیر فریم', 'Frame repair', 150000)] },

    { id: 34, cat: 'shop', hood: 'ekbatan', lat: 35.70899, lng: 51.30369, scene: 'flowers', price: 2, rating: 4.7, count: 143, verified: true,
      name: { fa: 'گل‌فروشی بهارنارنج', en: 'Baharnaranj Flowers' }, phone: '021 4467 1209',
      addr: { fa: 'اکباتان، مرکز خرید فاز ۱، طبقه‌ی همکف', en: 'Ground floor, Phase 1 Shopping Centre, Ekbatan' },
      about: { fa: 'گل تازه‌ی روز، دسته‌گل و باکس گل، گلدان آپارتمانی و تزیین مراسم؛ ارسال همان روز به سراسر تهران.',
               en: 'Fresh flowers daily, bouquets and flower boxes, house plants and event decoration, with same-day delivery across Tehran.' },
      tags: { fa: ['دسته‌گل', 'گل تازه', 'ارسال همان روز'], en: ['Bouquets', 'Fresh flowers', 'Same-day delivery'] },
      amen: ['delivery', 'card'], hours: { o: '09:00', c: '23:00', off: [] },
      menu: [m('دسته‌گل رز', 'Rose bouquet', 650000, 1), m('باکس گل', 'Flower box', 950000, 1), m('گلدان آپارتمانی', 'House plant', 450000), m('تزیین ماشین عروس', 'Wedding car decoration', 4500000)] },

    { id: 35, cat: 'shop', hood: 'enghelab', lat: 35.69799, lng: 51.38998, price: 1, rating: 4.8, count: 312, verified: true,
      name: { fa: 'کتاب‌فروشی ورق', en: 'Varagh Books' }, phone: '021 6640 2287',
      addr: { fa: 'خیابان انقلاب، روبروی دانشگاه تهران، پلاک ۱۲۶۰', en: 'No. 1260, Enghelab St, opposite the University of Tehran' },
      about: { fa: 'سه طبقه کتاب فارسی و انگلیسی، گوشه‌ی کتاب دست‌دوم و نوشت‌افزار دست‌ساز. پنجشنبه‌ها جلسه‌ی کتاب‌خوانی برگزار می‌شود.',
               en: 'Three floors of Persian and English books, a second-hand corner and handmade stationery, with readings every Thursday.' },
      tags: { fa: ['کتاب', 'کتاب دست‌دوم', 'نوشت‌افزار'], en: ['Books', 'Second-hand', 'Stationery'] },
      amen: ['card', 'wifi', 'ac'], hours: { o: '09:00', c: '21:00', off: [] },
      menu: [m('رمان (میانگین قیمت)', 'Novel (average price)', 350000), m('کتاب دست‌دوم (از)', 'Second-hand book (from)', 90000, 1), m('دفتر دست‌ساز', 'Handmade notebook', 140000, 1), m('کارت هدیه', 'Gift card', 500000)] },

    { id: 36, cat: 'shop', hood: 'bazaar', lat: 35.67201, lng: 51.41998, price: 1, rating: 4.4, count: 205, verified: false,
      name: { fa: 'عطاری باران', en: 'Baran Herbal Shop' }, phone: '021 5561 4490',
      addr: { fa: 'بازار تهران، بازار عباس‌آباد، پلاک ۱۹', en: 'No. 19, Abbas Abad Bazaar, Tehran Bazaar' },
      about: { fa: 'گیاهان دارویی، ادویه، زعفران، خشکبار و دمنوش؛ همه کنترل کیفیت می‌شوند و تازه بسته‌بندی می‌شوند.',
               en: 'Medicinal herbs, spices, saffron, dried fruit and herbal teas, all quality-checked and freshly packed.' },
      tags: { fa: ['ادویه', 'زعفران', 'دمنوش'], en: ['Spices', 'Saffron', 'Herbal tea'] },
      amen: ['card', 'delivery'], hours: { o: '09:00', c: '19:00', off: [5] },
      menu: [m('زعفران (یک مثقال)', 'Saffron (4.6 g)', 1100000, 1), m('ادویه‌ی مخصوص (۱۰۰ گرم)', 'House spice mix (100 g)', 120000), m('دمنوش آرامش', 'Calming herbal tea', 90000, 1), m('گل گاوزبان', 'Borage flowers', 150000)] },

    { id: 37, cat: 'fitness', hood: 'punak', lat: 35.76114, lng: 51.32652, scene: 'yoga', price: 2, rating: 4.8, count: 134, verified: true,
      name: { fa: 'استودیو یوگا آوند', en: 'Avand Yoga Studio' }, phone: '021 4458 3361',
      addr: { fa: 'پونک، بلوار عدل، خیابان بهاران، پلاک ۹', en: 'No. 9, Baharan St, Adl Blvd, Punak' },
      about: { fa: 'کلاس‌های هاتا و وینیاسا برای همه‌ی سطوح، مدیتیشن صبحگاهی و کارگاه‌های آخر هفته. مت و وسایل در استودیو هست.',
               en: 'Hatha and vinyasa classes for every level, morning meditation and weekend workshops. Mats and props are provided.' },
      tags: { fa: ['یوگا', 'مدیتیشن', 'همه‌ی سطوح'], en: ['Yoga', 'Meditation', 'All levels'] },
      amen: ['appoint', 'card', 'ac'], hours: { o: '07:00', c: '21:00', off: [5] },
      menu: [m('جلسه‌ی تکی', 'Single class', 280000), m('کارت ۱۰ جلسه', '10-class card', 2400000, 1), m('کارگاه آخر هفته', 'Weekend workshop', 650000), m('کلاس مدیتیشن', 'Meditation class', 200000)] },

    { id: 38, cat: 'fitness', hood: 'tehranpars', lat: 35.72537, lng: 51.52205, price: 2, rating: 4.6, count: 112, verified: true,
      name: { fa: 'باشگاه فانکشنال هیرکان', en: 'Hirkan Functional Training' }, phone: '021 7788 6402',
      addr: { fa: 'تهرانپارس، فلکه‌ی اول، خیابان جشنواره، پلاک ۴۱', en: 'No. 41, Jashnvareh St, First Circle, Tehranpars' },
      about: { fa: 'کلاس‌های گروهی کوچک فانکشنال و HIIT، آموزش وزنه‌برداری و آنالیز ترکیب بدن هر ماه برای پیگیری پیشرفت.',
               en: 'Small-group functional and HIIT classes, weightlifting coaching and a monthly body-composition scan to track progress.' },
      tags: { fa: ['فانکشنال', 'HIIT', 'وزنه‌برداری'], en: ['Functional', 'HIIT', 'Weightlifting'] },
      amen: ['card', 'parking', 'ac', 'appoint'], hours: { o: '06:00', c: '22:30', off: [] },
      menu: [m('جلسه‌ی آزمایشی', 'Trial class', 150000), m('شهریه‌ی ماهانه (۱۲ جلسه)', 'Monthly (12 classes)', 2200000, 1), m('جلسه‌ی خصوصی', 'Personal session', 600000), m('آنالیز بدن', 'Body scan', 200000)] },

    { id: 39, cat: 'fitness', hood: 'ekbatan', lat: 35.70586, lng: 51.30529, price: 2, rating: 4.7, count: 89, verified: false, isNew: true,
      name: { fa: 'سالن سنگ‌نوردی بام', en: 'Bam Climbing Gym' }, phone: '021 4465 7718',
      addr: { fa: 'اکباتان، خیابان سازمان آب، مجموعه‌ی ورزشی، طبقه‌ی منفی یک', en: 'Basement, Sports Complex, Sazman-e Ab St, Ekbatan' },
      about: { fa: 'دیواره‌های بولدرینگ با مسیرهای تازه در هر هفته، دوره‌ی مبتدی، اجاره‌ی تجهیزات و باشگاه سنگ‌نوردی کودکان.',
               en: 'Bouldering walls with new routes every week, beginner courses, gear rental and a kids’ climbing club.' },
      tags: { fa: ['بولدرینگ', 'دوره‌ی مبتدی', 'اجاره‌ی تجهیزات'], en: ['Bouldering', 'Beginner courses', 'Gear rental'] },
      amen: ['card', 'kids', 'parking', 'appoint'], hours: { o: '09:00', c: '23:00', off: [] },
      menu: [m('ورودی روزانه', 'Day pass', 250000, 1), m('دوره‌ی مبتدی (۴ جلسه)', 'Beginner course (4 sessions)', 1600000, 1), m('اجاره‌ی کفش', 'Shoe rental', 80000), m('کلاس کودکان', 'Kids’ class', 900000)] },

    { id: 40, cat: 'fitness', hood: 'narmak', lat: 35.7341, lng: 51.50851, scene: 'yoga', price: 3, rating: 4.8, count: 76, verified: true,
      name: { fa: 'استودیو پیلاتس رها', en: 'Raha Pilates Studio' }, phone: '021 7792 0153',
      addr: { fa: 'نارمک، خیابان گلبرگ غربی، پلاک ۱۸۴', en: 'No. 184, West Golbarg St, Narmak' },
      about: { fa: 'پیلاتس ریفورمر و مت در گروه‌های حداکثر شش نفره، با برنامه‌های ویژه‌ی بعد از زایمان و مراقبت از کمر.',
               en: 'Reformer and mat Pilates in groups of six at most, with dedicated postnatal and back-care programmes.' },
      tags: { fa: ['پیلاتس', 'ریفورمر', 'کلاس کوچک'], en: ['Pilates', 'Reformer', 'Small groups'] },
      amen: ['appoint', 'card', 'ac'], hours: { o: '07:00', c: '21:00', off: [5] },
      menu: [m('جلسه‌ی ریفورمر', 'Reformer class', 550000, 1), m('پکیج ۸ جلسه', '8-class package', 3900000, 1), m('کلاس مت', 'Mat class', 300000), m('جلسه‌ی خصوصی', 'Private session', 900000)] }
  ];

  const users = [
    ['u1', 'سارا محمدی', 'Sara Mohammadi'], ['u2', 'علی رضایی', 'Ali Rezaei'], ['u3', 'نگار احمدی', 'Negar Ahmadi'],
    ['u4', 'مهدی کریمی', 'Mahdi Karimi'], ['u5', 'پریسا حسینی', 'Parisa Hosseini'], ['u6', 'امیر جعفری', 'Amir Jafari'],
    ['u7', 'مریم صادقی', 'Maryam Sadeghi'], ['u8', 'رضا نوری', 'Reza Nouri'], ['u9', 'الناز کاظمی', 'Elnaz Kazemi'],
    ['u10', 'حامد موسوی', 'Hamed Mousavi'], ['u11', 'شیما رحیمی', 'Shima Rahimi'], ['u12', 'کاوه طاهری', 'Kaveh Taheri']
  ].map(([id, fa, en], i) => ({
    id, name: { fa, en }, phone: '0912' + String(3100000 + i * 73519).slice(0, 7), role: 'user', status: 'active',
    joined: now - (40 + i * 37) * DAY, color: i % 8, email: ''
  }));
  users.push(
    { id: 'u-demo', name: { fa: 'آرش کیانی', en: 'Arash Kiani' }, phone: '09121234567', role: 'user', status: 'active', joined: now - 210 * DAY, color: 1, email: 'arash@example.com' },
    { id: 'u-owner', name: { fa: 'نسیم رستمی', en: 'Nasim Rostami' }, phone: '09127654321', role: 'owner', status: 'active', joined: now - 400 * DAY, color: 3, email: 'nasim@example.com', bizIds: [2] },
    { id: 'u-admin', name: { fa: 'مدیر سامانه', en: 'Platform admin' }, phone: '09120000000', role: 'admin', status: 'active', joined: now - 700 * DAY, color: 0, email: 'admin@example.com' }
  );

  // A distinct illustration look (palette and mirroring) for every place that shares a scene.
  const lookCount = {};
  businesses.forEach(b => { const k = b.scene || b.cat; b.look = lookCount[k] = (lookCount[k] == null ? 0 : lookCount[k] + 1); });

  // The first review of each place talks about that place specifically; the next two come from its category.
  const RV1 = {
    1: [5, 'کباب کوبیده‌شون واقعاً آبدار بود و برنج زعفرونی عطر فوق‌العاده‌ای داشت. شب‌ها حیاط با موسیقی زنده خیلی دلنشینه.', 'The koobideh was really juicy and the saffron rice smelled wonderful. The courtyard with live music is lovely at night.'],
    2: [5, 'قهوه‌ها رو خودشون رُست می‌کنن و فرقش کاملاً معلومه. فلت‌وایت عالی بود و کیک هویج هم تازه.', 'They roast their own beans and you can taste it. The flat white was excellent and the carrot cake was fresh.'],
    3: [5, 'تعویض روغن رو کمتر از نیم ساعت انجام دادن و فیلتر اصلی رو هم نشونم دادن. خیلی شفاف کار می‌کنن.', 'The oil change took under half an hour and they showed me the genuine filter. Very transparent.'],
    4: [5, 'رنگ مو دقیقاً همونی شد که می‌خواستم. قبل از شروع کامل مشاوره دادن و نتیجه عالی بود.', 'My hair colour came out exactly as I wanted. They gave a full consultation first and the result was great.'],
    5: [5, 'دو نفر اومدن و خونه رو کامل و دقیق تمیز کردن، حتی پشت یخچال رو. حتماً دوباره دعوتشون می‌کنم.', 'Two people came and cleaned the whole flat thoroughly, even behind the fridge. I will book again.'],
    6: [5, 'دکتر با حوصله همه‌چیز رو توضیح داد و عصب‌کشی کاملاً بدون درد انجام شد.', 'The dentist explained everything patiently and the root canal was completely painless.'],
    7: [5, 'ساعت یک شب رفتیم و هنوز کباب برگشون داغ و تازه بود. بهترین گزینه بعد از کوه‌گردی دربند.', 'We went at 1am and the barg kebab was still hot and fresh. The best option after a Darband hike.'],
    8: [5, 'بین قفسه‌های کتاب با یه فنجون قهوه نشستن حس خیلی خوبی داره. برای درس خوندن عالیه.', 'Sitting among the bookshelves with a coffee feels great. Perfect for studying.'],
    9: [5, 'کارهای اصیل و باکیفیت دارن؛ یه کاشی میناکاری برای هدیه خریدم که همه عاشقش شدن.', 'Authentic, high-quality pieces. I bought an enamel tile as a gift and everyone loved it.'],
    10: [4, 'دستگاه‌ها نو و تمیزن و مربی‌ها برای برنامه‌ی تمرینی وقت می‌ذارن، فقط عصرها شلوغه.', 'The machines are new and clean and the coaches take time over your plan; it just gets busy in the evenings.'],
    11: [4, 'خمیر پیتزاشون نازک و ترده و پنیرش شور نیست. ارسالش هم سریع بود.', 'A thin, crisp crust and cheese that is not too salty. Delivery was quick too.'],
    12: [5, 'ماساژ سنگ داغ واقعاً همه‌ی خستگی هفته رو برد. محیط آروم و خیلی تمیزه.', 'The hot stone massage took away a whole week of stress. Calm and spotless.'],
    13: [5, 'قهوه‌ی دمی‌شون با دانه‌ی اتیوپی فوق‌العاده بود و باریستا کامل درباره‌اش توضیح داد.', 'Their Ethiopian pour-over was outstanding and the barista explained it in detail.'],
    14: [5, 'نصف شب دارو لازم داشتیم و کمتر از یک ساعت رسید. پرسنل هم با حوصله راهنمایی کردن.', 'We needed medicine in the middle of the night and it arrived in under an hour. The staff were patient and helpful.'],
    15: [4, 'قیمت لپ‌تاپ‌ها منصفانه بود و گارانتی معتبر داشتن. فقط پارک کردن جلوش سخته.', 'Fair laptop prices with a proper warranty. Parking out front is tricky though.'],
    16: [5, 'پولیش و سرامیک ماشینم مثل روز اول برق می‌زنه. کارشون تمیز و دقیقه.', 'After the polish and ceramic coating my car shines like new. Clean, careful work.'],
    17: [5, 'دیزی سنگی‌شون با نون سنگک تازه واقعاً اصیل بود. فضای سرای قدیمی هم حس خوبی داره.', 'The stone-pot dizi with fresh sangak was the real thing, and the old caravanserai has great atmosphere.'],
    18: [5, 'پاستا کاربونارا دقیقاً طعم ایتالیا رو داشت؛ خمیر تازه و سس اصیل.', 'The carbonara tasted just like Italy: fresh pasta and a properly made sauce.'],
    19: [5, 'تا نیمه‌شب بازه و کلی بازی رومیزی داره. با دوستام کلی خندیدیم و چیزکیکش هم عالی بود.', 'Open until midnight with lots of board games. We had a great laugh and the cheesecake was excellent.'],
    20: [5, 'کروسان زعفرانی‌شون معرکه‌ست و صبح‌ها نون ساوردو داغ از تنور درمیاد.', 'The saffron croissant is superb and the sourdough comes out of the oven hot every morning.'],
    21: [5, 'تنظیم فرمان کامپیوتری انجام دادن و لرزش فرمان کاملاً برطرف شد. سالن انتظارشون هم راحته.', 'They did a computerised alignment and the steering wobble is completely gone. Comfortable waiting room too.'],
    22: [5, 'ماشینم استارت نمی‌خورد، با دیاگ سریع ایراد رو پیدا کردن و هزینه رو قبلش گفتن.', 'My car would not start; they found the fault quickly with diagnostics and quoted the price first.'],
    23: [4, 'صبح زود جلوی خونه باتری‌ام رو عوض کردن و لازم نشد ماشین رو جایی ببرم.', 'They replaced my battery outside my house early in the morning, no need to take the car anywhere.'],
    24: [5, 'فید رو خیلی تمیز زد و اصلاح با حوله‌ی داغ تجربه‌ی جدیدی بود. نوبت آنلاین هم سر وقت بود.', 'A very clean fade, and the hot-towel shave was a treat. The online booking was right on time.'],
    25: [5, 'ژلیشم بیشتر از سه هفته سالم موند. وسایلشون استریله و طرح‌ها خیلی شیکه.', 'My gel polish lasted over three weeks. Sterilised tools and really stylish designs.'],
    26: [5, 'کیسه و بخار توی یه حمام قاجاری واقعی! بعدش چای و دمنوش دادن، تجربه‌ای فراموش‌نشدنی بود.', 'Steam and a scrub in a real Qajar bathhouse, followed by herbal tea. Unforgettable.'],
    27: [5, 'ساعت ۱۱ شب لوله ترکید و در کمتر از یک ساعت رسیدن. کار تمیز و قیمت منصفانه.', 'A pipe burst at 11pm and they arrived in under an hour. Tidy work at a fair price.'],
    28: [5, 'قبل از کار پیش‌فاکتور دادن و نصب لوسترها رو خیلی تمیز انجام دادن.', 'They gave a written quote first and installed our chandeliers very neatly.'],
    29: [4, 'پیک رایگانشون خیلی کاربردیه؛ کت‌وشلوارم مرتب و سر وقت برگشت.', 'The free pickup is really handy; my suit came back neat and on time.'],
    30: [5, 'بالکن خالی‌مون رو تبدیل به یه باغچه‌ی کوچیک کردن و آبیاری قطره‌ای هم نصب کردن.', 'They turned our empty balcony into a little garden and installed drip irrigation.'],
    31: [5, 'عصر بچه‌ام تب کرد و بدون معطلی ویزیت شد. آزمایش رو هم همون‌جا گرفتن.', 'My child had a fever in the evening and was seen without a wait. They did the lab test on site too.'],
    32: [5, 'بعد از آسیب زانو توی فوتبال، با برنامه‌ی تمرینی‌شون تو شش هفته برگشتم زمین.', 'After a football knee injury their programme had me back on the pitch in six weeks.'],
    33: [5, 'معاینه‌ی چشم دقیق بود و عینکم دو روزه آماده شد. فریم‌ها هم تنوع خوبی دارن.', 'A thorough eye test and my glasses were ready in two days. A good choice of frames.'],
    34: [5, 'دسته‌گل رز برای تولد مادرم همون روز رسید و از عکس هم قشنگ‌تر بود.', 'The rose bouquet for my mum’s birthday arrived the same day and looked even better than the photo.'],
    35: [5, 'سه طبقه کتاب و یه گوشه‌ی دست‌دوم که می‌شه ساعت‌ها توش گشت. پنجشنبه‌ها جلسه‌ی کتاب‌خوانی هم دارن.', 'Three floors of books and a second-hand corner you can browse for hours, plus Thursday readings.'],
    36: [4, 'زعفرون و ادویه‌هاشون تازه‌ست و دمنوش آرامششون واقعاً کمک کرد. فقط شلوغه.', 'Fresh saffron and spices, and their calming tea really helped. It does get crowded.'],
    37: [5, 'کلاس‌های صبحگاهی‌شون روزم رو عوض کرده. مربی‌ها به تازه‌کارها خیلی توجه می‌کنن.', 'Their morning classes have changed my days. The teachers look after beginners really well.'],
    38: [5, 'کلاس‌های گروهی پرانرژیه و مربی حرکات رو دونه‌دونه اصلاح می‌کنه. آنالیز بدن ماهانه هم انگیزه می‌ده.', 'High-energy group classes and the coach corrects every movement. The monthly body scan keeps you motivated.'],
    39: [5, 'هر هفته مسیرهای جدید می‌زنن و دوره‌ی مبتدی‌اش خیلی خوب بود. برای بچه‌ها هم برنامه دارن.', 'New routes every week and the beginner course was great. They have a kids’ club too.'],
    40: [5, 'کلاس‌ها حداکثر شش نفره‌ست و مربی دقیق کار می‌کنه. کمردردم خیلی بهتر شده.', 'Classes are six people at most and the coach is precise. My back pain is much better.']
  };
  const pools = {
    food: [
      [4, 'غذا خوب بود ولی آخر هفته شلوغه و حدود ۲۰ دقیقه منتظر میز موندیم. پیشنهاد می‌کنم رزرو کنید.', 'Good food, but weekends are busy and we waited about 20 minutes for a table. Book ahead.'],
      [5, 'پرسنل خیلی مؤدب بودن و سفارش سریع رسید. قیمت‌ها نسبت به کیفیت منصفانه‌ست.', 'Staff were very polite and the order came quickly. Fair prices for the quality.'],
      [3, 'طعم غذا معمولی بود و کمی سرد به دستمون رسید. انتظار بیشتری داشتم.', 'The food was average and arrived a little cold. I expected more.']
    ],
    cafe: [
      [5, 'جای دنج و آرومیه برای کار با لپ‌تاپ؛ پریز کنار میزها هست و اینترنتش هم سرعت خوبی داره.', 'A quiet, cosy spot for laptop work; there are sockets by the tables and the Wi-Fi is fast.'],
      [4, 'قهوه خوب بود ولی عصرها پیدا کردن جای پارک سخته.', 'Good coffee, but parking is hard to find in the evenings.'],
      [4, 'منو محدوده ولی هر چی سفارش دادیم کیفیت خوبی داشت.', 'A small menu, but everything we ordered was good quality.']
    ],
    auto: [
      [5, 'نوبت آنلاین گرفتم و سر ساعت کارم رو شروع کردن. قیمت هم قبل از کار اعلام شد.', 'I booked online and they started right on time. The price was quoted before any work.'],
      [4, 'کارشون خوبه ولی سالن انتظارشون کوچیکه و جای نشستن کمه.', 'Good work, but the waiting area is small with few seats.']
    ],
    beauty: [
      [5, 'محیط خیلی تمیز و بهداشتیه و وسایل یک‌بار مصرف استفاده می‌کنن.', 'Very clean and hygienic, and they use single-use tools.'],
      [4, 'کیفیت کار عالیه ولی برای نوبت باید از چند روز قبل هماهنگ کنید.', 'Great quality, but you need to book a few days ahead.']
    ],
    home: [
      [4, 'سر وقت رسیدن و بعد از کار همه‌جا رو تمیز تحویل دادن.', 'They arrived on time and left everything clean afterwards.'],
      [4, 'کار خوب بود ولی هماهنگی تلفنی کمی طول کشید.', 'Good job, though arranging it by phone took a while.']
    ],
    health: [
      [5, 'محیط مدرن و تمیزه و پذیرش هم برخورد خیلی خوبی داره.', 'A modern, clean place and the front desk staff are very friendly.'],
      [4, 'هزینه‌ها کمی بالاست ولی کیفیت کار ارزشش رو داره.', 'A bit pricey, but the quality is worth it.']
    ],
    shop: [
      [5, 'فروشنده درباره‌ی هر محصول کامل توضیح داد و بسته‌بندی هدیه هم رایگان بود.', 'The seller explained each item in detail and gift wrapping was free.'],
      [3, 'تنوع خوبه ولی بعضی اجناس قیمت بالایی دارن.', 'Good variety, though some items are expensive.']
    ],
    fitness: [
      [5, 'ساعت کاریش عالیه؛ صبح زود بازه و قبل از کار می‌تونم برم.', 'Great hours: it opens early so I can go before work.'],
      [3, 'عصرها خیلی شلوغ می‌شه و باید منتظر بمونی.', 'It gets crowded in the evenings and you have to wait.']
    ]
  };
  const replies = {
    thanks: { fa: 'ممنون از لطفتون! خوشحالیم که تجربه‌ی خوبی داشتید و منتظر دیدار دوباره‌تون هستیم.', en: 'Thank you! We are glad you had a great time and hope to see you again soon.' },
    fix: { fa: 'ممنون از بازخورد صادقانه‌تون. این مورد رو با تیم بررسی کردیم و برای بهتر شدنش برنامه داریم.', en: 'Thanks for the honest feedback. We have discussed it with the team and are working on it.' }
  };

  const reviews = [];
  businesses.forEach((b, i) => {
    const pool = pools[b.cat];
    for (let j = 0; j < 3; j++) {
      const [r, fa, en] = j === 0 && RV1[b.id] ? RV1[b.id] : pool[(i + j) % pool.length];
      const uid = 'u' + (((i * 3 + j) % 12) + 1);
      const days = [2 + (i % 5) * 2, 16 + i * 3, 45 + i * 6][j];
      reviews.push({
        id: `r-${b.id}-${j}`, bizId: b.id, userId: uid, rating: r,
        text: { fa, en }, ts: now - days * DAY - (i * 7 + j * 3) * 3600000,
        helpful: [14, 6, 2][j] + (i % 4),
        react: { f: (i + j) % 3, l: [6, 2, 1][j] + (i % 3) },
        photos: j === 0 && i % 3 !== 2 ? [{ kind: 'art', cat: b.cat, seed: b.look, crop: 1, scene: b.scene }, { kind: 'art', cat: b.cat, seed: b.look, crop: 3, scene: b.scene }] : [],
        reply: (j === 0 && i % 2 === 0) ? replies.thanks : (r <= 3 ? replies.fix : null)
      });
    }
  });

  const pending = [
    { id: 'p1', status: 'pending', ts: now - 2 * DAY - 5 * 3600000, submittedBy: 'u7',
      cat: 'food', hood: 'yousefabad', lat: 35.7342, lng: 51.399, price: 1,
      name: { fa: 'نانوایی سنگکی محل', en: 'Mahal Sangak Bakery' }, phone: '021 8854 3021',
      addr: { fa: 'یوسف‌آباد، خیابان ۲۱، پلاک ۲', en: 'No. 2, 21st St, Yousef Abad' },
      about: { fa: 'نان سنگک و بربری تازه از تنور، هر روز صبح از ساعت ۶.', en: 'Fresh sangak and barbari bread from the oven, every morning from 6am.' },
      hours: { o: '06:00', c: '13:00', off: [5] }, photos: [] },
    { id: 'p2', status: 'pending', ts: now - 5 * 3600000, submittedBy: 'u10',
      cat: 'shop', hood: 'pasdaran', lat: 35.77234, lng: 51.46245, price: 2,
      name: { fa: 'تعمیر موبایل همراه', en: 'Hamrah Phone Repair' }, phone: '021 2286 9902',
      addr: { fa: 'پاسداران، نبش گلستان پنجم', en: 'Pasdaran, corner of Fifth Golestan' },
      about: { fa: 'تعمیر تخصصی گوشی و تبلت با قطعات اصلی و سه ماه گارانتی.', en: 'Specialist phone and tablet repair with original parts and a three-month warranty.' },
      hours: { o: '10:00', c: '21:00', off: [5] }, photos: [] }
  ];

  const reports = [
    { id: 'rep1', reviewId: 'r-11-1', reason: 'spam', reporterId: 'u3', ts: now - 1 * DAY, status: 'open' },
    { id: 'rep2', reviewId: 'r-15-2', reason: 'fake', reporterId: 'u8', ts: now - 3 * DAY, status: 'open' }
  ];

  const QA = {
    food: [['برای جمع‌های بزرگ (حدود ۱۰ نفر) جا دارید؟', 'For a group of about 10, do you have space?', 'بله، سالن پشتی تا ۲۰ نفر ظرفیت داره؛ لطفاً از قبل رزرو کنید.', 'Yes, the back room seats up to 20; please book ahead.'],
      ['غذای گیاهی هم دارید؟', 'Do you have vegetarian dishes?', 'بله، چند غذای گیاهی توی منو هست و بعضی سفارش‌ها رو بدون گوشت هم آماده می‌کنیم.', 'Yes, a few vegetarian dishes, and some orders can be made meat-free.']],
    cafe: [['اینترنت رایگان دارید؟', 'Is there free Wi-Fi?', 'بله، رمز وای‌فای رو از صندوق بپرسید.', 'Yes, ask for the password at the counter.'],
      ['شیر گیاهی دارید؟', 'Do you have plant milk?', 'شیر بادام و جو دوسر داریم.', 'We have almond and oat milk.']],
    auto: [['بدون نوبت هم می‌شه اومد؟', 'Can I come without booking?', 'بله، ولی با نوبت آنلاین معطل نمی‌شید.', 'Yes, but booking online means no waiting.'],
      ['کار چقدر طول می‌کشه؟', 'How long does a service take?', 'بسته به خدمت، از ۳۰ دقیقه تا یک روز کاری.', 'From 30 minutes to one working day, depending on the service.']],
    beauty: [['چقدر قبل باید نوبت بگیرم؟', 'How far ahead should I book?', 'معمولاً ۲ تا ۳ روز قبل کافیه؛ برای آخر هفته زودتر.', 'Two or three days is usually enough; earlier for weekends.'],
      ['کارت هدیه دارید؟', 'Do you sell gift cards?', 'بله، کارت هدیه با مبلغ دلخواه داریم.', 'Yes, gift cards in any amount.']],
    home: [['بازدید و برآورد هزینه رایگانه؟', 'Is the first visit and quote free?', 'بله، داخل محدوده‌ی خدمات ما بازدید اول و برآورد هزینه رایگانه.', 'Yes, within our service area the first visit and quote are free.'],
      ['جمعه‌ها هم کار می‌کنید؟', 'Do you work on Fridays?', 'بله، با هماهنگی قبلی.', 'Yes, by appointment.']],
    health: [['بیمه‌ی تکمیلی قبول می‌کنید؟', 'Do you accept supplementary insurance?', 'با بیشتر بیمه‌های تکمیلی قرارداد داریم؛ قبل از مراجعه تماس بگیرید.', 'We work with most supplementary insurers; please call before your visit.'],
      ['حتماً باید از قبل نوبت بگیرم؟', 'Do I need an appointment?', 'نوبت قبلی بهتره، ولی اگه وقت خالی باشه بدون نوبت هم پذیرش داریم.', 'Booking is best, but we see walk-ins whenever there is a free slot.']],
    shop: [['ارسال به شهرستان دارید؟', 'Do you ship outside Tehran?', 'بله، با پست پیشتاز به همه‌ی شهرها.', 'Yes, by express post to every city.'],
      ['امکان مرجوعی هست؟', 'Can I return items?', 'تا ۷ روز با فاکتور خرید.', 'Within 7 days with the receipt.']],
    fitness: [['جلسه‌ی آزمایشی رایگان دارید؟', 'Is there a free trial?', 'بله، یک جلسه‌ی رایگان برای آشنایی.', 'Yes, one free session to try us out.'],
      ['سانس بانوان دارید؟', 'Are there women-only hours?', 'بله، صبح‌ها از ۹ تا ۱۳.', 'Yes, mornings from 9:00 to 13:00.']]
  };
  const qa = [];
  businesses.forEach((b, i) => {
    let pool = QA[b.cat] || [];
    if (b.id === 14) pool = [QA.health[0], ['ارسال دارو تا چه ساعتیه؟', 'Until what time do you deliver?', 'شبانه‌روزی؛ معمولاً کمتر از یک ساعت.', 'Around the clock, usually in under an hour.']];
    pool.slice(0, i % 3 === 2 ? 1 : 2).forEach((x, k) => qa.push({
      id: `q-${b.id}-${k}`, bizId: b.id, userId: 'u' + (((i + k * 5) % 12) + 1), q: { fa: x[0], en: x[1] }, a: { fa: x[2], en: x[3] },
      ts: now - (8 + i * 2 + k * 11) * DAY
    }));
  });
  qa.push({ id: 'q-2-open', bizId: 2, userId: 'u6', q: { fa: 'برای جشن تولد کوچیک (۸ نفر) میز رزرو می‌کنید؟', en: 'Can I reserve a table for a small birthday (8 people)?' }, a: null, ts: now - 9 * 3600000 });

  const bookings = [
    { id: 'bk1', bizId: 2, userId: 'u1', date: tDate(0), time: '10:30', size: 2, status: 'confirmed', ts: now - 2 * DAY },
    { id: 'bk2', bizId: 2, userId: 'u5', date: tDate(0), time: '17:00', size: 4, status: 'confirmed', ts: now - DAY },
    { id: 'bk3', bizId: 2, userId: 'u9', date: tDate(0), time: '19:30', size: 3, status: 'confirmed', ts: now - 5 * 3600000 },
    { id: 'bk4', bizId: 2, userId: 'u3', date: tDate(1), time: '09:00', size: 2, status: 'confirmed', ts: now - 3 * 3600000 },
    { id: 'bk5', bizId: 2, userId: 'u11', date: tDate(2), time: '18:30', size: 6, status: 'confirmed', ts: now - 3600000 },
    { id: 'bk6', bizId: 1, userId: 'u-demo', date: tDate(1), time: '20:30', size: 4, status: 'confirmed', ts: now - 6 * 3600000 },
    { id: 'bk7', bizId: 6, userId: 'u-demo', date: tDate(-12), time: '11:00', size: 1, status: 'done', ts: now - 20 * DAY }
  ];

  const lists = [
    { id: 'late-night', icon: 'moon', t: 'list.lateT', b: 'list.lateB', rule: 'late' },
    { id: 'work-friendly', icon: 'laptop', t: 'list.laptopT', b: 'list.laptopB', rule: 'laptop' },
    { id: 'top-rated', icon: 'award', t: 'list.topT', b: 'list.topB', rule: 'top' },
    { id: 'family', icon: 'kids', t: 'list.familyT', b: 'list.familyB', rule: 'family' },
    { id: 'self-care', icon: 'leaf', t: 'list.careT', b: 'list.careB', rule: 'care' }
  ];

  businesses.forEach(b => {
    b.slug = slugify(b.name.en);
    b.photos = [0, 1, 2, 3, 4, 5].map(k => ({ kind: 'art', cat: b.cat, seed: b.look, crop: k, scene: b.scene }));
    b.adj = { n: 0, sum: 0 };
    b.status = 'live';
  });

  window.FD_DATA = {
    hoods, lists, slugify, tDate,
    weekly: [38, 44, 41, 52, 49, 57, 61, 66],
    seed: {
      v: 6,
      cats, businesses, users, reviews, pending, reports, qa, bookings,
      favorites: [], helpfulBy: {}, recent: [], session: null, nextBizId: 100, nextId: 1, recentQ: [], notifSeen: {},
      subs: { 11: { plan: 'pro', bill: 'y', since: now - 40 * 864e5, until: now + 325 * 864e5, trial: false, invoice: 'FD-10311', amount: 0 },
        24: { plan: 'pro', bill: 'm', since: now - 9 * 864e5, until: now + 21 * 864e5, trial: false, invoice: 'FD-10342', amount: 0 },
        29: { plan: 'pro', bill: 'm', since: now - 4 * 864e5, until: now + 26 * 864e5, trial: false, invoice: 'FD-10357', amount: 0 },
        34: { plan: 'pro', bill: 'y', since: now - 70 * 864e5, until: now + 295 * 864e5, trial: false, invoice: 'FD-10288', amount: 0 },
        18: { plan: 'premium', bill: 'm', since: now - 12 * 864e5, until: now + 18 * 864e5, trial: false, invoice: 'FD-10336', amount: 0 },
        38: { plan: 'premium', bill: 'y', since: now - 30 * 864e5, until: now + 335 * 864e5, trial: false, invoice: 'FD-10320', amount: 0 } },
      trials: [],
      offers: [
        { id: 'of1', bizId: 11, pct: 20, until: now + 9 * 864e5, title: { fa: '۲۰٪ تخفیف ناهار روزهای وسط هفته', en: '20% off weekday lunches' } },
        { id: 'of2', bizId: 24, pct: 15, until: now + 12 * 864e5, title: { fa: '۱۵٪ تخفیف اولین مراجعه', en: '15% off your first visit' } },
        { id: 'of3', bizId: 29, pct: 10, until: now + 6 * 864e5, title: { fa: '۱۰٪ تخفیف و پیک رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان', en: '10% off and free pickup on orders over 500,000 toman' } },
        { id: 'of4', bizId: 34, pct: 20, until: now + 4 * 864e5, title: { fa: '۲۰٪ تخفیف دسته‌گل‌های آخر هفته', en: '20% off weekend bouquets' } },
        { id: 'of5', bizId: 18, pct: 15, until: now + 10 * 864e5, title: { fa: '۱۵٪ تخفیف پاستاهای دست‌ساز برای شام دونفره', en: '15% off handmade pasta for dinner for two' } }
      ]
    }
  };
})();
