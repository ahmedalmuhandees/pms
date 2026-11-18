<!--
  SalesContractTemplate.vue
  عقد بيع وحدة سكنية في مجمع أبراج سما — نسخة HTML/Vue 3 مطابقة لملف الـ Word (عقد معدل 1.docx)
  الخط: Times New Roman 14pt | A4 | RTL | تباعد الأسطر 1.5 | هوامش: أعلى 5.7سم، أسفل 3.4سم، يمين/يسار 2سم

  الاستخدام:
    <SalesContractTemplate
      :customer="api.customer"
      :unit="api.unit"
      :sales-contract="api.salesContract"
      seller-address="..." seller-phone="..."
      highlight-vars   (اختياري: لتلوين أماكن المتغيرات أثناء التطوير)
    />
  الطباعة: window.print()  (القالب يحتوي @page لمقاس A4 وترقيم الصفحات)
-->
<template>
  <div class="contract" dir="rtl" lang="ar" :class="{ 'hl-vars': highlightVars }">
    <!-- ===================== الصفحة 1 : أطراف العقد ===================== -->
    <h1 class="title">عقد بيع وحدة سكنية في مجمع ابراج سما</h1>

    <p class="b">الطرف الاول / البائع</p>
    <p class="b">المدير المفوض لشركة الخلود للاستثمارات العقارية والصناعية والزراعية محدودة المسؤؤلية اضافة لوظيفته</p>
    <p class="b">العنوان: <span class="v">{{ sellerAddress }}</span></p>
    <p class="b">رقم الهاتف: <span class="v">{{ sellerPhone }}</span></p>

    <p class="b">الطرف الثاني / المشتري</p>
    <!-- ======== متغيرات المشتري (من API) ======== -->
    <p class="b">الاسم الرباعي: <span class="v" data-var="CustomerName">{{ customerName }}</span></p>
    <p class="b">رقم وتاريخ هوية الاحوال المدنية او البطاقة الموحدة: <span class="v" data-var="CustomerIdNumber">{{ customerIdNumber }}</span></p>
    <p class="b">عنوانه: <span class="v" data-var="ResolveAddress()">{{ resolvedAddress }}</span></p>
    <p class="b">ورقم هاتفه: <span class="v" data-var="CustomerPhone">{{ customerPhone }}</span></p>

    <h2 class="h">البند الاول: مقدمة العقد</h2>
    <p>
      مشروع (ابراج سما )مشروع استثماري حاصل على اجازة استثمار بالرقم 665 لسنة 2025 الصادرة من هيئة استثمار بغداد
      بموجب قانون الاستثمار العراقي رقم 13 لسنة 2006 المعدل والذي خولته بموجبها انشاء مجمع ابراج سما السكني الاستثماري
      حيث قام الطرف الاول بطرح الوحدات السكنية للبيع وبما ان الطرف الثاني يرغب بالشراء فقد اتفق الطرفان على قيمة العقد
      المبينة لاحقا وحسب الشروط الاتية
    </p>

    <h2 class="h">البند الثاني: المصطلحات والتعاريف</h2>
    <ol class="list">
      <li>جازة الاستثمار: الرخصة الاستثمارية الصادرة من هيئة استثمار بغداد بموجب قانون الاستثمار رقم 13 لسنة 2006 المعدل . والانظمة اللاحقة به والتي تحمل الرقم (665 لسنة 2025 ) والتي خولت الشركة بانشاء مجمع سكني وبيع الوحدات السكنية</li>
      <li>العقد: هو الوثيقة الموقعة بين الطرفين (الشركة والمشتري ) لبيع وشراء الوحدة السكنية ضمن المجمع السكني</li>
      <li>موعد التسليم: هو تاريخ تسليم الوحدة السكنية بعد الانتهاء من تنفيذ الاعمال حسب بنود العقد</li>
      <li>الوحدة السكنية: الشقة السكنية او المنزل المحددة والمعرفة بموجب البند الثالث</li>
      <li>الثمن: بدل بيع الوحدة السكنية المباعة من قبل الطرف الاول الى الطرف الثاني</li>
      <li>جدول السداد: الجدول المرفق بالعقد الذي يتضمن مواعيد تسديد ثمن الوحدة السكنية</li>
      <li>الملكية التسجيل: الاجراءات التي تتضمن انتقال الوحدة السكنية الى الطرف المستفيد وتسجيل الوحدة المباعة لدى الجهات المختصة وفق القانون .</li>
    </ol>

    <!-- ===================== الصفحة 2 : موضوع العقد (بيانات الوحدة) ===================== -->
    <h2 class="h">البند الثالث : موضوع العقد</h2>
    <p>
      إن الطرف الأول، شركة الخلود للاستثمارات العقارية والصناعية والزراعية، هي المستثمر المسؤول عن تنفيذ المشروع السكني
      المسمى (أبراج سما)، والمشمول بالإجازة الاستثمارية المرقمة (665) لسنة (2025) الصادرة عن هيئة استثمار بغداد، وفقاً
      لأحكام قانون الاستثمار رقم (13) لسنة (2006) المعدل، وبحدود الحقوق والالتزامات المقررة بموجب الإجازة الاستثمارية
      والمخططات المصادق عليها من الجهات المختصة.
    </p>
    <p>
      وحيث إن الطرف الثاني قد أبدى رغبته في شراء وحدة سكنية ضمن المشروع المذكور، وبعد اطلاعه على المخططات والمواصفات
      الفنية وشروط البيع والتسديد، فقد اتفقت إرادة الطرفين، وهما بكامل أهليتهما القانونية، على إبرام هذا العقد وفقاً
      للشروط والأحكام الآتية، وتُعد هذه المقدمة جزءاً لا يتجزأ منه وتقرا معه كوحدة واحدة .
    </p>
    <!-- ======== متغيرات الوحدة (من API) ======== -->
    <p>مساحة الوحدة السكنية : (<span class="v" data-var="AreaValue">{{ areaValue }}</span>) م</p>
    <p>
      القيمة الكلية للوحدة السكنية (<span class="v" data-var="TotalPrice">{{ totalPriceText }}</span>)
      <template v-if="isUsd">يسدد على حسب سعر البنك المركزي</template>
    </p>
    <p>رقم الوحدة السكنية : <span class="v" data-var="UnitNumber" dir="ltr">{{ unitNumber }}</span></p>

    <h2 class="h">البند الرابع : التزامات الطرف الاول :</h2>
    <ol class="list">
      <li>يلتزم الطرف الاول بتوفير خدمات الماء والكهرباء وكافة الخدمات داخل المشروع وعلى الطرف الثاني تسديد اجورها بشكل شهري وحسب الفواتير .</li>
      <li>يلتزم الطرف الاول باطلاع الطرف الثاني على المخططات والمرتسمات الخاصة بالمجمع السكني ويقر الطرف الثاني بانه شاهد ووافق على كافة تفاصيل المجمع والوحدة السكنية موضوع العقد .</li>
      <li>يلتزم الطرف الاول بتنفيذ الوحدات السكنية وفق المخططات والمرتسمات الهندسية المعتمدة والمدة الزمنية المحددة .</li>
      <li>يلتزم الطرف الاول بتسليم الوحدة السكنية موضوع العقد للطرف الثاني خالية من الشواغل لحين سداد كامل ثمن المبيع من قبل الطرف الثاني خلال المدة الزمنية المحددة ويعتبر جدول التسديد جزء لا يتجزء من اصل العقد .</li>
      <li>يلتزم الطرف الاول بأطلاع الطرف الثاني على الية البيع وطريقة السداد المقررة للوحدة السكنية المباعة ويعتبرثمن البيع للوحدة السكنية محل العقد خاصا بملكية الوحدة السكنية محل العقد فقط .</li>
      <li>يلتزم الطرف الاول بانجاز اعمال شبكات البنى التحتية ضمن المدة المحددة في الاجازة الاستثمارية.</li>
      <li>يتضمن بيع الوحدة السكنية اجور الصيانة لمدة (سنة واحدة) من تاريخ استلام الطرف الثاني الوحدة السكنية وتشمل الصيانة الضمان عن عيوب التنفيذ فقط ولا يتحمل الطرف الاول اي صيانة تظهر عن سوء الاستخدام من قبل الطرف الثاني .</li>
    </ol>

    <h2 class="h">البند الخامس : التزامات الطرف الثاني</h2>
    <ol class="list">
      <li>يلتزم الطرف الثاني بتسديد الدفعات المالية والاقساط المترتبة بذمته حسب جدول الدفعات المتفق عليها بين الطرفين والمرفق ضمن العقد .</li>
      <li>يلتزم الطرف الثاني بتوقيع عقد الالتزامات والخدمات مع الطرف الاول من قبل استلام الوحدة السكنية والمتضمن التزام الساكن ان كان مالكا او مؤجرا للوحدة السكنية بتعليمات وبنود اشغال الوحدة السكنية وما يترتب بذمة الشاغل من تكاليف الخدمات الادارية وخدمات التشغيل للمرافق العامة واجور الماء والكهرباء والمجاري ومنظومة الغاز وشبكة الانترنيت ورفع النفايات واي رسوم اضافية قد تفرضها الدولة لاحقا .</li>
      <li>يلتزم الطرف الثاني باستلام الوحدة السكنية موضوع العقد عند إكمالها وفقاً للمخططات والمواصفات الفنية المتفق عليها، وبعد إشعاره تحريرياً من الطرف الأول بموعد الاستلام ,وفي حال عدم حضور الطرف الثاني خلال مدة (10) عشرة أيام من تاريخ تبلغه بالإشعار، أو امتناعه عن الاستلام دون مسوغ قانوني، يحق للطرف الأول تنظيم محضر أصولي يثبت فيه جاهزية الوحدة السكنية ومطابقتها للمواصفات التعاقدية وعرض تسليمها إلى الطرف الثاني ,ويُعد امتناع الطرف الثاني دون مسوغ قانوني عن الاستلام، بعد ثبوت جاهزية الوحدة امتناعاً عن تسلم المبيع، وتترتب عليه الآثار القانونية المقررة بموجب القانون المدني العراقي، ولا يتحمل الطرف الأول الأضرار الناشئة حصراً عن ذلك الامتناع.</li>
      <li>يلتزم الطرف الثاني بالتوجيهات الخاصة بادارة المشروع والمحافظة على الذوق العام ونظافة الابنية السكنية والخدمات العامة وعدم رمي النفايات في الاماكن غير المخصصة لها وعدم استخدام الشرفة لنصب اي(صحون ستلايت) او مد اي توصيلات خارجية او استخدام الشرفة لخزن الاثاث او الادوات القابلة للاشتعال او استخدامها لاغراض شواء الاطعمة او نشر الغسيل وغيرها من المظاهر التي تشوه مظهر المجمع السكني وكذلك عدم نصب وتثبيت اي كاميرات مراقبة وبخلافه يتحمل الطرف الثاني كافة الاجراءات التي يتخذها الطرف الاول جراء المخالفه وحسب مايراه مناسبا يقوم الطرف الثاني بأزالة المخالفة ان وجدت حال تبليغه من ادارة المجمع خلال مدة لا تزيد عن (72) ساعة و خلافه يحق لادارة المجمع ازالة المخالفة على حساب الطرف الثاني وما يترتب عليه من اجور ماليه وقانونية .</li>
      <li>يلتزم الطرف الثاني وبعد استلامه الوحدة السكنية بدفع فواتير الماء والكهرباء والغاز والانترنيت والامن والتنظيف وكافة الخدمات الخاصة بالوحدة السكنية والمرافق العامة وخلافه فيحق للطرف الاول قطع كافة الخدمات عن الوحدة السكنية .</li>
    </ol>

    <h2 class="h">البند السادس : تسجيل الوحدة السكنية :</h2>
    <ol class="list">
      <li>يتم تسجيل الوحدة السكنية باسم الطرف الثاني بعد سداد الطرف الثاني كامل مبلغ بدل البيع والالتزامات المالية الاخرى في حال ترتبها بذمته لصالح الطرف الاول حسب المدة المذكورة لتسليم الوحدة السكنية ولا يتحمل الطرف الأول المسؤولية عن التأخير الناشئ حصراً عن القوة القاهرة او إجراءات الدوائر الرسمية أو الموانع القانونية التي لا يد له في نشوئها و كذلك يلتزم الطرف الاول او من يمثله قانونيا بالحضور امام الجهات الرسمية في حال الحاجة لاقرار البيع او اخذ توقيعه ويتحمل الطرف الثاني اي رسوم ادارية وغيرها الللازمة لانجاز معاملة تسجيل الوحدة السكنية باسمه والسير بها بكافة مراحلها يلتزم الطرف الاول بتسليم الطرف الثاني صورة عن المستندات اللازمة لاتمام تسجيل الوحدة السكنية متى توقيعه ويتحمل الطرف الثاني اي رسوم ادارية وغيرها اللازمة لانجاز معاملة تسجيل الوحدة السكنية باسمة والسير بها بكافة مراحلها يلتزم الطرف الاول بتسليم الطرف الثاني صورة عن المستندات اللازمة لاتمام تسجيل الوحدة السكنية متى طلب الطرف الثاني ذلك رسميا بعد تسديده كافة الالتزامات المالية المترتبة بذمته ولا يحق للطرف الاول الامتناع عن الحضور لاتمام عملية انتقال الملكية بصورتها النهائية عند طلب الطرف الثاني ذلك وخلافه فيحق للطرف الثاني اتخاذ الاجراءات القانونية والمالية بحق الطرف الاول جراء عدم الالتزام في حال وفاة الطرف الثاني فان حقوق نقل ملكية الوحدة السكنية في حال الوفاء بكافة الالتزامات المالية تنتقل لورثته فقط حتى مرحلة تسجليها باسمهم في السجلات الرسمية وحسب القسام الشرعي والقوانين النافذة ويلتزم الورثة بكافة الالتزامات المترتبة بهذا العقد</li>
      <li>يسلم الطرف الاول الطرف الثاني الوحدة السكنية بعد (30 شهر) تبدأ من تاريخ توقيع هذا العقد يضاف عليه التاأخير الناشئ عن قوة قاهرة أو سبب أجنبي لا يد له فيه، بما في ذلك الحروب والكوارث الطبيعية والأوبئة والإجراءات والقرارات الصادرة عن الجهات المختصة التي تحول دون تنفيذ الالتزام، وعدم إمكان دفع آثارها بالوسائل المعتادة. وفي هذه الحالة، تمدد مدة تنفيذ الالتزام بقدر مدة التأخير الناشئة عن السبب المذكور، ولا يستحق الطرف الثاني تعويضاً عن مدة التأخير التي يثبت انتفاء مسؤولية الطرف الأول عنها. أما إذا ترتب على القوة القاهرة استحالة تنفيذ الالتزام بصورة نهائية، فتسوى حقوق الطرفين وفقاً لأحكام القانون المدني العراقي .</li>
      <li>يتحمل الطرف الاول غرامة مالية وقدرها( 600,000) ألف دينار عراقي عن كل شهر تأخير من تسليم الوحدة السكنية للطرف الثاني تعتبر كبدل ايجار .</li>
      <li>في حال تأخر او اخلال او تلكو او امتناع او تراجع الطرف الثاني ولأي سبب من الاسباب عن تسديد الدفعات والايفاء بالاتزامات المالية المستحقة عن الوحدة السكنية ووفق المدة الزمنية المحددة لكل دفعة والموضحة في جدول الدفعات يتحمل غرامة مالية وقدرها( 65.000) دينار عراقي عن كل يوم تأخير ويتم فرض الغرامة بعد 15 يوم من انقضاء تاريخ سداد الدفعة المالية المستحقة عن الوحدة السكنية ودون التأثير على مواعيد الدفعات اللاحقة فأن لم يلتزم الطرف الثاني بتسديد الدفعات اللاحقة للطرف الاول فسخ هذا العقد واعادة الحال لما كان عليه بعد مرور 90 يوم عن عدم تسديد الدفعات الموجبة بالعقد ويعتبر هذا العقد مفسوخه من تلقاء نفسه استنادا الى احكام المادة (178 من القانون المدني العراقي ) رقم ( 40 / لسنة 1951) ودون الحاجة الى توجيه اخطار او حكم قضائي بذلك عن مافاته من كسب وما لحقه من خسارة جراء ذلك ,كما ويحق للطرف الاول العمل على اعادة عرض الشقة السكنية المذكورة للبيع مباشرة ويتم ارجاع المبلغ بعد بيع الشقة كما يحق للطرف الاول خصم نسبة مقدارها ( 20% ) من اصل المبلغ المستلم من الطرف الثاني</li>
      <li>ان قيمة هذا العقد غير شاملة لاي رسوم او مبالغ اضافية قد تصدرها الدولة لاحقا والقوانين والتعليمات اللاحقة .</li>
      <li>لا يحق للطرف الثاني استخدام الوحدة السكنية لغير السكن ويحق للطرف الاول فرض غرامة مالية ومحاسبة الطرف الثاني قضائيا من جراء استخدام الوحدة السكنية لاغراض غير السكن كون مشروع (ابراج سما )هو مشروع سكني متكامل الخدمات . لذا فان الطرف الثاني يقتصر انتفاعه بالوحدة السكنية وملحقاتها موضوع العقد على الغرض الذي خصصت من اجله وهو السكن حصرا ,عليه يتم اخطار الطرف الثاني بالالتزام لاستخدامة الرسمي للوحدة السكنية خلال فترة( 7) ايام وبعدا تفرض غرامة لا تزيد على(3,000,000) دينار عراقي وان استمر في المخالفة تكون غرامة في اليوم الواحد(10,000) دينار عراقي .</li>
      <li>لا يحق للطرف الثاني قبل وبعد استلام الشقة السكنية القيام باي اعمال تعديل التصميم الانشائي للوحدة السكنية او اضافة في عدد الغرف او القيام بأي اعمال تكسير او بناء او انشاء او توسعة للغرف او تركيب وحدات تكيف اضافية او مبردات او عمل فتحات تهوية او تعديل على الواجهة الامامية والخارجية للوحدة السكنية مما يغير من شكلها العام او تعديل الطراز الذي صممت وفقا له لتبقى محافظة على المظهر الامامي والخارجي الاصلي وبطراز المباني السائدة الذي تقع من ضمن الوحدة السكنية ويلتزم الطرف الثاني بتوجيهات الطرف الاول بهذا الخصوص وحسب المخططات المعتمدة للمشروع .</li>
      <li>يتحمل الطرف الثاني كامل المسؤولية المالية والقانونية عن اي ضرر من اي اعمال يقوم بها كصيانة او ترميم او تغير وما شابه ذلك في الوحدة السكنية او اي من الممتلكات العامة داخل المجمع السكني دون استحصال موافقة خطية وصريحة من الطرف الاول ويتحمل كلفة ازالة الضرر واصلاحة خلال مدة لا تتجاوز (10) ايام وعلى حسابه الخاص ويحق للطرف الاول المطالبة بتسديد البدل المالي وحسب نوع الضرر برد الوضع الى ما هو عليه وفي حال امتناع الطرف الثاني عن اصلاح الاضرار فيحق للطرف الاول فرض غرامة لا تزيد على(3,000,000) دينار عراقي .</li>
      <li>يحق للطرف الثاني البيع او تنازل عن الوحدة السكنية الى اي طرف اخر بعد مرور ثمانية اشهر من تاريخ توقيع العقد على ان يلتزم الطرف الثاني بتوقيع عقد البيع لدى الطرف الاول وبخلافه لا يتم اعتماد اي عقد خارجي ويعتبر باطلا وغير ملزم للطرف الاول مع دفع اجور ادارية بين الطرفين بنسبة (2%) من ثمن الوحدة السكنية على الطرفين .</li>
      <li>يلتزم الطرف الثاني في حال رغبته ايجار الوحدة السكنية عند استلامها بعرضها لدى الطرف لاول باعتباره المخول عن ادارة المجمع السكني لطرحها للايجار على ان يلتزم المستأجر بكافة الضوابط والتعليمات التي تصدر من ادارة المجمع ودفع اجور الخدمات المقررة لاحقا وبخلافه فللطرف الاول انهاء عقد الايجار وعدم السماح بدخول المستأجر واستخدامه واشغال الوحدة السكنية ويتم اعداد عقد ايجار من قبل الطرف الاول حصرا .</li>
      <li>لا يتم اعتبار المكاتبات والعقود الخارجية للبيع والايجار على الوحدات السكنية الخاصة بالمجمع السكني ويحق للطرف الاول الاعتراض عليها ولا تعتبر ملزمة كونها جاءت خلاف للفقرات الواردة لهذا العقد .</li>
      <li>يُنظم عند تسليم الوحدة السكنية محضر استلام أصولي يوقعه الطرفان، تثبت فيه حالة الوحدة السكنية ومطابقتها للمواصفات المتفق عليها، وأي ملاحظات ظاهرة يتم الاتفاق على معالجتها و يُعد توقيع محضر الاستلام تنازلاً عن الحقوق المتعلقة بالعيوب الخفية أو الضمانات التي يقررها القانون .</li>
      <li>لا يُعتد بأي اتفاق أو تعهد أو تعديل يتعلق بهذا العقد ما لم يكن مثبتاً بموجب محرر تحريري موقع من الطرفين أو ممن يمثلهما قانوناً، ولا تكون الوعود أو التصريحات الصادرة من غير المخولين بالتوقيع ملزمة للطرف الأول، مع مراعاة قواعد الإثبات والأحكام القانونية الآمرة.</li>
    </ol>

    <h2 class="h nu">البند السابع :النزاعات :</h2>
    <p>
      لا يمكن تغيير بنود هذا العقد ولا يصبح اي تغير ساريا الا اذا تم الاتفاق عليه خطيا بين الطرفين ويتم حل الخلافات التي
      تنشأ عن هذا العقد وديا بين الطرفين وبخلافه فأن السلطة القضائية في محافظة بغداد هي صاحبة الاختصاص بنظر الدعاوي
      الناشئة بين الطرفين عن بنود هذا العقد
    </p>

    <h2 class="h nu">البند الثامن :العناوين الرسمية للتبليغ والمراسلات</h2>
    <p>
      اتفق الطرفان على اعتماد العناوين وأرقام الهواتف والبريد الإلكتروني المثبتة في صدر هذا العقد لأغراض المراسلات
      والإشعارات التعاقدية المتعلقة بتنفيذه ,ويلتزم كل طرف بإشعار الطرف الآخر تحريرياً بأي تغيير يطرأ على بيانات الاتصال
      الخاصة به خلال مدة (7) سبعة أيام من تاريخ حصول التغيير, وتُعد الإشعارات التعاقدية المرسلة إلى العناوين المعتمدة
      منتجة لآثارها متى ثبت وصولها إلى الطرف المرسل إليه .
    </p>

    <p class="b nu">المرافقات:</p>
    <p>ملاحظة:- السهو والخطأ مرجوع من الطرفين</p>

    <!-- ======== التواقيع ======== -->
    <div class="signatures">
      <div class="sig">
        <p>الطرف الاول</p>
        <p>المدير المفوض لشركة الخلود للاستثمارات العقارية والصناعية والزراعية محدودة المسؤولية</p>
        <p>يمثلها المدير المفوض / اضافة لوظيفته</p>
        <p>محمد صالح سهيل</p>
      </div>
      <div class="sig">
        <p>الطرف الثاني</p>
        <p class="v" data-var="CustomerName">{{ customerName || '................' }}</p>
      </div>
    </div>

    <!-- ===================== صفحة المرفقات : المساحة ===================== -->
    <section class="annex">
      <p class="b">المرافقات:</p>
      <p>المساحة (<span class="v" data-var="AreaValue">{{ areaValue }}</span>) م</p>

      <!-- مكان مخطط الوحدة (اختياري): <template #plan><img :src="planUrl" /></template> -->
      <div class="plan"><slot name="plan" /></div>

      <div class="signatures">
        <div class="sig">
          <p>الطرف الاول</p>
          <p>المدير المفوض لشركة الخلود للاستثمارات العقارية والصناعية والزراعية محدودة المسؤولية</p>
          <p>يمثلها المدير المفوض / اضافة لوظيفته</p>
          <p>محمد صالح سهيل</p>
        </div>
        <div class="sig">
          <p>الطرف الثاني</p>
          <p class="v" data-var="CustomerName">{{ customerName || '................' }}</p>
        </div>
      </div>
    </section>

    <!-- ===================== ملحق المالية وجدول الدفعات ===================== -->
    <section class="annex finance-annex">
      <h2 class="title">جدول تسديد بنظام الدفعات</h2>
      <p class="b">البيانات المالية</p>
      <table class="fin-grid">
        <tbody>
          <tr>
            <th>نوع العقد</th>
            <td>{{ finance.contractType }}</td>
            <th>طريقة الدفع</th>
            <td>{{ finance.paymentType }}</td>
          </tr>
          <tr>
            <th>الحالة</th>
            <td>{{ finance.status }}</td>
            <th>وكيل المبيعات</th>
            <td>{{ finance.salesAgent }}</td>
          </tr>
          <tr>
            <th>سعر البيع</th>
            <td>{{ moneyText(g(props.salesContract, 'SellingPrice')) }}</td>
            <th>الخصم</th>
            <td>{{ moneyText(g(props.salesContract, 'Discount')) }}</td>
          </tr>
          <tr>
            <th>المقدمة</th>
            <td>{{ moneyText(g(props.salesContract, 'DownPayment')) }}</td>
            <th>مبلغ الاستلام</th>
            <td>{{ moneyText(g(props.salesContract, 'DeliveryAmount')) }}</td>
          </tr>
          <tr>
            <th>المتبقي</th>
            <td>{{ moneyText(g(props.salesContract, 'RemainingAmount')) }}</td>
            <th>المصرف</th>
            <td>{{ clean(g(props.salesContract, 'BankName')) || '—' }}</td>
          </tr>
          <tr>
            <th>مبلغ المصرف</th>
            <td>{{ moneyText(g(props.salesContract, 'FinancedAmount')) }}</td>
            <th>السنوات</th>
            <td>{{ yearsText }}</td>
          </tr>
          <tr>
            <th>فترة الدفع</th>
            <td>{{ paymentIntervalText }}</td>
            <th>رقم العقد</th>
            <td dir="ltr">{{ clean(g(props.salesContract, 'ContractNumber')) || '—' }}</td>
          </tr>
          <tr>
            <th>المساحة</th>
            <td>{{ areaValue ? `${areaValue} م²` : '—' }}</td>
            <th>سعر المتر</th>
            <td>{{ meterPriceText }}</td>
          </tr>
        </tbody>
      </table>

      <p class="b pay-title">جدول المدفوعات</p>
      <table class="pay-table">
        <thead>
          <tr>
            <th>رقم الدفع</th>
            <th>تاريخ استحقاق الدفع</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paymentRows.length === 0">
            <td colspan="3">—</td>
          </tr>
          <tr v-for="(row, idx) in paymentRows" :key="idx">
            <td>{{ row.label }}</td>
            <td>{{ row.dueDate || '—' }}</td>
            <td>{{ moneyText(row.amount) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig">
          <p>الطرف الاول</p>
          <p>المدير المفوض لشركة الخلود للاستثمارات العقارية والصناعية والزراعية محدودة المسؤولية</p>
          <p>يمثلها المدير المفوض / اضافة لوظيفته</p>
          <p>محمد صالح سهيل</p>
        </div>
        <div class="sig">
          <p>الطرف الثاني</p>
          <p class="v" data-var="CustomerName">{{ customerName || '................' }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Customer: FirstName, LastName, NationalID, BirthDate, Address, Occupation, Phone */
  customer: { type: Object, default: () => ({}) },
  /** Unit: UnitNumber, Area */
  unit: { type: Object, default: () => ({}) },
  /** SalesContract: SellingPrice, ExchangeRateUsd, installments, ... */
  salesContract: { type: Object, default: () => ({}) },
  sellerAddress: { type: String, default: '' },
  sellerPhone: { type: String, default: '' },
  /** تسميات البيانات المالية */
  contractTypeLabel: { type: String, default: '—' },
  paymentTypeLabel: { type: String, default: '—' },
  contractStatusLabel: { type: String, default: '—' },
  salesAgentName: { type: String, default: '—' },
  /** سعر المتر من تصميم العقد (اختياري) */
  pricePerMeter: { type: Number, default: null },
  /** تلوين أماكن المتغيرات للمعاينة فقط */
  highlightVars: { type: Boolean, default: false },
})

/* يقبل camelCase أو PascalCase القادم من الـ API */
const g = (obj, name) => {
  if (!obj) return undefined
  const camel = name.charAt(0).toLowerCase() + name.slice(1)
  return obj[name] ?? obj[camel] ?? (name === 'NationalID' ? obj.nationalId : undefined)
}
const clean = (v) => (v === null || v === undefined ? '' : String(v).trim())

/* ---------- المشتري ---------- */
const customerName = computed(() =>
  [clean(g(props.customer, 'FirstName')), clean(g(props.customer, 'LastName'))].filter(Boolean).join(' ')
)

const customerIdNumber = computed(() => {
  const id = clean(g(props.customer, 'NationalID'))
  const bd = formatDate(g(props.customer, 'BirthDate'))
  return id && bd ? `${id} — ${bd}` : id
})

const resolvedAddress = computed(
  () => clean(g(props.customer, 'Address')) || clean(g(props.customer, 'Occupation'))
)

const customerPhone = computed(() => clean(g(props.customer, 'Phone')))

/* ---------- الوحدة ---------- */
const unitNumber = computed(() => clean(g(props.unit, 'UnitNumber')))
const areaValue = computed(() => formatAreaNumber(g(props.unit, 'Area')))

const sellingPrice = computed(() => Number(g(props.salesContract, 'SellingPrice')))
const rate = computed(() => Number(g(props.salesContract, 'ExchangeRateUsd')))
const isUsd = computed(() => rate.value > 0 && sellingPrice.value > 0)

const totalPriceText = computed(() => {
  if (!(sellingPrice.value > 0)) return ''
  return isUsd.value
    ? formatMoneyCompact(sellingPrice.value / rate.value) + '$'
    : formatMoneyCompact(sellingPrice.value) + ' دينار عراقي'
})

const finance = computed(() => ({
  contractType: props.contractTypeLabel || '—',
  paymentType: props.paymentTypeLabel || '—',
  status: props.contractStatusLabel || '—',
  salesAgent: props.salesAgentName || '—',
}))

const yearsText = computed(() => {
  const y = g(props.salesContract, 'Years')
  return y === null || y === undefined || y === '' ? '—' : String(y)
})

const paymentIntervalText = computed(() => {
  const m = Number(g(props.salesContract, 'PaymentIntervalMonths'))
  if (!isFinite(m) || m <= 0) return '—'
  if (m === 1) return 'شهري'
  if (m === 3) return 'كل 3 أشهر'
  if (m === 6) return 'كل 6 أشهر'
  if (m === 12) return 'سنوي'
  return `كل ${m} أشهر`
})

const meterPriceText = computed(() => {
  const ppm = props.pricePerMeter != null ? Number(props.pricePerMeter) : NaN
  const area = Number(g(props.unit, 'Area'))
  if (isFinite(ppm) && ppm > 0) {
    if (rate.value > 0) {
      if (ppm < 100_000) return formatMoneyCompact(ppm) + ' $'
      return formatMoneyCompact(ppm / rate.value) + ' $'
    }
    return moneyText(ppm)
  }
  if (area > 0 && sellingPrice.value > 0 && rate.value > 0) {
    return formatMoneyCompact(sellingPrice.value / area / rate.value) + ' $'
  }
  if (area > 0 && sellingPrice.value > 0) {
    return moneyText(sellingPrice.value / area)
  }
  return '—'
})

const paymentRows = computed(() => {
  const sc = props.salesContract || {}
  const schedule = g(sc, 'PaymentSchedule')
  if (Array.isArray(schedule) && schedule.length > 0) {
    return schedule.map((r, i) => ({
      label: clean(g(r, 'Name')) || `الدفعة ${Number(g(r, 'Index')) || i + 1}`,
      dueDate: formatDate(g(r, 'DueDate')),
      amount: Number(g(r, 'Amount')) || 0,
    }))
  }

  const rows = []
  const dpInst = g(sc, 'DownPaymentInstallments')
  if (Array.isArray(dpInst) && dpInst.length > 0) {
    for (const d of dpInst) {
      rows.push({
        label: clean(g(d, 'Name')) || 'المقدمة',
        dueDate: formatDate(g(d, 'DueDate')),
        amount: Number(g(d, 'Amount')) || 0,
      })
    }
  } else {
    const dpSched = g(sc, 'DownPaymentSchedule')
    if (Array.isArray(dpSched) && dpSched.length > 0) {
      for (const d of dpSched) {
        rows.push({
          label: clean(g(d, 'Name')) || 'المقدمة',
          dueDate: formatDate(g(d, 'DueDate')),
          amount: Number(g(d, 'Amount')) || 0,
        })
      }
    } else {
      const dp = Number(g(sc, 'DownPayment')) || 0
      if (dp > 0) {
        rows.push({
          label: 'المقدمة',
          dueDate: formatDate(g(sc, 'ContractDate')),
          amount: dp,
        })
      }
    }
  }

  const financed = Number(g(sc, 'FinancedAmount')) || 0
  if (financed > 0) {
    rows.push({ label: 'دفعة قرض مصرف العقاري', dueDate: '', amount: financed })
  }

  const delivery = Number(g(sc, 'DeliveryAmount')) || 0
  if (delivery > 0) {
    rows.push({
      label: 'مبلغ الاستلام',
      dueDate: formatDate(g(sc, 'DeliveryDate')),
      amount: delivery,
    })
  }

  const installments = g(sc, 'Installments')
  if (Array.isArray(installments)) {
    installments.forEach((inst, i) => {
      rows.push({
        label: clean(g(inst, 'Name')) || `الدفعة ${i + 1}`,
        dueDate: formatDate(g(inst, 'DueDate')),
        amount: Number(g(inst, 'Amount')) || 0,
      })
    })
  }

  return rows
})

function moneyText(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  if (rate.value > 0) {
    const usd = Math.round((n / rate.value) * 100) / 100
    return formatMoneyCompact(usd, 2) + ' $'
  }
  return formatMoneyCompact(n, 0) + ' د.ع'
}

function formatDate(value) {
  if (!value) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value))
  if (m) return `${m[1]}/${m[2]}/${m[3]}`
  const d = new Date(value)
  if (isNaN(d)) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`
}

function formatAreaNumber(v) {
  const n = Number(v)
  if (!isFinite(n) || v === null || v === '') return ''
  return String(Math.round(n * 100) / 100)
}

function formatMoneyCompact(v, fractionDigits = 0) {
  const n = Number(v)
  if (!isFinite(n)) return ''
  const fixed =
    fractionDigits > 0 ? n.toFixed(fractionDigits) : String(Math.round(n))
  const [intPart, dec] = fixed.split('.')
  // فاصل الآلاف نقطة كما في نص العقد؛ الفاصلة العشرية إن وُجدت تبقى نقطة لاتينية
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (!dec || /^0+$/.test(dec)) return withDots
  return `${withDots}.${dec.replace(/0+$/, '')}`
}
</script>

<style>
/* الطباعة: A4 بنفس هوامش ملف الـ Word (الهامش العلوي الكبير مخصص للورق الرسمي) */
@page {
  size: A4;
  margin: 57mm 20mm 34mm 20mm;
  @bottom-center { content: counter(page); font-family: 'Times New Roman', serif; font-size: 11pt; }
}
</style>

<style scoped>
.contract {
  font-family: 'Times New Roman', Times, 'Traditional Arabic', serif;
  font-size: 14pt;
  line-height: 1.5;
  color: #000;
  text-align: justify;
  direction: rtl;
  background: #fff;
  /* شاشة: عرض ورقة A4 بنفس الهوامش */
  width: 210mm;
  box-sizing: border-box;
  padding: 57mm 20mm 34mm 20mm;
  margin: 0 auto;
}
.contract p { margin: 0 0 8pt; }
.title { font-size: 16pt; font-weight: bold; text-align: center; margin: 0 0 8pt; line-height: 1.5; }
.b { font-weight: bold; }
.h { font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 8pt 0; line-height: 1.5; text-align: right; }
.h.nu { text-decoration: none; }
.nu { text-decoration: none; }

.list { margin: 0 0 8pt; padding: 0 22pt 0 0; }  /* RTL: الترقيم على اليمين */
.list li { margin: 0 0 6pt; padding-right: 4pt; }
.list li::marker { content: counter(list-item) '- '; font-weight: bold; }

/* أماكن المتغيرات */
.v { font-weight: inherit; }
.hl-vars .v { background: #fff3a3; outline: 1px dashed #c9a400; padding: 0 2px; }
.hl-vars .v:empty::before { content: attr(data-var); color: #999; font-size: 10pt; }

/* التواقيع: الطرف الأول يمين، الطرف الثاني يسار */
.signatures { display: flex; justify-content: space-between; gap: 24pt; margin-top: 18pt; font-weight: bold; text-align: center; break-inside: avoid; }
.sig { width: 48%; }
.sig p { margin: 0 0 4pt; }

/* صفحة المرفقات */
.annex { break-before: page; page-break-before: always; }
.plan { min-height: 140mm; display: flex; align-items: center; justify-content: center; }
.plan :deep(img) { max-width: 100%; max-height: 150mm; }

.finance-annex .pay-title { margin-top: 16pt; }
.fin-grid,
.pay-table {
  width: 100%;
  border-collapse: collapse;
  margin: 6pt 0 12pt;
  font-size: 11pt;
  table-layout: fixed;
}
.fin-grid th,
.fin-grid td,
.pay-table th,
.pay-table td {
  border: 1px solid #222;
  padding: 5pt 6pt;
  text-align: center;
  vertical-align: middle;
}
.fin-grid th,
.pay-table th {
  background: #f3f3f3;
  font-weight: bold;
}
.fin-grid th { width: 18%; }
.fin-grid td { width: 32%; }

@media print {
  .contract { width: auto; padding: 0; margin: 0; }
  .h, .title { break-after: avoid; }
}
@media screen {
  .contract { box-shadow: 0 0 6px rgba(0, 0, 0, .25); margin-top: 12px; margin-bottom: 12px; }
}
</style>
