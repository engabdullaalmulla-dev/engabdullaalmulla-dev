/* Café Life: authored offline content. Player-facing copy always has English and Arabic. */
(function (root, factory) {
  const content = factory();
  if (typeof module === 'object' && module.exports) module.exports = content;
  root.CafeContent = content;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const L = (en, ar) => ({ en, ar });
  const recipe = (id, en, ar, de, da, tags, price, cost, art, unlockDay) =>
    ({ id, name: L(en, ar), description: L(de, da), tags, price, cost, art, unlockDay });
  const recipes = [
    recipe('karak', 'House karak', 'كرك الدار', 'Strong tea, warm spice. Mariam knows the first sip.', 'شاي ثقيل وبهارات دافئة. مريم تعرفه من أول رشفة.', ['familiar', 'warm'], 8, 2, 'karak', 1),
    recipe('regag', 'Cheese regag', 'رقاق بالجبن', 'Crisp, light and ready for a busy morning.', 'خفيف ومقرمش، يناسب الصباح المزدحم.', ['quick', 'familiar'], 12, 4, 'regag', 1),
    recipe('luqaimat', 'Luqaimat to share', 'لقيمات للمشاركة', 'A golden plate that gets the whole table talking.', 'طبق ذهبي يجمع أحاديث الطاولة.', ['sharing', 'familiar'], 18, 7, 'luqaimat', 1),
    recipe('mint', 'Fresh mint tea', 'شاي بالنعناع', 'A bright little pause. Noor’s notebook companion.', 'استراحة منعشة ترافق دفتر نور.', ['familiar', 'warm'], 7, 2, 'mint', 1),
    recipe('espresso', 'Little espresso', 'إسبريسو صغير', 'Small cup, big character. Made for people on the move.', 'فنجان صغير بطعم قوي، لمن يحب قهوته على السريع.', ['quick', 'special'], 11, 4, 'espresso', 2),
    recipe('qahwa', 'Arabic coffee', 'قهوة عربية', 'Cardamom, a generous pour and a good conversation.', 'هيل وصبّة كريمة وحديث طيب.', ['familiar', 'sharing', 'warm'], 10, 3, 'qahwa', 3),
    recipe('chebab', 'Saffron chebab', 'جباب بالزعفران', 'Soft breakfast pancakes with a family story.', 'خبز طري للفطور، يحمل حكاية من البيت.', ['sharing', 'familiar'], 19, 8, 'chebab', 4),
    recipe('iced', 'Iced house coffee', 'قهوة الدار المثلجة', 'Cool coffee for warm streets and fresh ideas.', 'قهوة باردة لحر الشارع والأفكار الجديدة.', ['cool', 'quick'], 15, 6, 'iced', 5),
    recipe('roselem', 'Rose lemonade', 'ليمون بالورد', 'A fragrant glass inspired by Salma’s flower stall.', 'كوب معطّر مستوحى من محل سلمى للزهور.', ['cool', 'special'], 16, 6, 'roselem', 6),
    recipe('khameer', 'Warm khameer', 'خمير دافئ', 'Soft bread, sesame and time around the table.', 'خبز طري وسمسم وجلسة تطول حول الطاولة.', ['familiar', 'sharing'], 15, 5, 'khameer', 7),
    recipe('latte', 'Velvet latte', 'لاتيه ناعم', 'A gentle coffee for a longer conversation.', 'قهوة ناعمة لحديث على مهل.', ['warm', 'familiar'], 17, 7, 'latte', 8),
    recipe('dateshake', 'Date milkshake', 'مخفوق التمر', 'Dates and cold milk. Sweet without showing off.', 'تمر وحليب بارد. حلاوة على طبيعتها.', ['cool', 'sharing'], 20, 8, 'dateshake', 9),
    recipe('balaleet', 'Breakfast balaleet', 'بلاليط الفطور', 'Sweet vermicelli and egg: the breakfast conversation starter.', 'شعيرية حلوة وبيض، فطور له عشّاقه.', ['sharing', 'special'], 23, 10, 'balaleet', 11),
    recipe('saffron', 'Saffron karak', 'كرك بالزعفران', 'A fragrant variation for a small, devoted following.', 'لمسة زعفران معطّرة لها محبّوها.', ['special', 'warm'], 19, 9, 'saffron', 13),
    recipe('maamoul', 'Date maamoul', 'معمول بالتمر', 'Small pastries for a cup, a visit or a gift.', 'قطع صغيرة لفنجان قهوة أو زيارة أو هدية.', ['quick', 'sharing'], 14, 5, 'maamoul', 15),
    recipe('sahlab', 'Winter sahlab', 'سحلب الشتاء', 'Warm milk and cinnamon for a cool evening.', 'حليب دافئ وقرفة لأمسية باردة.', ['warm', 'special'], 18, 8, 'sahlab', 17),
    recipe('jallab', 'Chilled jallab', 'جلاب بارد', 'Date and grape sweetness for a sunny table.', 'حلاوة التمر والعنب لجلسة تحت الشمس.', ['cool', 'sharing'], 18, 7, 'jallab', 19),
    recipe('kunafa', 'Little kunafa', 'كنافة صغيرة', 'A warm celebration with a crisp golden top.', 'احتفال دافئ بقشرة ذهبية مقرمشة.', ['sharing', 'special', 'warm'], 27, 13, 'kunafa', 21),
    recipe('affogato', 'Coffee affogato', 'أفوغاتو بالقهوة', 'Hot coffee meets ice cream. Best enjoyed right here.', 'قهوة ساخنة تلتقي بالمثلجات. ألذّ ما تكون هنا.', ['special', 'cool'], 25, 12, 'affogato', 24),
    recipe('basbousa', 'Rose basbousa', 'بسبوسة بالورد', 'A soft cake for the table that always has room for one more.', 'حلوى طرية لطاولة تتّسع دائماً لشخص آخر.', ['sharing', 'familiar'], 20, 8, 'basbousa', 27)
  ];

  const characters = [
    { id: 'mariam', name: L('Mariam', 'مريم'), role: L('The neighbour who remembers everyone', 'جارة لا تنسى أحداً'), usual: 'karak', art: 'p4', birthYear: 1964, tags: ['familiar', 'sharing'], arcs: ['mariam-1', 'mariam-2', 'mariam-3', 'mariam-4'] },
    { id: 'noor', name: L('Noor', 'نور'), role: L('A student with a sketchbook', 'طالبة لا تفارق دفتر الرسم'), usual: 'mint', art: 'p5', birthYear: 1974, tags: ['special', 'cool'], arcs: ['noor-1', 'noor-2', 'noor-3', 'noor-4'] },
    { id: 'hassan', name: L('Hassan', 'حسن'), role: L('The street’s unofficial historian', 'مؤرّخ الشارع غير الرسمي'), usual: 'qahwa', art: 'p3', birthYear: 1948, tags: ['warm', 'familiar'], arcs: ['hassan-1', 'hassan-2', 'hassan-3', 'hassan-4'] },
    { id: 'salma', name: L('Salma', 'سلمى'), role: L('The florist next door', 'صاحبة محل الزهور المجاور'), usual: 'roselem', art: 'p2', birthYear: 1966, tags: ['special', 'cool'], arcs: ['salma-1', 'salma-2', 'salma-3', 'salma-4'] },
    { id: 'omar', name: L('Omar', 'عمر'), role: L('A musician with a day job', 'موسيقي يعمل نهاراً'), usual: 'espresso', art: 'p1', birthYear: 1969, tags: ['quick', 'special'], arcs: ['omar-1', 'omar-2', 'omar-3', 'omar-4'] },
    { id: 'grandmother', name: L('Um Saeed', 'أم سعيد'), role: L('Keeper of the family recipes', 'حافظة وصفات العائلة'), usual: 'chebab', art: 'p12', birthYear: 1924, tags: ['familiar', 'sharing'], arcs: ['grandmother-1', 'grandmother-2', 'grandmother-3', 'grandmother-4'] }
  ];

  const choice = (id, en, ar, de, da, re, ra, me, ma, kind, rewardCash, reputation, extra) =>
    Object.assign({ id, label: L(en, ar), description: L(de, da), result: L(re, ra), memory: L(me, ma), kind, rewardCash, reputation }, extra || {});
  const story = (character, chapter, minDay, en, ar, be, ba, choices) => ({
    id: character + '-' + chapter, character, chapter, minDay,
    requires: chapter > 1 ? character + '-' + (chapter - 1) : null,
    title: L(en, ar), body: L(be, ba), choices
  });

  const stories = [
    story('mariam', 1, 1, 'A table for old friends', 'طاولة لصديقات قديمات',
      'Mariam unfolds a school photograph. Four friends, twenty years to catch up. “Could we meet here?” What kind of reunion will you give them?',
      'تفتح مريم صورة من أيام المدرسة. أربع صديقات وعشرون عاماً من الأخبار. «نجتمع عندك؟» أيّ لقاء ستعدّ لهن؟', [
      choice('breakfast', 'Bring everyone to the table', 'نجمعهنّ على الفطور', 'Shared plates and familiar favourites.', 'أطباق للمشاركة ونكهات مألوفة.', 'The photograph starts the laughter. Breakfast keeps it going. Mariam leaves a copy for your wall.', 'تبدأ الضحكات مع الصورة وتستمرّ على الفطور. تترك مريم نسخة للصورة على جدارك.', 'Four friends, twenty years later', 'أربع صديقات بعد عشرين عاماً', 'people', 45, 3),
      choice('tasting', 'Make it a tasting afternoon', 'نجعلها جلسة تذوّق', 'Let the friends help shape a house recipe.', 'الصديقات يشاركن في وصفة للمقهى.', 'Four very different opinions somehow become one lovely saffron karak. You write down their recipe.', 'تتحوّل أربعة آراء مختلفة إلى كرك رائع بالزعفران. تدوّن وصفتهنّ.', 'The reunion’s saffron recipe', 'وصفة الزعفران من لقاء الصديقات', 'recipe', 25, 1, { recipe: 'saffron' }),
      choice('picnic', 'Pack a picnic together', 'نجهّز سلة نزهة', 'Send the laughter out into the neighbourhood.', 'نرسل الضحكات في نزهة حول الحي.', 'They return with an empty basket and an introduction to the park’s community organiser.', 'يعدن بسلة فارغة ومعهنّ منظّمة أنشطة الحديقة لتتعرّف إليك.', 'The picnic that made introductions', 'نزهة فتحت باب التعارف', 'street', 70, 1)
    ]),
    story('mariam', 2, 5, 'An extra chair', 'كرسي إضافي',
      'After the reunion, Mariam notices a new neighbour eating alone. “We were all new once.” She has a plan; it involves your busiest table.',
      'بعد اللقاء، تلاحظ مريم جارة جديدة تأكل وحدها. «كلّنا كنّا جدداً يوماً.» لديها فكرة، وطاولتك الأكثر انشغالاً جزء منها.', [
      choice('welcome', 'Start a welcome table', 'نخصّص طاولة للتعارف', 'Invite anyone who wants company.', 'ندعو من يحبّ الجلوس مع الآخرين.', 'One introduction becomes six. A small handwritten card now reads: “There is room here.”', 'يتحوّل تعارف واحد إلى ستة. وتظهر بطاقة صغيرة: «لك مكان هنا».', 'A table with room for one more', 'طاولة تتّسع لشخص آخر', 'people', 50, 3),
      choice('notes', 'Let people introduce themselves', 'نترك للناس رسائل التعارف', 'Create a little neighbourhood noticeboard.', 'نضع لوحة صغيرة لرسائل أهل الحي.', 'Someone offers sewing lessons. Someone needs a chess partner. Mariam claims she predicted both.', 'شخص يعرض دروس خياطة وآخر يبحث عن شريك شطرنج. مريم تقول إنها توقّعت الأمرين.', 'The first neighbourhood noticeboard', 'أول لوحة لرسائل الحي', 'street', 75, 1),
      choice('recipe', 'Share a welcome recipe', 'نشارك وصفة ترحيب', 'Food can make the first introduction.', 'الطعام يبدأ التعارف.', 'Your new neighbour brings khameer from home and teaches you the family method. The next visit is easy.', 'تحضر الجارة الجديدة خميراً من بيتها وتعلّمك طريقة العائلة. تصبح الزيارة التالية أسهل.', 'Khameer and a new neighbour', 'خمير وجارة جديدة', 'recipe', 30, 1, { recipe: 'khameer' })
    ]),
    story('mariam', 3, 12, 'The table is too successful', 'نجاح يفوق سعة الطاولة',
      'The quiet readers and the lively storytellers both love your gathering. They do not agree on the volume. Mariam slides you two perfectly polite complaint notes.',
      'القرّاء الهادئون وأصحاب الحكايات يحبّون لقاءات المقهى، لكنهم لا يتّفقون على مستوى الصوت. تمدّ لك مريم رسالتي شكوى في غاية الأدب.', [
      choice('corners', 'Give each group a corner', 'ركن لكلّ مجموعة', 'Make two kinds of company feel welcome.', 'مكان يناسب كلا النوعين من الجلسات.', 'Books move to the window; stories move to the long table. At closing, the two groups exchange recommendations.', 'تنتقل الكتب إلى النافذة والحكايات إلى الطاولة الطويلة. وعند الإغلاق تتبادل المجموعتان الاقتراحات.', 'Two corners, one café', 'ركنان ومقهى واحد', 'people', 65, 3),
      choice('exchange', 'Ask them to trade a story', 'نتبادل قصة وقراءة', 'Give the occasion one shared purpose.', 'نمنح اللقاء هدفاً مشتركاً.', 'A reader recommends a novel. A storyteller reveals she knew its author. Nobody remembers the complaints.', 'يقترح قارئ رواية، فتقول إحدى الحاضرات إنها تعرف كاتبها. ينسى الجميع الشكوى.', 'When the reading circle met the storytellers', 'يوم التقى القرّاء بأصحاب الحكايات', 'street', 90, 2)
    ]),
    story('mariam', 4, 23, 'Someone should keep this', 'لا بدّ أن نحفظ هذا',
      'Mariam arrives with a tin full of photographs and notes. “We have accidentally made a tradition.” Where should its story live?',
      'تصل مريم بعلبة مليئة بالصور والرسائل. «يبدو أننا صنعنا تقليداً دون قصد.» أين نحفظ حكاية هذه اللقاءات؟', [
      choice('wall', 'Make a wall of familiar faces', 'نصنع جدار الوجوه المألوفة', 'Let the room remember its people.', 'نجعل الغرفة تحفظ وجوه أهلها.', 'Guests point themselves out, then bring somebody new to see. Mariam saves the centre space for your family.', 'يشير الضيوف إلى صورهم ثم يعودون مع أشخاص جدد لرؤيتها. تترك مريم وسط الجدار لعائلتك.', 'Mariam’s wall of familiar faces', 'جدار مريم للوجوه المألوفة', 'people', 120, 4),
      choice('book', 'Bind a neighbourhood book', 'نجمع كتاباً للحي', 'Put recipes beside the people who shared them.', 'وصفات إلى جانب حكايات أصحابها.', 'The first copy has flour on its cover before it leaves the counter. Um Saeed contributes her maamoul recipe.', 'تصل أول نسخة إلى المنضدة وعليها آثار الدقيق. تضيف أم سعيد وصفة المعمول.', 'The book everyone helped write', 'الكتاب الذي شارك الجميع في كتابته', 'recipe', 85, 2, { recipe: 'maamoul' }),
      choice('street', 'Take the tradition outside', 'نوسّع اللقاء إلى الشارع', 'Invite the neighbouring shops into the story.', 'ندعو المحلات المجاورة لتشاركنا الحكاية.', 'The florist brings flowers, the tailor brings a cloth, and the whole street fits into one photograph.', 'تحضر بائعة الزهور باقة ويأتي الخيّاط بمفرش. ويجتمع الشارع كلّه في صورة واحدة.', 'The street’s first shared photograph', 'أول صورة تجمع أهل الشارع', 'street', 160, 2)
    ]),

    story('noor', 1, 2, 'The sketch under the saucer', 'الرسم تحت الصحن',
      'Noor has drawn your café on the back of her assignment. The sign is crooked. So is the real one. “I can fix one of those,” she says.',
      'رسمت نور مقهاك خلف واجبها. اللافتة مائلة في الرسم، وفي الحقيقة أيضاً. تقول: «أقدر أعدّل واحدة منهما».', [
      choice('sign', 'Let her design the sign', 'نترك لها تصميم اللافتة', 'Give her first commission a real home.', 'نمنح أول أعمالها مكاناً حقيقياً.', 'Noor redraws the lettering around a tiny cup. She takes three photographs before admitting she is pleased.', 'تعيد نور رسم الحروف حول فنجان صغير. تلتقط ثلاث صور قبل أن تعترف بسعادتها.', 'Noor’s first sign', 'أول لافتة تصمّمها نور', 'street', 50, 2),
      choice('gallery', 'Put the sketch on the wall', 'نعلّق الرسم على الجدار', 'Show the neighbourhood through her eyes.', 'نرى الحي بعينيها.', 'A customer recognises his bicycle in the drawing and asks to buy a print. Noor nearly spills her tea.', 'يتعرّف زبون إلى دراجته في الرسم ويطلب شراء نسخة. تكاد نور تسكب الشاي من المفاجأة.', 'The sketch that found an audience', 'رسم وجد جمهوره', 'people', 30, 3)
    ]),
    story('noor', 2, 6, 'A very small exhibition', 'معرض صغير جداً',
      'Noor’s tutor wants her to show a finished project. “A gallery feels too serious. Would a café count?” She has enough work for one small corner.',
      'تطلب المشرفة من نور عرض مشروع مكتمل. «المعرض الرسمي يرهبني. ينفع أعرض في مقهى؟» لديها أعمال تكفي لركن صغير.', [
      choice('street', 'Exhibit the ordinary street', 'نعرض تفاصيل الشارع', 'Celebrate things people walk past every day.', 'نحتفي بما يمرّ الناس بجانبه كلّ يوم.', 'People linger over the painted water cooler and delivery bicycle. Ordinary things suddenly feel precious.', 'يتأمّل الناس رسمة برّادة الماء ودراجة التوصيل. تبدو التفاصيل العادية ثمينة فجأة.', 'Noor’s little street exhibition', 'معرض نور لتفاصيل الشارع', 'street', 80, 2),
      choice('cups', 'Pair each sketch with a drink', 'نقرن كلّ رسمة بمشروب', 'Make a tiny illustrated tasting menu.', 'نصنع قائمة تذوّق مصوّرة.', 'The blue window sketch inspires a cool house coffee. Noor signs the menu, very small, in the corner.', 'تلهم النافذة الزرقاء قهوة باردة للمقهى. توقّع نور القائمة بخط صغير في الزاوية.', 'The illustrated coffee menu', 'قائمة القهوة المصوّرة', 'recipe', 40, 1, { recipe: 'iced' }),
      choice('workshop', 'Invite people to draw with her', 'ندعو الناس للرسم معها', 'Make the exhibition a shared experience.', 'نحوّل المعرض إلى تجربة مشتركة.', 'Hassan draws a boat that looks suspiciously like a potato. Noor hangs it beside her best piece.', 'يرسم حسن قارباً يشبه حبّة بطاطس. تعلّقه نور إلى جانب أفضل أعمالها.', 'Everyone can draw a boat', 'كلّنا نقدر نرسم قارباً', 'people', 55, 3)
    ]),
    story('noor', 3, 14, 'The first proper offer', 'أول عرض جادّ',
      'A print shop offers to sell Noor’s drawings, but wants only the glamorous skyline. She likes the little street. “Can ordinary places be enough?”',
      'تعرض مطبعة بيع رسومات نور، لكنها تريد الأبراج اللامعة فقط. نور تحبّ الشارع الصغير. «الأماكن العادية تستحقّ الرسم، صح؟»', [
      choice('local', 'Help her publish the street series', 'ندعم مجموعة رسومات الحي', 'Give her own voice a place to grow.', 'نمنح أسلوبها الخاص مساحة للنمو.', 'The first set sells to the very people in the pictures. Noor writes “ordinary is enough” inside her sketchbook.', 'تُباع المجموعة الأولى للأشخاص الظاهرين فيها. تكتب نور في دفترها: «العادي يستحقّ».', 'Ordinary is enough', 'العادي يستحقّ', 'people', 85, 3),
      choice('both', 'Find the street inside the skyline', 'نبحث عن الحي وسط الأبراج', 'Combine ambition with the details she loves.', 'نجمع الطموح بالتفاصيل التي تحبّها.', 'Noor paints the towers reflected in your tea glasses. The print shop orders the whole series.', 'ترسم نور الأبراج منعكسة في كؤوس الشاي. تطلب المطبعة المجموعة كاملة.', 'A skyline inside a tea glass', 'أفق المدينة في كأس شاي', 'street', 125, 2)
    ]),
    story('noor', 4, 26, 'The next blank page', 'الصفحة البيضاء التالية',
      'Noor brings her first printed book. The dedication names your café. Now a shy student is hovering by her exhibition, holding a blank sketchbook.',
      'تحضر نور أول كتاب مطبوع لها. اسم مقهاك في الإهداء. وعند المعرض تقف طالبة خجولة تحمل دفتر رسم فارغاً.', [
      choice('mentor', 'Make room for the next artist', 'نفسح مكاناً للفنّانة التالية', 'Let Noor pass on her first opportunity.', 'تمنح نور غيرها فرصة تشبه بدايتها.', 'Noor offers the student a pencil and the same wall you once offered her. A new little exhibition begins.', 'تعطي نور الطالبة قلماً وتعرض عليها الجدار الذي منحتها إياه. يبدأ معرض صغير جديد.', 'The wall that keeps making beginnings', 'الجدار الذي يمنح بدايات جديدة', 'people', 130, 4),
      choice('book', 'Make a café edition of her book', 'نصدر نسخة خاصة بالمقهى', 'Keep an illustrated record of this place.', 'نحفظ حكاية المكان بالرسومات.', 'The edition opens with your crooked old sign and ends with a crowded café. Noor insists the crooked one stays.', 'تبدأ النسخة بلافتتك القديمة المائلة وتنتهي بمقهى عامر. تصرّ نور على إبقاء اللافتة المائلة.', 'A café drawn over many pages', 'مقهى بين صفحات كثيرة', 'street', 170, 2)
    ]),

    story('hassan', 1, 3, 'The map is upside down', 'الخريطة مقلوبة',
      'Hassan draws the old waterfront on a napkin. Two neighbours insist the bakery was on the other side. Someone has turned the napkin around.',
      'يرسم حسن الواجهة البحرية القديمة على منديل. يؤكّد جاران أن المخبز كان في الجهة الأخرى. يبدو أن أحدهم قلب المنديل.', [
      choice('map', 'Make a map together', 'نرسم الخريطة معاً', 'Give every memory its own little landmark.', 'نعطي كلّ ذكرى علامة على الخريطة.', 'The bakery moves three times before everyone agrees. Your café earns a star on the new map.', 'يتغيّر مكان المخبز ثلاث مرات قبل أن يتّفق الجميع. ويحصل مقهاك على نجمة في الخريطة.', 'The napkin map of the old street', 'خريطة الشارع القديم على منديل', 'street', 60, 2),
      choice('coffee', 'Ask for the story over coffee', 'نسمع الحكاية على القهوة', 'Follow the people instead of the directions.', 'نتبع حكايات الناس بدلاً من الاتجاهات.', 'Hassan explains how coffee used to be served at the harbour. You learn the cardamom blend he remembers.', 'يحكي حسن عن تقديم القهوة في الميناء. تتعلّم خلطة الهيل التي يتذكّرها.', 'Hassan’s harbour coffee', 'قهوة الميناء من حسن', 'recipe', 30, 1, { recipe: 'qahwa' })
    ]),
    story('hassan', 2, 8, 'The weather expert', 'خبير الطقس',
      'Hassan promises a cool breeze. Outside, a napkin refuses to move. His friends appoint your café the official weather station. Hassan looks betrayed.',
      'يعد حسن بنسمة باردة، لكن المنديل خارج المقهى لا يتحرّك. يعلن أصدقاؤه مقهاك محطة رسمية للطقس. ينظر إليهم باستنكار.', [
      choice('humour', 'Post a forecast in cups', 'ننشر النشرة بالفناجين', 'Today: a strong chance of another karak.', 'اليوم: احتمال كبير لفنجان كرك آخر.', 'The playful forecast becomes a talking point. Hassan writes tomorrow’s prediction in very small letters.', 'تصبح النشرة المرحة حديث الزبائن. يكتب حسن توقّع الغد بخط صغير جداً.', 'A strong chance of another cup', 'احتمال كبير لفنجان آخر', 'people', 65, 3),
      choice('cool', 'Invent a drink for the heat', 'نبتكر مشروباً للحر', 'Let the weather suggest something useful.', 'نجعل الطقس يلهمنا شيئاً مفيداً.', 'Hassan recommends dates and cold milk. “That,” he says, “I can predict with confidence.”', 'يقترح حسن التمر مع الحليب البارد. يقول: «هذا التوقّع أضمنه».', 'A forecast made of dates and milk', 'توقّع بطعم التمر والحليب', 'recipe', 35, 1, { recipe: 'dateshake' })
    ]),
    story('hassan', 3, 17, 'A letter from the harbour', 'رسالة من الميناء',
      'An old colleague sends Hassan a photograph of their first boat. He says it was magnificent. The photograph suggests it was mostly repairs.',
      'يرسل زميل قديم لحسن صورة قاربهما الأول. يقول حسن إنه كان رائعاً. أمّا الصورة فتشير إلى أنه كان بحاجة دائمة للتصليح.', [
      choice('reunion', 'Help them meet at the café', 'نجمعهما في المقهى', 'Let the two versions of the story meet.', 'نسمع الروايتين في مكان واحد.', 'His friend arrives with a bolt from the boat. They disagree about everything except how much they miss those days.', 'يصل صديقه ومعه مسمار من القارب. يختلفان على كلّ شيء إلا اشتياقهما لتلك الأيام.', 'Two captains and one very small boat', 'قبطانان وقارب صغير جداً', 'people', 95, 3),
      choice('record', 'Write down the harbour stories', 'ندوّن حكايات الميناء', 'Keep the details that photographs cannot hold.', 'نحفظ ما لا تستطيع الصور قوله.', 'Noor illustrates a page while Hassan talks. Even the repairs become part of a beautiful story.', 'ترسم نور صفحة وهو يحكي. حتى أعمال التصليح تصبح جزءاً من حكاية جميلة.', 'The boat with a hundred repairs', 'القارب الذي أُصلح مئة مرة', 'street', 115, 2)
    ]),
    story('hassan', 4, 29, 'A walk worth taking', 'جولة تستحقّ المشي',
      'People keep asking Hassan about the old map. He suggests a short neighbourhood walk, ending here. “No lecture,” he promises. He has brought seventeen pages.',
      'يسأل الناس حسن باستمرار عن الخريطة القديمة. يقترح جولة قصيرة في الحي تنتهي هنا. يعدهم: «من دون محاضرة». ثم يُخرج سبع عشرة صفحة.', [
      choice('walk', 'Let the street tell the story', 'نجعل الشارع يحكي', 'A few stops, a few voices, then coffee.', 'محطّات قليلة وأصوات مختلفة، ثم قهوة.', 'Shopkeepers add their memories along the way. Hassan returns delighted that he did not have to do all the talking.', 'يضيف أصحاب المحلات ذكرياتهم في الطريق. يعود حسن سعيداً لأنه لم يحتج للكلام وحده.', 'The walk that ended in coffee', 'الجولة التي انتهت بالقهوة', 'street', 175, 3),
      choice('table', 'Bring the walk to the table', 'ننقل الجولة إلى الطاولة', 'Make the stories easy for everyone to join.', 'نجعل الحكايات متاحة للجميع.', 'The map becomes a tablecloth of places and memories. Even guests who cannot join a walk get to travel with Hassan.', 'تتحوّل الخريطة إلى مفرش من الأماكن والذكريات. ويسافر مع حسن حتى من لا يستطيع المشي.', 'A whole neighbourhood on one table', 'حيّ كامل على طاولة واحدة', 'people', 130, 4)
    ]),

    story('salma', 1, 4, 'Flowers with nowhere to go', 'زهور تبحث عن مكان',
      'A cancelled order has left Salma with a bucket of lovely flowers. “They deserve a better afternoon than my storeroom.”',
      'ترك طلب ملغى عند سلمى باقة كبيرة من الزهور الجميلة. تقول: «تستحقّ عصراً أجمل من المخزن».', [
      choice('tables', 'Put a bloom on every table', 'زهرة على كلّ طاولة', 'Give an ordinary afternoon a little colour.', 'نضيف لوناً إلى عصر عادي.', 'Customers ask about the flowers, then wander next door. Salma brings you a little vase to keep.', 'يسأل الزبائن عن الزهور ثم يزورون محلّها. تحضر سلمى مزهرية صغيرة لتبقى عندك.', 'An afternoon of borrowed flowers', 'عصر تزيّن بزهور الجيران', 'people', 45, 3),
      choice('drink', 'Let the flowers inspire a drink', 'نستوحي مشروباً من الزهور', 'Use food-grade rosewater from the kitchen.', 'نستخدم ماء الورد المخصّص للطعام من المطبخ.', 'Rosewater and lemon make a fragrant new favourite. Salma approves the colour before tasting it.', 'يصنع ماء الورد والليمون مشروباً معطّراً جديداً. توافق سلمى على اللون قبل أن تتذوّقه.', 'Salma’s rose lemonade', 'ليمون سلمى بالورد', 'recipe', 25, 1, { recipe: 'roselem' }),
      choice('gifts', 'Send flowers down the street', 'نوزّع الزهور في الشارع', 'Make the whole row of shops feel included.', 'نجعل صفّ المحلات كلّه يشاركنا.', 'A flower appears beside every till. By evening, three shopkeepers have come in to say thank you.', 'تظهر زهرة بجانب صندوق كلّ محل. وفي المساء يزورك ثلاثة من أصحاب المحلات للشكر.', 'The day every shop had a flower', 'اليوم الذي أزهر فيه كلّ محل', 'street', 70, 1)
    ]),
    story('salma', 2, 10, 'Two kinds of shade', 'ظلّ يناسب الجميع',
      'Salma wants a green corner outside. Hassan wants a clear view of the street. They have both drawn a plan on the same piece of paper.',
      'تريد سلمى ركناً أخضر في الخارج، ويريد حسن رؤية واضحة للشارع. وقد رسما خطّتيهما على الورقة نفسها.', [
      choice('low', 'Choose low plants and a shared bench', 'نختار نباتات قصيرة ومقعداً مشتركاً', 'Keep the view and make room to linger.', 'نحافظ على المنظر ونضيف مكاناً للجلوس.', 'Hassan can see the street. Salma can see green. Neither admits the other helped improve the plan.', 'يرى حسن الشارع وترى سلمى الخضرة. لا يعترف أيّ منهما بأن الآخر حسّن الخطة.', 'The bench everyone helped design', 'المقعد الذي صمّمه الجميع', 'people', 75, 3),
      choice('pots', 'Turn the entrance into a little garden', 'نحوّل المدخل إلى حديقة صغيرة', 'Invite the neighbours to share cuttings.', 'ندعو الجيران لتبادل شتلاتهم.', 'The first shared plant arrives in an old tea tin. Salma labels it “our beginning.”', 'تصل أول نبتة مشتركة في علبة شاي قديمة. تضع سلمى عليها بطاقة: «بدايتنا».', 'A garden that began in a tea tin', 'حديقة بدأت بعلبة شاي', 'street', 100, 2)
    ]),
    story('salma', 3, 19, 'A wedding in miniature', 'عرس بحجم صغير',
      'A couple wants a simple wedding breakfast with the neighbours who introduced them. Salma has flowers. You have a café. Nobody wants a complicated plan.',
      'يريد عروسان فطور زفاف بسيطاً مع الجيران الذين جمعوهما. لدى سلمى الزهور، ولديك المقهى. ولا أحد يريد خطّة معقّدة.', [
      choice('shared', 'Make one beautiful shared table', 'نجهّز طاولة جميلة للجميع', 'Let the people be the occasion.', 'نجعل الحاضرين أجمل ما في المناسبة.', 'Mariam cries, then says it is the onions. There are no onions. The couple leaves their first photograph as a gift.', 'تبكي مريم ثم تلوم البصل. لا يوجد بصل. يترك العروسان أول صورة لهما هدية للمقهى.', 'The wedding with no onions', 'العرس الذي لم يكن فيه بصل', 'people', 140, 4),
      choice('cake', 'Create a small celebration cake', 'نبتكر حلوى صغيرة للاحتفال', 'Make a recipe that brings the day back.', 'وصفة تعيد ذكرى هذا اليوم.', 'Salma suggests rose, Um Saeed suggests less fuss. The rose basbousa disappears before the speeches.', 'تقترح سلمى الورد، وتقترح أم سعيد البساطة. تختفي البسبوسة قبل بدء الكلمات.', 'The wedding rose basbousa', 'بسبوسة الورد من فطور الزفاف', 'recipe', 90, 2, { recipe: 'basbousa' })
    ]),
    story('salma', 4, 32, 'The street in bloom', 'الشارع يزهر',
      'The shared plants have multiplied. Salma asks what the street should do with its growing collection. Hassan asks if naming his plant makes him a gardener.',
      'تكاثرت النباتات المشتركة. تسأل سلمى ماذا نفعل بهذه المجموعة التي تكبر. ويسأل حسن إن كان تسمية نبتته يجعله بستانياً.', [
      choice('swap', 'Host a plant exchange', 'نقيم لقاءً لتبادل النباتات', 'Let every cutting begin another connection.', 'كلّ شتلة بداية تعارف جديد.', 'People exchange stories along with the plants. Hassan’s cutting comes with a three-page biography.', 'يتبادل الناس الحكايات مع النباتات. وتأتي شتلة حسن مع سيرة من ثلاث صفحات.', 'The plant exchange with biographies', 'لقاء النباتات ذات السيرة الطويلة', 'people', 145, 4),
      choice('route', 'Make a little garden trail', 'نرسم مساراً للحدائق الصغيرة', 'Link the neighbouring shops with green corners.', 'نصل المحلات المجاورة بأركان خضراء.', 'Each shop looks after a corner. Your café becomes the place where the trail starts with a cold drink.', 'يعتني كلّ محل بركن. ويبدأ المسار من مقهاك بمشروب بارد.', 'The little street garden trail', 'مسار الحدائق في الشارع الصغير', 'street', 185, 3)
    ]),

    story('omar', 1, 3, 'The tune in the queue', 'لحن في الطابور',
      'Omar hums while waiting for coffee. A child hums it back. He admits it is a tune he wrote, but has never played for anyone.',
      'يدندن عمر وهو ينتظر القهوة، فيردّد طفل اللحن. يعترف عمر بأنه لحّنها، لكنه لم يعزفها لأحد.', [
      choice('listen', 'Ask to hear the whole tune', 'نطلب سماع اللحن كاملاً', 'Give a first performance a kind audience.', 'نمنح العرض الأول جمهوراً لطيفاً.', 'Omar taps the rhythm on a saucer. By the last line, the room is keeping time with him.', 'ينقر عمر الإيقاع على صحن صغير. ومع النهاية تواكب الغرفة كلّها إيقاعه.', 'A first tune on a coffee saucer', 'أول لحن على صحن قهوة', 'people', 45, 3),
      choice('coffee', 'Name a coffee after the tune', 'نسمّي قهوة باسم اللحن', 'Give his music a place on the menu.', 'نمنح موسيقاه مكاناً في القائمة.', 'You write “Little Morning” beside the espresso. Omar orders it twice just to hear someone say the name.', 'تكتب «صباح صغير» بجانب الإسبريسو. يطلبه عمر مرتين ليسمع أحداً ينطق الاسم.', 'Little Morning, Omar’s coffee', 'صباح صغير، قهوة عمر', 'recipe', 25, 1, { recipe: 'espresso' })
    ]),
    story('omar', 2, 9, 'A concert for twelve', 'حفلة لاثني عشر شخصاً',
      'Omar is ready to play a short set. He asks whether twelve people count as a concert. Mariam says eleven, because she is technically family now.',
      'عمر مستعدّ لعزف مقطوعات قصيرة. يسأل إن كان اثنا عشر شخصاً يُعدّون حفلة. تقول مريم: أحد عشر، لأنها أصبحت من العائلة.', [
      choice('acoustic', 'Keep it small and acoustic', 'جلسة صغيرة بعزف هادئ', 'Give the room space to listen.', 'نترك للغرفة مساحة للإنصات.', 'Nobody talks over the quietest song. Omar notices that more than the applause.', 'لا يتكلّم أحد أثناء أهدأ أغنية. يلاحظ عمر ذلك أكثر من التصفيق.', 'The song everyone listened to', 'الأغنية التي أنصت لها الجميع', 'people', 80, 3),
      choice('outside', 'Share a tune with the street', 'نشارك الشارع لحناً', 'Invite the neighbouring shops for one song.', 'ندعو الجيران لأغنية واحدة.', 'The tailor brings a chair. The florist brings a friend. The “one song” becomes the street’s favourite story.', 'يحضر الخيّاط كرسياً وتأتي بائعة الزهور بصديقة. وتصبح «أغنية واحدة» حكاية الشارع المفضّلة.', 'One song for the whole street', 'أغنية واحدة للشارع كلّه', 'street', 115, 2)
    ]),
    story('omar', 3, 18, 'The sound of this place', 'صوت هذا المكان',
      'Omar wants to record a piece inspired by the café. He has captured the kettle, a spoon and Hassan insisting that he has a good singing voice.',
      'يريد عمر تسجيل مقطوعة مستوحاة من المقهى. سجّل صوت الغلّاية والملعقة وحسن وهو يؤكّد أن صوته جميل في الغناء.', [
      choice('room', 'Build a rhythm from the café', 'نصنع إيقاعاً من أصوات المقهى', 'Turn everyday sounds into something new.', 'نحوّل أصوات كلّ يوم إلى شيء جديد.', 'The finished tune starts with the shutters opening and ends with a cup on the counter. Everyone recognises home.', 'تبدأ المقطوعة بصوت فتح الباب وتنتهي بفنجان على المنضدة. يسمع الجميع صوت مكانهم.', 'The shutters-and-spoons tune', 'لحن الباب والملاعق', 'street', 125, 2),
      choice('voices', 'Let the neighbours add a line', 'نترك للجيران سطراً في الأغنية', 'Make it a portrait made of voices.', 'نصنع صورة للمكان من الأصوات.', 'Hassan gets one line. He performs it with the seriousness of a grand finale. Omar keeps the laughter after it.', 'يحصل حسن على سطر واحد ويؤدّيه بجدّية الختام الكبير. يُبقي عمر الضحكات التي تلته.', 'A café told in six voices', 'مقهى تحكيه ستّة أصوات', 'people', 95, 3)
    ]),
    story('omar', 4, 31, 'The first song comes home', 'الأغنية الأولى تعود إلى البيت',
      'Omar has been invited to play on a bigger stage. Before he goes, he wants to leave something here. “This is where the first song happened.”',
      'تلقّى عمر دعوة للعزف على مسرح أكبر. وقبل أن يذهب، يريد أن يترك شيئاً هنا. «هنا بدأت الأغنية الأولى».', [
      choice('record', 'Keep a signed recording', 'نحتفظ بتسجيل موقّع', 'Add the café’s song to the family collection.', 'نضيف أغنية المقهى إلى مجموعة العائلة.', 'He signs it beside the date of that first saucer performance. Mariam insists on a photograph for the wall.', 'يوقّعه بجانب تاريخ عزفه الأول على الصحن. تصرّ مريم على صورة للجدار.', 'Omar’s first recording, back where it began', 'تسجيل عمر الأول يعود إلى بدايته', 'people', 150, 4),
      choice('opening', 'Offer his corner to the next musician', 'نمنح ركنه لموسيقي جديد', 'Let a good beginning become a tradition.', 'نجعل البداية الجميلة تقليداً.', 'Omar introduces a nervous young player. The room makes the same welcoming space it once made for him.', 'يقدّم عمر عازفاً شاباً متوتّراً. ترحّب به الغرفة كما رحّبت بعمر يوماً.', 'A corner for first songs', 'ركن للأغنيات الأولى', 'street', 190, 3)
    ]),

    story('grandmother', 1, 2, 'A pinch is not a measurement', 'الرشّة ليست مقياساً',
      'Um Saeed tastes your breakfast and raises one eyebrow. Her recipe says “a little saffron.” Your little and her little are clearly different sizes.',
      'تتذوّق أم سعيد الفطور وترفع حاجباً واحداً. وصفتها تقول «شوية زعفران». يبدو أن «شويّتك» تختلف عن «شويّتها».', [
      choice('learn', 'Cook a batch beside her', 'نطبخ معها دفعة جديدة', 'Learn the parts that never reach the notebook.', 'نتعلّم ما لا يُكتب في الدفتر.', 'She teaches you to judge the chebab by its smell and colour. Then, reluctantly, she measures the saffron.', 'تعلّمك الحكم على الجباب من رائحته ولونه. ثم تقيس الزعفران، على مضض.', 'The measured pinch of saffron', 'رشّة الزعفران التي قسناها أخيراً', 'recipe', 25, 1, { recipe: 'chebab' }),
      choice('taste', 'Ask the regulars to compare', 'ندعو الروّاد للمقارنة', 'Let two family versions share the table.', 'نضع نسختين من الوصفة على الطاولة.', 'Half prefer yours, half prefer hers. Um Saeed declares this proves you both make excellent breakfast.', 'يفضّل نصفهم وصفتك والنصف الآخر وصفتها. تعلن أم سعيد أن ذلك يثبت أن كليكما يُعدّ فطوراً ممتازاً.', 'Two perfectly good family breakfasts', 'فطوران طيّبان من العائلة', 'people', 45, 3)
    ]),
    story('grandmother', 2, 7, 'The notebook with no amounts', 'دفتر بلا مقادير',
      'Um Saeed brings the family recipe notebook. It contains three shopping lists, a photograph and a recipe whose only instruction is “as usual.”',
      'تحضر أم سعيد دفتر وصفات العائلة. فيه ثلاث قوائم مشتريات وصورة ووصفة تعليماتها الوحيدة: «كالعادة».', [
      choice('write', 'Write the recipes together', 'ندوّن الوصفات معاً', 'Turn “as usual” into something another cook can learn.', 'نحوّل «كالعادة» إلى وصفة يستطيع غيرها تعلّمها.', 'You finally capture her balaleet recipe. She adds a note: “Taste it yourself. Paper cannot do everything.”', 'تدوّن أخيراً وصفة البلاليط. وتضيف ملاحظة: «تذوّق بنفسك. الورق ما يعرف كلّ شيء».', 'The family notebook, with actual amounts', 'دفتر العائلة، بمقادير واضحة أخيراً', 'recipe', 40, 1, { recipe: 'balaleet' }),
      choice('stories', 'Keep the stories beside the recipes', 'نحفظ الحكايات بجانب الوصفات', 'Find out who taught her each dish.', 'نعرف من علّمها كلّ طبق.', 'One recipe leads to an aunt, another to a neighbour. The notebook becomes a family tree you can cook from.', 'تقود وصفة إلى عمّة وأخرى إلى جارة. يصبح الدفتر شجرة عائلة يمكن الطبخ منها.', 'A family tree written in recipes', 'شجرة عائلة مكتوبة بالوصفات', 'people', 65, 3)
    ]),
    story('grandmother', 3, 16, 'The great breakfast debate', 'الجدال الكبير حول الفطور',
      'A younger relative wants to change a family recipe. Um Saeed folds her arms. Then she quietly asks what the change would be.',
      'يريد أحد شباب العائلة تعديل وصفة قديمة. تشبك أم سعيد ذراعيها، ثم تسأل بهدوء عمّا يريد تغييره.', [
      choice('pair', 'Serve the old and new side by side', 'نقدّم القديمة والجديدة معاً', 'Let the family discover both versions.', 'نترك للعائلة فرصة اكتشاف النسختين.', 'The newer dish finds its fans; the original keeps its loyal crowd. Um Saeed writes down both.', 'تجد الوصفة الجديدة محبّيها وتحتفظ القديمة بروّادها. تدوّن أم سعيد النسختين.', 'Two generations, two good recipes', 'جيلان ووصفتان طيّبتان', 'people', 95, 3),
      choice('blend', 'Find one idea to share', 'نبحث عن فكرة تجمعهما', 'Keep the heart of the recipe and try one new detail.', 'نحافظ على روح الوصفة ونجرب تفصيلاً جديداً.', 'A little rosewater brings the family maamoul somewhere new. Um Saeed claims she thought of it first.', 'تمنح قطرة ماء ورد المعمول طعماً جديداً. تقول أم سعيد إنها فكّرت بها أولاً.', 'The maamoul idea everyone had first', 'فكرة المعمول التي سبقت إلى بال الجميع', 'recipe', 55, 1, { recipe: 'maamoul' })
    ]),
    story('grandmother', 4, 28, 'Leave room on the last page', 'اترك مكاناً في الصفحة الأخيرة',
      'The family notebook is nearly full. Um Saeed places it on your counter. “Whoever comes after you will have something to add.”',
      'يكاد دفتر العائلة يمتلئ. تضعه أم سعيد على المنضدة. «اللي يجي بعدك بيكون عنده شيء يضيفه».', [
      choice('teach', 'Teach the next pair of hands', 'نعلّم من سيكمل بعدنا', 'Pass on knowledge without giving anything away.', 'ننقل المعرفة وتبقى وصفاتنا معنا.', 'You cook with the next generation while Um Saeed supervises. The final page gets its first new handwriting.', 'تطبخ مع الجيل التالي تحت إشراف أم سعيد. تستقبل الصفحة الأخيرة خطّاً جديداً.', 'The next handwriting in the family book', 'خطّ جديد في دفتر العائلة', 'people', 150, 4),
      choice('edition', 'Make a copy for every kitchen', 'ننسخ الدفتر لكلّ مطبخ', 'Let the recipes travel while the original stays here.', 'نسافر بالوصفات ويبقى الأصل هنا.', 'Copies find their way to relatives and neighbours. The original stays behind your counter, flour and all.', 'تصل النسخ إلى الأقارب والجيران. ويبقى الأصل خلف المنضدة، بكلّ آثار الدقيق عليه.', 'A family recipe in many kitchens', 'وصفة عائلية في مطابخ كثيرة', 'street', 190, 3),
      choice('dessert', 'Add a celebration of your own', 'نضيف حلوى احتفال من عندنا', 'Write one more recipe together.', 'نكتب وصفة أخرى معاً.', 'You finish the book with little kunafa portions. Um Saeed writes, “Best shared,” and leaves the next page blank.', 'تختمان الدفتر بقطع كنافة صغيرة. تكتب أم سعيد «ألذّ مع الناس»، وتترك الصفحة التالية بيضاء.', 'The kunafa on the almost-last page', 'الكنافة في الصفحة قبل الأخيرة', 'recipe', 95, 2, { recipe: 'kunafa' })
    ])
  ];

  const event = (id, minDay, en, ar, be, ba, choices) => ({ id, minDay, title: L(en, ar), body: L(be, ba), choices });
  const events = [
    event('one-cup-many-stories', 1, 'One cup, a hundred stories', 'فنجان واحد ومئة حكاية',
      'The printer has put “a hundred stories” where your sign was meant to say “a hundred flavours.” A neighbour says the mistake sounds rather good.',
      'كتبت المطبعة «مئة حكاية» بدل «مئة نكهة» على لافتتك. يقول أحد الجيران إن الخطأ أجمل من الأصل.', [
      choice('keep', 'Keep the happy mistake', 'نحتفظ بالخطأ الجميل', 'Make stories part of the café’s identity.', 'نجعل الحكايات جزءاً من هوية المقهى.', 'Guests start asking what today’s story is. You suddenly have a very good answer: theirs.', 'يبدأ الضيوف بالسؤال عن حكاية اليوم. فتجد جواباً جميلاً: حكاياتهم.', 'One cup, a hundred stories', 'فنجان واحد ومئة حكاية', 'people', 35, 2),
      choice('menu', 'Turn it into a tasting card', 'نحوّلها إلى بطاقة تذوّق', 'Put the story of a recipe beside the cup.', 'نضع حكاية الوصفة بجانب الفنجان.', 'A short note about the house karak makes a familiar drink feel personal. Guests ask for the next card.', 'تمنح حكاية قصيرة عن كرك الدار المشروب المألوف طابعاً شخصياً. يسأل الضيوف عن البطاقة التالية.', 'The first recipe story card', 'أول بطاقة تحكي وصفة', 'recipe', 55, 1)
    ]),
    event('borrowed-table', 2, 'A little more room', 'مساحة إضافية صغيرة',
      'The neighbouring shop has a gathering and no place for everyone to sit. Its owner asks if your café can help make the afternoon work.',
      'في المحل المجاور لقاء ولا توجد مقاعد تكفي الجميع. يسأل صاحبه إن كان مقهاك يستطيع المساعدة.', [
      choice('host', 'Welcome the gathering here', 'نستضيف اللقاء عندنا', 'Let your café become part of their occasion.', 'نجعل المقهى جزءاً من مناسبتهم.', 'The guests settle around your tables and discover their new meeting place. The shopkeeper brings a thank-you card.', 'يجلس الضيوف حول طاولاتك ويكتشفون مكان لقاءاتهم الجديد. يحضر صاحب المحل بطاقة شكر.', 'The gathering from next door', 'لقاء الجيران في المقهى', 'people', 65, 2),
      choice('boxes', 'Make a picnic-style spread', 'نجهّز ضيافة سهلة الحمل', 'Bring the café to their little celebration.', 'ننقل ضيافة المقهى إلى احتفالهم الصغير.', 'Neat boxes turn a cramped corner into a party. A guest asks who made the food; everyone points at your door.', 'تحوّل علب مرتّبة الركن الضيّق إلى احتفال. يسأل ضيف عن الطعام فيشير الجميع إلى بابك.', 'A party packed into little boxes', 'حفلة في علب صغيرة', 'street', 90, 1)
    ]),
    event('mystery-cup', 3, 'The cup with no name', 'الفنجان بلا اسم',
      'A regular leaves a beautiful old cup with a note: “This belongs somewhere people talk.” There is no signature.',
      'يترك أحد الروّاد فنجاناً قديماً جميلاً ورسالة: «مكانه حيث يجتمع الناس للحديث». لا يوجد توقيع.', [
      choice('display', 'Give the cup a place of honour', 'نضع الفنجان في مكان مميّز', 'Let a small gift become part of the room.', 'نجعل الهدية الصغيرة جزءاً من المكان.', 'Everyone invents a different story about the cup. Its anonymous owner seems delighted by all of them.', 'يؤلّف الجميع حكاية مختلفة عن الفنجان. ويبدو صاحبه المجهول سعيداً بها كلّها.', 'The cup that arrived without a name', 'الفنجان الذي جاء بلا اسم', 'people', 30, 3),
      choice('sketch', 'Put its shape on a recipe card', 'نرسمه على بطاقة وصفة', 'Give the little gift a life beyond the shelf.', 'نمنح الهدية حياة خارج الرفّ.', 'The cup becomes a small drawing beside your house blend. A customer quietly asks for an extra copy.', 'يصبح الفنجان رسمة بجانب خلطة المقهى. يطلب زبون بهدوء نسخة إضافية.', 'The anonymous cup on the menu', 'الفنجان المجهول في القائمة', 'recipe', 55, 1)
    ]),
    event('rival-special', 4, 'A suspiciously familiar special', 'طبق خاص مألوف جداً',
      'The café across the street is serving something remarkably like your special. Its owner waves enthusiastically. This could become an argument—or a story.',
      'يقدّم المقهى المقابل طبقاً يشبه طبقك الخاص كثيراً. يلوّح صاحبه بحماس. يمكن أن تصبح المسألة خلافاً، أو حكاية جميلة.', [
      choice('duet', 'Make a two-café tasting', 'نقيم تذوّقاً بين المقهيين', 'Let guests enjoy both interpretations.', 'نترك للضيوف تجربة النسختين.', 'The two recipes taste different enough to start a friendly debate. Both cafés discover new regulars.', 'يختلف الطعمان بما يكفي لجدال لطيف. ويكسب المقهيان روّاداً جدداً.', 'Two cafés, two house specials', 'مقهيان وطبقان خاصّان', 'street', 95, 2),
      choice('signature', 'Tell the story of your original', 'نحكي قصة وصفتنا الأصلية', 'Show what makes this version yours.', 'نُظهر ما يجعل هذه النسخة منّا.', 'Guests enjoy hearing how your recipe began. The other owner admits the same customer suggested both versions.', 'يستمتع الضيوف بقصة البداية. ويعترف صاحب المقهى الآخر بأن الزبون نفسه اقترح النسختين.', 'The special with a story of its own', 'طبق خاص له حكاية خاصة', 'recipe', 60, 2)
    ]),
    event('lost-keys', 5, 'The keys nobody recognises', 'مفاتيح لا يعرفها أحد',
      'A set of keys has been left on a table. Before you can ask whose they are, three customers recognise the keyring—but each names a different person.',
      'تُركت مفاتيح على طاولة. وقبل أن تسأل عن صاحبها، يتعرّف ثلاثة زبائن إلى الميدالية، ويذكر كلّ منهم اسماً مختلفاً.', [
      choice('ask', 'Let the neighbours solve it', 'نترك للجيران حلّ اللغز', 'Find the connections behind the guesses.', 'نكتشف الرابط بين التخمينات.', 'All three people belong to the same family. The keys go home with a newly discovered cousin and much laughter.', 'يتبيّن أن الثلاثة من عائلة واحدة. تعود المفاتيح إلى البيت مع قريب اكتشفوه للتوّ وضحكات كثيرة.', 'The keys that introduced the cousins', 'المفاتيح التي جمعت الأقارب', 'people', 45, 3),
      choice('board', 'Start a small lost-and-found shelf', 'نخصّص رفّاً للمفقودات', 'Give forgotten things somewhere safe to wait.', 'مكان آمن للأشياء المنسيّة.', 'The owner returns for the keys and leaves a thank-you note. A lonely umbrella is reunited with its person too.', 'يعود صاحب المفاتيح ويترك رسالة شكر. وتلتقي مظلّة منسيّة بصاحبها أيضاً.', 'A shelf for things finding their way home', 'رفّ للأشياء التي تجد طريقها للبيت', 'street', 70, 1)
    ]),
    event('study-table', 6, 'The enormous little project', 'المشروع الصغير الضخم',
      'Three students spread out a model of the neighbourhood. Your café is represented by a biscuit. They insist this is a compliment.',
      'يفرد ثلاثة طلاب مجسّماً للحي. يمثّل مقهاك بسكويتة. يؤكّدون أن هذا مديح.', [
      choice('display', 'Give their model a little exhibition', 'نعرض المجسّم في ركن صغير', 'Let the neighbourhood see itself in miniature.', 'نترك للحي فرصة رؤية نفسه مصغّراً.', 'Visitors point out their homes and add tiny details. Nobody eats your café, despite several suggestions.', 'يشير الزوّار إلى بيوتهم ويضيفون تفاصيل صغيرة. لا يأكل أحد مقهاك، رغم الاقتراحات.', 'The café that was briefly a biscuit', 'المقهى الذي صار بسكويتة', 'people', 55, 3),
      choice('snacks', 'Create a study-table snack plate', 'نعدّ طبقاً لطاولة الدراسة', 'Keep busy hands fed without taking over the table.', 'نقدّم لقيمات سهلة لا تزاحم المشروع.', 'Small date maamoul fit neatly beside the model. The students leave a miniature menu with your name on it.', 'يناسب المعمول الصغير المساحة بجانب المجسّم. يترك الطلاب قائمة مصغّرة عليها اسمك.', 'A miniature menu and a study snack', 'قائمة مصغّرة ووجبة للمذاكرة', 'recipe', 35, 1, { recipe: 'maamoul' })
    ]),
    event('tea-tin-delivery', 7, 'The delivery with a surprise', 'مفاجأة في التوصيلة',
      'Your supplier includes a small sample of cardamom with a handwritten note: “Try smelling this before you decide.” The whole counter smells wonderful.',
      'يضع المورّد عيّنة هيل صغيرة مع الطلب ورسالة: «جرّب رائحته قبل أن تقرّر». تفوح رائحة جميلة في المنضدة كلّها.', [
      choice('taste', 'Host a tiny blind tasting', 'نقيم تذوّقاً صغيراً دون أسماء', 'Let guests describe what they notice.', 'نسمع ما يلاحظه الضيوف.', 'Someone says “warmth,” someone says “home,” and someone says “definitely not cinnamon.” You record the favourite blend.', 'يقول أحدهم «دفء» وآخر «البيت» وثالث «بالتأكيد ليست قرفة». تدوّن الخلطة المفضّلة.', 'The cardamom tasting notes', 'ملاحظات جلسة تذوّق الهيل', 'recipe', 60, 2),
      choice('story', 'Ask where the blend comes from', 'نسأل عن أصل الخلطة', 'Put a person behind an everyday ingredient.', 'نتعرّف إلى الناس وراء المكوّنات.', 'The supplier tells you about the family shop that mixes it. Guests enjoy the story almost as much as the smell.', 'يحكي المورّد عن المحل العائلي الذي يمزجها. يستمتع الضيوف بالحكاية بقدر الرائحة تقريباً.', 'The family behind the spice tin', 'العائلة وراء علبة البهارات', 'people', 40, 3)
    ]),
    event('rain-at-the-door', 8, 'The unexpected shower', 'زخّة مطر مفاجئة',
      'A quick shower sends people under your awning. Someone is protecting a bouquet; someone else is protecting a cake. The cake seems to be winning.',
      'تجمع زخّة مفاجئة الناس تحت مظلّة المقهى. أحدهم يحمي باقة وآخر يحمي كعكة. تبدو الكعكة أوفر حظّاً.', [
      choice('welcome', 'Invite everyone inside', 'ندعو الجميع إلى الداخل', 'Turn a wet interruption into a shared table.', 'نحوّل مفاجأة المطر إلى جلسة مشتركة.', 'The bouquet decorates the table. The cake turns out to be for someone who has just arrived. It becomes a party.', 'تزيّن الباقة الطاولة. ويتبيّن أن الكعكة لشخص وصل للتوّ. وتصبح الجلسة حفلة.', 'The party the rain brought in', 'الحفلة التي أحضرها المطر', 'people', 75, 3),
      choice('warm', 'Offer something warm by the door', 'نقدّم شيئاً دافئاً عند الباب', 'Make the short stop comforting.', 'نجعل الوقفة القصيرة مريحة.', 'A guest shares their sahlab recipe while the rain passes. You add it to the book for another cool afternoon.', 'يشاركك ضيف وصفة السحلب بينما ينحسر المطر. تضيفها إلى الدفتر لعصر بارد آخر.', 'Sahlab from a rainy doorstep', 'سحلب من وقفة عند باب ممطر', 'recipe', 45, 1, { recipe: 'sahlab' })
    ]),
    event('taxi-route', 9, 'The driver’s little detour', 'طريق السائق المختصر',
      'A taxi driver says your street is the best place for a quick stop. His passengers keep asking what they should try before they go.',
      'يقول سائق سيارة أجرة إن شارعك أفضل مكان لاستراحة قصيرة. ويسأله الركّاب عمّا يستحقّ التجربة قبل المغادرة.', [
      choice('pair', 'Offer a simple coffee-and-bread pair', 'نقترح قهوة وخبزاً معاً', 'Make a short visit easy to enjoy.', 'نجعل الزيارة القصيرة سهلة وممتعة.', 'The driver learns the order by heart. New guests arrive knowing exactly what they want to taste.', 'يحفظ السائق الطلب. ويصل زوّار جدد يعرفون ما يريدون تذوّقه.', 'The driver’s favourite short stop', 'استراحة السائق المفضّلة', 'recipe', 85, 1),
      choice('map', 'Give visitors a little street guide', 'نعطي الزوّار دليلاً صغيراً للشارع', 'Help the neighbouring shops get discovered too.', 'نساعد الزوّار على اكتشاف المحلات المجاورة.', 'Passengers start with your café and explore the rest of the row. The driver asks for more guides.', 'يبدأ الركّاب بمقهاك ثم يكتشفون المحلات الأخرى. يطلب السائق نسخاً إضافية من الدليل.', 'The pocket guide to a little street', 'دليل الجيب إلى شارع صغير', 'street', 110, 2)
    ]),
    event('two-birthdays', 10, 'Two cakes, one surprise', 'كعكتان ومفاجأة واحدة',
      'Two different groups have quietly planned a birthday here. Each thinks the other group is part of its surprise. The candles have become confusing.',
      'خطّطت مجموعتان سرّاً لعيد ميلاد في المقهى. وتظنّ كلّ منهما أن الأخرى جزء من مفاجأتها. اختلط أمر الشموع.', [
      choice('together', 'Make one very cheerful celebration', 'نجمعهما في احتفال مرح', 'Invite the groups to share the occasion.', 'ندعو المجموعتين لمشاركة المناسبة.', 'The birthday guests discover they were born on the same day. Everyone sings twice to be fair.', 'يكتشف صاحبا العيد أنهما وُلدا في اليوم نفسه. يغنّي الجميع مرتين للإنصاف.', 'The birthday with double singing', 'عيد الميلاد ذو الأغنيتين', 'people', 100, 3),
      choice('corners', 'Give each surprise its own corner', 'ركن لكلّ مفاجأة', 'Keep both celebrations personal.', 'نحافظ على خصوصية كلّ احتفال.', 'The two tables exchange a piece of cake at the end. Your staff invents a discreet candle-counting system.', 'تتبادل الطاولتان قطع الكعك في النهاية. ويبتكر الفريق طريقة سرية لعدّ الشموع.', 'Two celebrations, one café', 'احتفالان ومقهى واحد', 'street', 125, 1)
    ]),
    event('postcard-from-away', 11, 'A postcard finds the café', 'بطاقة بريدية تصل إلى المقهى',
      'A former visitor sends a postcard addressed only to “the café with the good tea.” Somehow, it arrives. They remember a small kindness you barely noticed.',
      'يرسل زائر قديم بطاقة عنوانها فقط «المقهى صاحب الشاي الطيّب». وتصل بطريقة ما. يتذكّر لطفاً صغيراً كدت تنساه.', [
      choice('wall', 'Begin a wall of postcards', 'نبدأ جدار البطاقات البريدية', 'Let the café’s connections travel further.', 'نرى إلى أين وصلت صداقات المقهى.', 'Other guests add cards from their own travels. The wall becomes a map made of handwriting.', 'يضيف ضيوف آخرون بطاقات من رحلاتهم. يصبح الجدار خريطة بخطوط مختلفة.', 'The postcard with the impossible address', 'البطاقة ذات العنوان المستحيل', 'people', 60, 3),
      choice('reply', 'Send a recipe back', 'نرسل وصفة في الرد', 'Give them a small taste of this place.', 'نرسل لهم شيئاً من طعم المكان.', 'You write the house tea recipe on a card. A reply arrives with a family recipe of their own.', 'تكتب وصفة شاي الدار على بطاقة. ويأتي الردّ بوصفة من عائلتهم.', 'A recipe that travelled by post', 'وصفة سافرت بالبريد', 'recipe', 85, 2)
    ]),
    event('quiet-hour', 12, 'A room with two rhythms', 'غرفة بإيقاعين',
      'Some guests want conversation; others have brought books. Nobody is upset yet. This is a good moment to decide what today’s room should feel like.',
      'يريد بعض الضيوف الحديث، ويحمل آخرون كتبهم. لا أحد منزعج حتى الآن. هذا وقت مناسب لاختيار جوّ المكان اليوم.', [
      choice('zones', 'Make the corners easy to read', 'نوضّح طابع كلّ ركن', 'Use a quiet corner and a gathering table.', 'ركن هادئ وطاولة للأحاديث.', 'People choose the seat that suits them. A reader later joins the conversation with an excellent quotation.', 'يختار كلّ ضيف ما يناسبه. ويلتحق قارئ بالحديث لاحقاً باقتباس جميل.', 'A place for both quiet and company', 'مكان للهدوء والصحبة', 'people', 70, 3),
      choice('reading', 'Invite a shared reading', 'ندعو إلى قراءة مشتركة', 'Let a short story connect the two groups.', 'نصل بين المجموعتين بقصة قصيرة.', 'One guest reads a paragraph, another shares a memory. The room finds a rhythm of its own.', 'يقرأ ضيف فقرة ويشارك آخر ذكرى. تجد الغرفة إيقاعها الخاص.', 'The afternoon the room found its rhythm', 'العصر الذي وجدت فيه الغرفة إيقاعها', 'street', 95, 2)
    ]),
    event('newspaper-notebook', 13, 'A notebook at the window', 'دفتر عند النافذة',
      'A local newspaper writer wants a story about ordinary places people love. They ask what makes your café worth returning to.',
      'يريد كاتب في صحيفة محلية حكاية عن الأماكن العادية التي يحبّها الناس. يسألك عمّا يجعل الناس يعودون إلى مقهاك.', [
      choice('people', 'Introduce the people', 'نعرّفه إلى أهل المكان', 'Let the regulars answer for themselves.', 'نترك للروّاد الإجابة بأنفسهم.', 'Everyone gives a different reason. The writer smiles: “That is the story.”', 'يعطي كلّ واحد سبباً مختلفاً. يبتسم الكاتب: «هذه هي الحكاية».', 'A newspaper story told by the regulars', 'حكاية صحفية يرويها الروّاد', 'people', 95, 3),
      choice('recipe', 'Share the story of a recipe', 'نحكي قصة وصفة', 'Explain how a familiar cup became yours.', 'نشرح كيف صار الفنجان المألوف خاصّاً بنا.', 'The writer asks for the recipe, then orders another cup before finishing the questions.', 'يطلب الكاتب الوصفة، ثم يطلب فنجاناً آخر قبل أن ينهي أسئلته.', 'The interview that needed another cup', 'المقابلة التي احتاجت فنجاناً آخر', 'recipe', 125, 2)
    ]),
    event('menu-democracy', 14, 'The unofficial menu election', 'انتخابات القائمة غير الرسمية',
      'Two groups campaign for their favourite dish. Someone has made a tiny “vote for breakfast” sign. They ask you to settle it.',
      'تدافع مجموعتان عن طبقيهما المفضّلين. وقد صنع أحدهم لافتة صغيرة: «صوّتوا للفطور». يطلبون منك الحسم.', [
      choice('taste', 'Hold a friendly tasting', 'نقيم تذوّقاً ودّياً', 'Let people explain what they love.', 'نترك لكلّ شخص شرح ما يحبّه.', 'The loudest campaigner discovers the other dish is excellent too. The tiny sign goes into your collection.', 'يكتشف أكثر المدافعين حماساً أن الطبق الآخر لذيذ أيضاً. تُضاف اللافتة الصغيرة إلى ذكرياتك.', 'The breakfast election', 'انتخابات الفطور', 'people', 80, 3),
      choice('pair', 'Find a pairing they can agree on', 'نبحث عن توليفة ترضيهم', 'Build a little plate from both ideas.', 'نصنع طبقاً صغيراً يجمع الفكرتين.', 'A drink from one side and a bite from the other become a popular pair. Both groups claim victory.', 'يصبح مشروب من جهة ولقمة من الأخرى توليفة محبوبة. تعلن المجموعتان الفوز.', 'The menu vote that both sides won', 'التصويت الذي فاز فيه الطرفان', 'recipe', 110, 2)
    ]),
    event('little-street-market', 15, 'A market on your doorstep', 'سوق على عتبة المقهى',
      'Neighbouring shops are putting together a small street market. There is space for one contribution from your café. What should people remember?',
      'تنظّم المحلات المجاورة سوقاً صغيراً في الشارع. توجد مساحة لمشاركة واحدة من مقهاك. بماذا تريد أن يتذكّرك الناس؟', [
      choice('taste', 'Bring a house-special tasting', 'نقدّم تذوّقاً لطبق الدار', 'Give the street a taste of your identity.', 'نعرّف الشارع بطعم يميّزنا.', 'The tasting turns strangers into visitors. Several return to ask how you made it.', 'يحوّل التذوّق المارّة إلى زوّار. يعود بعضهم ليسأل عن الوصفة.', 'The house special at the street market', 'طبق الدار في سوق الشارع', 'recipe', 135, 2),
      choice('table', 'Bring a welcoming shared table', 'نجهّز طاولة ترحّب بالجميع', 'Make a resting place in the middle of the market.', 'مكان للاستراحة وسط السوق.', 'Shoppers sit down as strangers and leave comparing their discoveries. Your table becomes the meeting point.', 'يجلس المتسوّقون غرباء ويغادرون وهم يتبادلون اكتشافاتهم. تصبح طاولتك نقطة اللقاء.', 'The market’s meeting table', 'طاولة اللقاء في السوق', 'street', 115, 3)
    ]),
    event('wrong-cake-message', 16, 'Congratulations on your… bicycle?', 'مبروك على… الدراجة؟',
      'A guest has brought a cake with a puzzling message. It was meant to celebrate a graduation. Nobody knows how a bicycle got involved.',
      'يحضر ضيف كعكة عليها تهنئة محيّرة. كان يفترض أن تحتفل بالتخرّج. لا أحد يعرف كيف دخلت الدراجة في الموضوع.', [
      choice('laugh', 'Make the mistake part of the party', 'نجعل الخطأ جزءاً من الحفلة', 'Give the celebration a story nobody will forget.', 'نمنح الاحتفال حكاية لا تُنسى.', 'The graduate poses with an imaginary bicycle. It becomes the photograph everyone asks for.', 'يلتقط الخرّيج صورة مع دراجة خيالية. تصبح الصورة التي يطلبها الجميع.', 'The graduation bicycle', 'دراجة حفل التخرّج', 'people', 85, 3),
      choice('plate', 'Make a fresh celebration plate', 'نجهّز طبق احتفال جديداً', 'Give the guest a simple, personal finishing touch.', 'نضيف لمسة بسيطة وشخصية للاحتفال.', 'You arrange little pastries around a handwritten congratulation. The bicycle cake gets a place of honour anyway.', 'ترتّب حلويات صغيرة حول تهنئة بخط اليد. وتحصل كعكة الدراجة على مكان مميّز أيضاً.', 'A very personal graduation plate', 'طبق تخرّج بلمسة شخصية', 'recipe', 115, 2)
    ]),
    event('old-shop-sign', 18, 'The sign from before', 'لافتة من زمن سابق',
      'A neighbour finds an old sign from this shop in a storeroom. The letters are faded, but someone still remembers the owner who painted them.',
      'يعثر جار على لافتة قديمة لهذا المحل في المخزن. بهتت الحروف، لكن أحدهم ما زال يتذكّر من رسمها.', [
      choice('hang', 'Hang it beside the new sign', 'نعلّقها بجانب اللافتة الجديدة', 'Let the different chapters sit together.', 'نجمع فصلين من حكاية المكان.', 'Guests point out the changes while remembering what stayed the same. The shop feels a little more rooted.', 'يشير الضيوف إلى ما تغيّر ويتذكّرون ما بقي. يشعر المكان بأنه أكثر ارتباطاً بحكايته.', 'Two signs, one continuing story', 'لافتتان وحكاية مستمرة', 'people', 100, 3),
      choice('print', 'Make a keepsake print', 'نصنع نسخة تذكارية', 'Share a piece of the street’s visual history.', 'نشارك شيئاً من ذاكرة الشارع.', 'The print includes a small note about the sign painter. Their family comes in to see it.', 'تتضمّن النسخة نبذة عن رسّام اللافتة. تزور عائلته المقهى لرؤيتها.', 'The sign painter’s story', 'حكاية رسّام اللافتة', 'street', 140, 2)
    ]),
    event('the-empty-chair', 20, 'A chair with a story', 'كرسي له حكاية',
      'A visitor always picks the same chair. Today they explain why: from here, the street looks just like the one they grew up on.',
      'يختار زائر الكرسي نفسه في كلّ مرّة. يشرح اليوم السبب: الشارع من هنا يشبه الشارع الذي نشأ فيه.', [
      choice('listen', 'Ask about the street they remember', 'نسأل عن الشارع الذي يتذكّره', 'Make room for a place that is far away.', 'نفسح مكاناً لذكرى بعيدة.', 'A few details bring another guest into the conversation. They grew up only two roads apart.', 'تجذب بعض التفاصيل ضيفاً آخر إلى الحديث. يتبيّن أنهما نشآ على بعد شارعين فقط.', 'Two old streets meeting at one chair', 'شارعان قديمان يلتقيان عند كرسي', 'people', 95, 4),
      choice('taste', 'Ask what the old café served', 'نسأل عمّا كان يقدّمه مقهاه القديم', 'Find a familiar taste to bring into this room.', 'نبحث عن طعم مألوف نحضره إلى هنا.', 'They describe chilled jallab on a sunny afternoon. You make a version that brings a very quiet smile.', 'يصف جلاباً بارداً في عصر مشمس. تعدّ نسخة ترسم على وجهه ابتسامة هادئة.', 'A taste of another little street', 'طعم من شارع صغير آخر', 'recipe', 65, 2, { recipe: 'jallab' })
    ]),
    event('a-cup-for-the-shop', 22, 'One cup for the whole shop', 'فنجان للمحل كلّه',
      'A neighbouring team wants a drink that represents all of them. One likes coffee, one loves dessert and one insists the answer is always ice cream.',
      'يريد فريق محل مجاور مشروباً يمثّلهم جميعاً. أحدهم يحبّ القهوة وآخر الحلوى، وثالث يؤكّد أن الحلّ دائماً هو المثلجات.', [
      choice('affogato', 'Bring coffee and ice cream together', 'نجمع القهوة والمثلجات', 'Find the overlap between their favourites.', 'نجد نقطة اللقاء بين ما يحبّونه.', 'The affogato gets unanimous approval. The ice-cream enthusiast asks for the decision to be recorded officially.', 'يحصل الأفوغاتو على موافقة بالإجماع. ويطلب عاشق المثلجات توثيق القرار رسمياً.', 'The unanimous affogato decision', 'قرار الأفوغاتو بالإجماع', 'recipe', 90, 2, { recipe: 'affogato' }),
      choice('flight', 'Give everyone a little tasting tray', 'نقدّم صينية تذوّق للجميع', 'Let the team enjoy its differences.', 'نترك للفريق فرصة الاستمتاع باختلافه.', 'They exchange tastes and stories across the tray. The team decides its real signature is sharing.', 'يتبادلون النكهات والحكايات عبر الصينية. ويقرّر الفريق أن المشاركة هي ما يميّزه حقّاً.', 'A team with more than one favourite', 'فريق له أكثر من طبق مفضّل', 'people', 125, 3)
    ]),
    event('the-family-photograph', 25, 'Nobody look at the camera', 'لا أحد ينظر إلى الكاميرا',
      'Someone wants a photograph of the café as it really is. The moment the camera appears, everybody stands unnaturally straight.',
      'يريد أحدهم صورة للمقهى كما هو في يوم عادي. وما إن تظهر الكاميرا حتى يقف الجميع بجدّية مبالغ فيها.', [
      choice('candid', 'Ask everyone to go back to their cups', 'نطلب من الجميع العودة إلى فناجينهم', 'Keep the life between the posed moments.', 'نحفظ الحياة بين الصور المرتّبة.', 'A joke breaks the pose. The best photograph catches a half-poured tea and a whole room laughing.', 'تكسر نكتة وقفة التصوير. تلتقط أجمل صورة شايًا يُصبّ وغرفة تضحك.', 'A room caught being itself', 'غرفة على طبيعتها', 'people', 125, 4),
      choice('objects', 'Photograph the little things instead', 'نصوّر التفاصيل الصغيرة', 'Let the room tell its story through objects.', 'نترك للأشياء فرصة رواية الحكاية.', 'A worn recipe page, a familiar cup, a flower in a tin. Together they look unmistakably like your café.', 'صفحة وصفة مستعملة وفنجان مألوف وزهرة في علبة. تفاصيل تشبه مقهاك تماماً.', 'The little things that make a café', 'التفاصيل التي تصنع المقهى', 'street', 165, 2)
    ])
  ];

  const upgrade = (id, en, ar, de, da, cost, kind, value, art, tags) =>
    ({ id, name: L(en, ar), description: L(de, da), cost, kind, value, art, tags: tags || [] });
  const upgrades = [
    upgrade('board-four', 'A little more choice', 'خيار إضافي في القائمة', 'One more space for a recipe on your board.', 'مساحة إضافية لوصفة على لوحة القائمة.', 180, 'board', 1, 'f_menuboard'),
    upgrade('board-six', 'The generous menu board', 'لوحة القائمة الواسعة', 'Two more spaces for recipes worth sharing.', 'مساحتان إضافيتان لوصفات تستحقّ التجربة.', 520, 'board', 2, 'f_menuboard'),
    upgrade('board-eight', 'The full house board', 'لوحة الدار الكبيرة', 'Two more spaces for your growing collection.', 'مساحتان إضافيتان لمجموعة وصفاتك.', 950, 'board', 2, 'f_menuboard'),
    upgrade('window-seats', 'Window seats', 'مقاعد النافذة', 'Four more seats for watching the little street.', 'أربعة مقاعد إضافية تطلّ على الشارع الصغير.', 240, 'seats', 4, 'f_banquette'),
    upgrade('long-table', 'The long table', 'الطاولة الطويلة', 'Six more seats for old friends and new introductions.', 'ستّة مقاعد إضافية للأصدقاء والتعارف.', 560, 'seats', 6, 'f_table_lg'),
    upgrade('courtyard-seats', 'A courtyard corner', 'ركن في الفناء', 'Eight more seats and a little room to breathe.', 'ثمانية مقاعد إضافية ومساحة أرحب للجلوس.', 1200, 'seats', 8, 'f_outdoor'),
    upgrade('good-grinder', 'The dependable grinder', 'مطحنة نعتمد عليها', 'A permanent tool for a busier coffee counter.', 'أداة دائمة لمنضدة قهوة أكثر نشاطاً.', 320, 'tool', 1, 'f_grinder', ['quick', 'special']),
    upgrade('cold-counter', 'The cold-drink counter', 'منضدة المشروبات الباردة', 'More room to make refreshing house favourites.', 'مساحة أوسع لتحضير مشروبات الدار المنعشة.', 380, 'tool', 1, 'f_blender', ['cool']),
    upgrade('pastry-case', 'The pastry display', 'واجهة الحلويات', 'Give your baked favourites a place to shine.', 'مكان يبرز مخبوزاتك وحلوياتك المفضّلة.', 460, 'tool', 1, 'f_case', ['sharing', 'familiar']),
    upgrade('family-saj', 'The family saj', 'صاج العائلة', 'A lasting place for warm bread and family recipes.', 'مكان دائم للخبز الدافئ ووصفات العائلة.', 640, 'tool', 1, 'f_saj', ['warm', 'familiar'])
  ];
  const layouts = [
    { id: 'communal', name: L('The welcome table', 'طاولة الترحيب'), description: L('Familiar food, shared plates and room for conversation.', 'طعام مألوف وأطباق للمشاركة ومساحة للأحاديث.'), art: 'room_day', tags: ['sharing', 'familiar'] },
    { id: 'quiet', name: L('The quiet corner', 'الركن الهادئ'), description: L('A thoughtful cup, a book and a seat by the window.', 'فنجان على مهل وكتاب ومقعد بجانب النافذة.'), art: 'room_small', tags: ['special', 'warm'] },
    { id: 'express', name: L('The lively counter', 'المنضدة النشطة'), description: L('Quick favourites and cold drinks for people on the move.', 'خيارات سريعة ومشروبات باردة لمن هم في الطريق.'), art: 'room_grown', tags: ['quick', 'cool'] }
  ];
  const suppliers = [
    { id: 'local', name: L('The neighbourhood shop', 'دكّان الحي'), description: L('Familiar ingredients, standard prices and no daily supplier fee.', 'مكوّنات مألوفة بأسعار عادية ومن دون رسوم توريد يومية.'), fee: 0, costMultiplier: 1, quality: 0, art: 'p11' },
    { id: 'market', name: L('The market cooperative', 'تعاونية السوق'), description: L('Lower ingredient costs with a small daily supplier fee.', 'تكلفة أقلّ للمكوّنات مقابل رسم توريد يومي صغير.'), fee: 6, costMultiplier: 0.87, quality: 0, art: 'p16' },
    { id: 'artisan', name: L('The specialist roaster', 'المحمصة المتخصّصة'), description: L('Distinctive ingredients improve guest fit at a higher daily cost.', 'مكوّنات مميّزة تناسب أذواق الضيوف أكثر، بتكلفة يومية أعلى.'), fee: 12, costMultiplier: 1.13, quality: 0.13, art: 'p17' }
  ];
  const heirs = [
    { id: 'layla', name: L('Layla', 'ليلى'), description: L('A curious cook who adds a recipe to the family book.', 'طاهية فضولية تضيف وصفة إلى دفتر العائلة.'), trait: L('Curious cook', 'طاهية فضولية'), traitId: 'cook', art: 'p5', recipe: 'saffron', tags: ['special', 'warm'] },
    { id: 'saeed', name: L('Saeed', 'سعيد'), description: L('A generous host who sees a gathering in every empty table.', 'مضيف كريم يرى في كلّ طاولة فارغة فرصة للقاء.'), trait: L('Generous host', 'مضيف كريم'), traitId: 'host', art: 'p1', recipe: 'khameer', tags: ['sharing', 'familiar'] },
    { id: 'dana', name: L('Dana', 'دانة'), description: L('An inventive planner with a fresh idea for the morning counter.', 'مخطّطة مبتكرة لديها فكرة جديدة لمنضدة الصباح.'), trait: L('Inventive planner', 'مخطّطة مبتكرة'), traitId: 'planner', art: 'p9', recipe: 'iced', tags: ['quick', 'cool'] }
  ];
  const venues = [
    { id: 'home', name: L('Little Street', 'الشارع الصغير'), description: L('The original café. Neighbours, familiar favourites and your family’s first chapter.', 'المقهى الأول. الجيران والنكهات المألوفة وأول فصل من حكاية عائلتك.'), cost: 0, art: 'room_day', tags: ['familiar', 'sharing'] },
    { id: 'harbour', name: L('Harbour Courtyard', 'فناء الميناء'), description: L('A breezy meeting place for families, shared plates and refreshing drinks.', 'مكان مفتوح للقاء العائلات والأطباق المشتركة والمشروبات المنعشة.'), cost: 1600, art: 'br_deira', tags: ['sharing', 'cool'] },
    { id: 'city', name: L('City Corner', 'ركن المدينة'), description: L('A compact café for busy mornings, curious visitors and distinctive quick favourites.', 'مقهى صغير للصباح المزدحم والزوّار الفضوليين والخيارات السريعة المميّزة.'), cost: 2200, art: 'br_satwa', tags: ['quick', 'special'] }
  ];
  const ambition = (id, en, ar, de, da, kind, target, rewardCash) =>
    ({ id, name: L(en, ar), description: L(de, da), kind, target, rewardCash });
  const ambitions = [
    ambition('first-day', 'The first open door', 'أول يوم والباب مفتوح', 'Complete your first café day.', 'أكمل أول يوم في مقهاك.', 'days', 1, 60),
    ambition('seven-mornings', 'Seven good mornings', 'سبعة صباحات جميلة', 'Complete seven café days at your own pace.', 'أكمل سبعة أيام في المقهى بالوتيرة التي تناسبك.', 'days', 7, 100),
    ambition('month-of-mornings', 'A month of mornings', 'شهر من الصباحات', 'Complete thirty café days.', 'أكمل ثلاثين يوماً في المقهى.', 'days', 30, 200),
    ambition('first-friends', 'Familiar faces', 'وجوه مألوفة', 'Make three story choices for your café’s people.', 'اتّخذ ثلاثة قرارات في حكايات أهل المقهى.', 'stories', 3, 90),
    ambition('street-stories', 'Part of the neighbourhood', 'جزء من الحي', 'Make twelve story choices and keep their memories.', 'اتّخذ اثني عشر قراراً في الحكايات واحتفظ بذكرياتها.', 'stories', 12, 180),
    ambition('full-album', 'An album of beginnings', 'ألبوم البدايات', 'Make twenty-four story choices.', 'اتّخذ أربعة وعشرين قراراً في الحكايات.', 'stories', 24, 300),
    ambition('own-signature', 'Something only you make', 'شيء من ابتكارك', 'Create your first house recipe in the workshop.', 'ابتكر أول وصفة خاصة بك في الورشة.', 'customRecipes', 1, 120),
    ambition('recipe-collector', 'A generous recipe book', 'دفتر وصفات غنيّ', 'Learn twelve different recipes.', 'تعلّم اثنتي عشرة وصفة مختلفة.', 'recipes', 12, 180),
    ambition('a-room-of-your-own', 'A room with your touch', 'غرفة بلمستك', 'Own three permanent café improvements.', 'اقتَنِ ثلاثة تحسينات دائمة للمقهى.', 'upgrades', 3, 160),
    ambition('second-address', 'A second address', 'عنوان ثانٍ', 'Open another café with a different audience.', 'افتح مقهى آخر لجمهور مختلف.', 'venues', 2, 250),
    ambition('next-generation', 'The keys change hands', 'المفاتيح تنتقل إلى جيل جديد', 'Begin the next generation without losing what you built.', 'ابدأ الجيل التالي مع الاحتفاظ بكلّ ما بنيته.', 'generation', 2, 400),
    ambition('hundred-guests', 'A hundred welcomes', 'مئة ترحيب', 'Welcome one hundred guests across your café days.', 'استقبل مئة ضيف خلال أيام المقهى.', 'served', 100, 150)
  ];
  return { recipes, characters, stories, events, upgrades, layouts, suppliers, heirs, venues, ambitions };
});
