export const SUPPORT_EMAIL = 'support@deveway.com'
export const LEGAL_UPDATED_AR = 'نوفمبر 2026'
export const LEGAL_UPDATED_EN = 'November 2026'

export type LegalSection = { heading: string; body: string }

export const PRIVACY_AR: LegalSection[] = [
  { heading: 'ما البيانات التي نجمعها', body: 'نجمع المعلومات التي تقدمها لنا عند إنشاء حسابك، مثل الاسم والبريد الإلكتروني وكلمة المرور المشفّرة ونوع الحساب. وقد نجمع أيضاً معلومات اختيارية مثل الصورة الشخصية والسيرة الذاتية ونبذة مهنية ورابط حسابك على لينكدإن. كما نسجّل بيانات الاستخدام الأساسية مثل الكورسات التي سجلت فيها وتقدمك الدراسي وجلسات الإرشاد التي حجزتها.' },
  { heading: 'كيف نستخدم البيانات', body: 'نستخدم بياناتك لتقديم الخدمة وإدارة حسابك وإتاحة الكورسات والجلسات التي اشتركت فيها، وللتواصل معك بشأن الإشعارات والمدفوعات والدعم الفني، ولتحسين المنصة وتخصيص التوصيات بما يناسب اهتماماتك المهنية. ولا نستخدم بياناتك لأي غرض لا يتعلق بتشغيل المنصة وتطويرها.' },
  { heading: 'هل نشارك البيانات مع أطراف ثالثة', body: 'نحن لا نبيع بياناتك الشخصية ولا نؤجرها لأي جهة. قد نشارك الحد الأدنى من البيانات مع مزوّدي الخدمات الذين يساعدوننا في تشغيل المنصة، مثل معالجة المدفوعات واستضافة الفيديو وإرسال البريد الإلكتروني، وذلك وفق اتفاقيات تلزمهم بحماية بياناتك. وقد نكشف عن البيانات إذا طُلب منا ذلك بموجب القانون.' },
  { heading: 'حماية البيانات', body: 'نطبّق إجراءات تقنية وتنظيمية مناسبة لحماية بياناتك، بما في ذلك تشفير كلمات المرور واستخدام اتصالات آمنة وتقييد صلاحيات الوصول. ومع ذلك لا توجد وسيلة نقل أو تخزين إلكتروني آمنة بنسبة مئة بالمئة، لذا ننصحك باختيار كلمة مرور قوية وعدم مشاركتها.' },
  { heading: 'كيف تحذف حسابك', body: `يمكنك طلب حذف حسابك وبياناتك الشخصية في أي وقت عبر التواصل معنا على ${SUPPORT_EMAIL}. سنراجع طلبك وننفذه خلال مدة معقولة، مع الاحتفاظ بالسجلات التي يُلزمنا القانون بالاحتفاظ بها، مثل سجلات المدفوعات.` },
  { heading: 'تواصل معنا لأي استفسار', body: `إذا كانت لديك أي أسئلة حول سياسة الخصوصية أو طريقة معالجة بياناتك، فراسلنا على ${SUPPORT_EMAIL} وسيسعدنا الرد عليك.` },
]

export const TERMS_AR: LegalSection[] = [
  { heading: 'قبول الشروط', body: 'باستخدامك منصة DeveWay أو بتسجيل حساب جديد فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي بند منها فيرجى عدم استخدام المنصة. قد نحدّث هذه الشروط من وقت لآخر، ويُعد استمرارك في استخدام المنصة بعد التحديث موافقة على النسخة الجديدة.' },
  { heading: 'مسؤوليات المستخدم', body: 'أنت مسؤول عن صحة المعلومات التي تقدمها وعن الحفاظ على سرية بيانات دخولك وعن كل نشاط يتم عبر حسابك. تلتزم بنشر محتوى مناسب ومحترم، وبعدم انتهاك حقوق الملكية الفكرية أو حقوق الآخرين، وبعدم مشاركة محتوى الكورسات المدفوعة خارج المنصة أو إعادة بيعه.' },
  { heading: 'المحتوى المحظور', body: 'يُمنع نشر أي محتوى مسيء أو مخالف للقانون أو يحرّض على الكراهية أو العنف، ويُمنع الاحتيال أو انتحال الهوية أو انتهاك خصوصية الآخرين، ويُمنع محاولة اختراق المنصة أو تعطيلها أو إساءة استخدام خدماتها بأي شكل.' },
  { heading: 'المدفوعات والاسترداد', body: 'تُعرض أسعار الكورسات وجلسات الإرشاد بوضوح قبل إتمام الشراء. تخضع طلبات الاسترداد لسياسة المنصة المعلنة وقت الشراء، ويمكنك التواصل مع الدعم الفني لأي استفسار يخص عمليات الدفع.' },
  { heading: 'إنهاء الخدمة', body: 'يحق لنا تعليق حسابك أو إنهاؤه في حال مخالفة هذه الشروط أو إساءة استخدام المنصة، مع إشعارك متى أمكن ذلك. ويمكنك أنت أيضاً التوقف عن استخدام المنصة وطلب إغلاق حسابك في أي وقت.' },
  { heading: 'تواصل معنا', body: `لأي أسئلة حول هذه الشروط والأحكام يمكنك مراسلتنا على ${SUPPORT_EMAIL}.` },
]

export const PRIVACY_EN: LegalSection[] = [
  { heading: 'Data we collect', body: 'We collect the information you give us when you create an account, such as your name, email address, hashed password and account type, plus optional details like a profile photo, CV, short bio and LinkedIn link. We also record basic usage data such as enrolled courses, learning progress and booked coaching sessions.' },
  { heading: 'How we use your data', body: 'We use your data to provide the service, manage your account, give you access to the courses and sessions you signed up for, contact you about notifications, payments and support, and improve the platform and its recommendations.' },
  { heading: 'Sharing with third parties', body: 'We do not sell or rent your personal data. We share the minimum necessary data with service providers that help us run the platform, such as payment processing, video hosting and email delivery, under agreements that require them to protect it. We may disclose data when required by law.' },
  { heading: 'Data protection', body: 'We apply appropriate technical and organizational measures, including password hashing, secure connections and restricted access. No electronic system is perfectly secure, so please choose a strong password and keep it private.' },
  { heading: 'Deleting your account', body: `You can request deletion of your account and personal data at any time by contacting ${SUPPORT_EMAIL}. We keep only the records the law requires us to keep, such as payment records.` },
  { heading: 'Contact us', body: `For any question about this policy, write to ${SUPPORT_EMAIL}.` },
]

export const TERMS_EN: LegalSection[] = [
  { heading: 'Acceptance of terms', body: 'By using DeveWay or registering an account you agree to these terms. If you do not agree, please do not use the platform. We may update the terms from time to time; continued use after an update means you accept the new version.' },
  { heading: 'User responsibilities', body: 'You are responsible for the accuracy of the information you provide, for keeping your login details confidential, and for all activity under your account. You agree to post appropriate content, respect intellectual property and the rights of others, and not share or resell paid course content outside the platform.' },
  { heading: 'Prohibited content', body: 'Offensive or unlawful content, hate speech or incitement to violence, fraud, impersonation, privacy violations, and any attempt to hack, disrupt or abuse the platform are prohibited.' },
  { heading: 'Payments and refunds', body: 'Prices for courses and coaching sessions are shown before you complete a purchase. Refund requests follow the policy shown at the time of purchase. Contact support with any payment question.' },
  { heading: 'Termination', body: 'We may suspend or terminate your account if you violate these terms or misuse the platform, notifying you where possible. You may stop using the platform and request account closure at any time.' },
  { heading: 'Contact us', body: `For questions about these terms, write to ${SUPPORT_EMAIL}.` },
]
