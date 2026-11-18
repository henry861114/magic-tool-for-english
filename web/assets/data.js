/* 学英语神器 · 词库数据
 * 每个单词按自然拼读拆成 chunk：字母组合 + 音标 + 是否元音
 * parts 为拼读/拼写步骤使用的音节块
 */
const GRADES = [
  { id: 'g3', name: '三年级', stage: '小学', color: '#F2913D', tint: '#FFF1E2' },
  { id: 'g4', name: '四年级', stage: '小学', color: '#5B9CF0', tint: '#EAF2FF' },
  { id: 'g5', name: '五年级', stage: '小学', color: '#E86A92', tint: '#FFEDF3' },
  { id: 'g6', name: '六年级', stage: '小学', color: '#4CAF7D', tint: '#EAF8F0' },
  { id: 'g7', name: '七年级', stage: '初中', color: '#7C8FE0', tint: '#EEF1FF' },
  { id: 'g8', name: '八年级', stage: '初中', color: '#3E8FA8', tint: '#E8F7FA' },
  { id: 'g9', name: '九年级', stage: '初中', color: '#8A6FD1', tint: '#F2EEFF' }
];

let UNITS = [
  {
    id: 'u1',
    grade: 'g3',
    title: 'Unit 1',
    theme: '我的教室',
    emoji: '🏫',
    color: '#F2913D',
    tint: '#FFF1E2',
    words: [
      {
        w: 'classroom', ipa: '/ˈklɑːsruːm/', cn: 'n. 教室', emoji: '🏫',
        chunks: [['cl', '/kl/'], ['a', '/ɑː/', 1], ['ss', '/s/'], ['r', '/r/'], ['oo', '/uː/', 1], ['m', '/m/']],
        parts: ['class', 'room'],
        sentence: 'This is our classroom.', sentenceCn: '这是我们的教室。'
      },
      {
        w: 'window', ipa: '/ˈwɪndəʊ/', cn: 'n. 窗户', emoji: '🪟',
        chunks: [['w', '/w/'], ['i', '/ɪ/', 1], ['n', '/n/'], ['d', '/d/'], ['ow', '/əʊ/', 1]],
        parts: ['win', 'dow'],
        sentence: 'Open the window, please.', sentenceCn: '请打开窗户。'
      },
      {
        w: 'blackboard', ipa: '/ˈblækbɔːd/', cn: 'n. 黑板', emoji: '📝',
        chunks: [['b', '/b/'], ['l', '/l/'], ['a', '/æ/', 1], ['ck', '/k/'], ['b', '/b/'], ['oa', '/ɔː/', 1], ['rd', '/d/']],
        parts: ['black', 'board'],
        sentence: 'Look at the blackboard.', sentenceCn: '看黑板。'
      },
      {
        w: 'light', ipa: '/laɪt/', cn: 'n. 灯；光', emoji: '💡',
        chunks: [['l', '/l/'], ['igh', '/aɪ/', 1], ['t', '/t/']],
        parts: ['light'],
        sentence: 'Turn on the light.', sentenceCn: '打开灯。'
      },
      {
        w: 'picture', ipa: '/ˈpɪktʃə/', cn: 'n. 图画；照片', emoji: '🖼️',
        chunks: [['p', '/p/'], ['i', '/ɪ/', 1], ['c', '/k/'], ['ture', '/tʃə/', 1]],
        parts: ['pic', 'ture'],
        sentence: 'This is a nice picture.', sentenceCn: '这是一幅漂亮的画。'
      },
      {
        w: 'door', ipa: '/dɔː/', cn: 'n. 门', emoji: '🚪',
        chunks: [['d', '/d/'], ['oo', '/ɔː/', 1], ['r', '/r/']],
        parts: ['door'],
        sentence: 'Close the door, please.', sentenceCn: '请关门。'
      },
      {
        w: 'computer', ipa: '/kəmˈpjuːtə/', cn: 'n. 计算机；电脑', emoji: '💻',
        chunks: [['c', '/k/'], ['o', '/ə/', 1], ['m', '/m/'], ['p', '/p/'], ['u', '/juː/', 1], ['t', '/t/'], ['er', '/ə/', 1]],
        parts: ['com', 'pu', 'ter'],
        sentence: 'I use a computer every day.', sentenceCn: '我每天使用电脑。'
      },
      {
        w: 'desk', ipa: '/desk/', cn: 'n. 书桌', emoji: '🗄️',
        chunks: [['d', '/d/'], ['e', '/e/', 1], ['s', '/s/'], ['k', '/k/']],
        parts: ['desk'],
        sentence: 'My desk is clean.', sentenceCn: '我的书桌很干净。'
      },
      {
        w: 'chair', ipa: '/tʃeə/', cn: 'n. 椅子', emoji: '🪑',
        chunks: [['ch', '/tʃ/'], ['air', '/eə/', 1]],
        parts: ['chair'],
        sentence: 'Sit on the chair.', sentenceCn: '坐在椅子上。'
      },
      {
        w: 'wall', ipa: '/wɔːl/', cn: 'n. 墙', emoji: '🧱',
        chunks: [['w', '/w/'], ['a', '/ɔː/', 1], ['ll', '/l/']],
        parts: ['wall'],
        sentence: 'The wall is white.', sentenceCn: '墙是白色的。'
      }
    ]
  },
  {
    id: 'u2',
    grade: 'g3',
    title: 'Unit 2',
    theme: '我的文具',
    emoji: '✏️',
    color: '#5B9CF0',
    tint: '#EAF2FF',
    words: [
      {
        w: 'pencil', ipa: '/ˈpensl/', cn: 'n. 铅笔', emoji: '✏️',
        chunks: [['p', '/p/'], ['e', '/e/', 1], ['n', '/n/'], ['cil', '/sl/']],
        parts: ['pen', 'cil'],
        sentence: 'I have a new pencil.', sentenceCn: '我有一支新铅笔。'
      },
      {
        w: 'ruler', ipa: '/ˈruːlə/', cn: 'n. 尺子', emoji: '📏',
        chunks: [['r', '/r/'], ['u', '/uː/', 1], ['l', '/l/'], ['er', '/ə/', 1]],
        parts: ['ru', 'ler'],
        sentence: 'Can I use your ruler?', sentenceCn: '我能用一下你的尺子吗？'
      },
      {
        w: 'eraser', ipa: '/ɪˈreɪzə/', cn: 'n. 橡皮', emoji: '🧽',
        chunks: [['e', '/ɪ/', 1], ['r', '/r/'], ['a', '/eɪ/', 1], ['s', '/z/'], ['er', '/ə/', 1]],
        parts: ['e', 'ra', 'ser'],
        sentence: 'Where is my eraser?', sentenceCn: '我的橡皮在哪里？'
      },
      {
        w: 'crayon', ipa: '/ˈkreɪən/', cn: 'n. 蜡笔', emoji: '🖍️',
        chunks: [['cr', '/kr/'], ['ay', '/eɪ/', 1], ['on', '/ən/', 1]],
        parts: ['cray', 'on'],
        sentence: 'I draw with a crayon.', sentenceCn: '我用蜡笔画画。'
      },
      {
        w: 'bag', ipa: '/bæɡ/', cn: 'n. 书包', emoji: '🎒',
        chunks: [['b', '/b/'], ['a', '/æ/', 1], ['g', '/ɡ/']],
        parts: ['bag'],
        sentence: 'My bag is heavy.', sentenceCn: '我的书包很重。'
      },
      {
        w: 'book', ipa: '/bʊk/', cn: 'n. 书', emoji: '📚',
        chunks: [['b', '/b/'], ['oo', '/ʊ/', 1], ['k', '/k/']],
        parts: ['book'],
        sentence: 'This book is fun.', sentenceCn: '这本书很有趣。'
      },
      {
        w: 'pen', ipa: '/pen/', cn: 'n. 钢笔', emoji: '🖊️',
        chunks: [['p', '/p/'], ['e', '/e/', 1], ['n', '/n/']],
        parts: ['pen'],
        sentence: 'Write with a pen.', sentenceCn: '用钢笔写字。'
      },
      {
        w: 'notebook', ipa: '/ˈnəʊtbʊk/', cn: 'n. 笔记本', emoji: '📓',
        chunks: [['n', '/n/'], ['o', '/əʊ/', 1], ['te', '/t/'], ['b', '/b/'], ['oo', '/ʊ/', 1], ['k', '/k/']],
        parts: ['note', 'book'],
        sentence: 'Open your notebook.', sentenceCn: '打开你的笔记本。'
      },
      {
        w: 'marker', ipa: '/ˈmɑːkə/', cn: 'n. 马克笔', emoji: '🖌️',
        chunks: [['m', '/m/'], ['ar', '/ɑː/', 1], ['k', '/k/'], ['er', '/ə/', 1]],
        parts: ['mar', 'ker'],
        sentence: 'This is a red marker.', sentenceCn: '这是一支红色的马克笔。'
      }
    ]
  },
  {
    id: 'u3',
    grade: 'g3',
    title: 'Unit 4',
    theme: '我的家人',
    emoji: '👨‍👩‍👧‍👦',
    color: '#E86A92',
    tint: '#FFEDF3',
    words: [
      {
        w: 'family', ipa: '/ˈfæməli/', cn: 'n. 家庭；家人', emoji: '👨‍👩‍👧‍👦',
        chunks: [['f', '/f/'], ['a', '/æ/', 1], ['m', '/m/'], ['i', '/ə/', 1], ['l', '/l/'], ['y', '/i/', 1]],
        parts: ['fam', 'i', 'ly'],
        sentence: 'I love my family.', sentenceCn: '我爱我的家人。'
      },
      {
        w: 'father', ipa: '/ˈfɑːðə/', cn: 'n. 爸爸', emoji: '👨',
        chunks: [['f', '/f/'], ['a', '/ɑː/', 1], ['th', '/ð/'], ['er', '/ə/', 1]],
        parts: ['fa', 'ther'],
        sentence: 'My father is tall.', sentenceCn: '我爸爸很高。'
      },
      {
        w: 'mother', ipa: '/ˈmʌðə/', cn: 'n. 妈妈', emoji: '👩',
        chunks: [['m', '/m/'], ['o', '/ʌ/', 1], ['th', '/ð/'], ['er', '/ə/', 1]],
        parts: ['mo', 'ther'],
        sentence: 'My mother cooks well.', sentenceCn: '我妈妈做饭很好吃。'
      },
      {
        w: 'brother', ipa: '/ˈbrʌðə/', cn: 'n. 哥哥；弟弟', emoji: '👦',
        chunks: [['br', '/br/'], ['o', '/ʌ/', 1], ['th', '/ð/'], ['er', '/ə/', 1]],
        parts: ['bro', 'ther'],
        sentence: 'My brother likes football.', sentenceCn: '我弟弟喜欢足球。'
      },
      {
        w: 'sister', ipa: '/ˈsɪstə/', cn: 'n. 姐姐；妹妹', emoji: '👧',
        chunks: [['s', '/s/'], ['i', '/ɪ/', 1], ['st', '/st/'], ['er', '/ə/', 1]],
        parts: ['sis', 'ter'],
        sentence: 'My sister is kind.', sentenceCn: '我姐姐很善良。'
      },
      {
        w: 'grandma', ipa: '/ˈɡrænmɑː/', cn: 'n. 奶奶；外婆', emoji: '👵',
        chunks: [['gr', '/ɡr/'], ['a', '/æ/', 1], ['n', '/n/'], ['d', ''], ['ma', '/mɑː/', 1]],
        parts: ['grand', 'ma'],
        sentence: 'Grandma tells me stories.', sentenceCn: '奶奶给我讲故事。'
      },
      {
        w: 'grandpa', ipa: '/ˈɡrænpɑː/', cn: 'n. 爷爷；外公', emoji: '👴',
        chunks: [['gr', '/ɡr/'], ['a', '/æ/', 1], ['n', '/n/'], ['d', ''], ['pa', '/pɑː/', 1]],
        parts: ['grand', 'pa'],
        sentence: 'Grandpa likes tea.', sentenceCn: '爷爷喜欢喝茶。'
      },
      {
        w: 'baby', ipa: '/ˈbeɪbi/', cn: 'n. 婴儿', emoji: '👶',
        chunks: [['b', '/b/'], ['a', '/eɪ/', 1], ['b', '/b/'], ['y', '/i/', 1]],
        parts: ['ba', 'by'],
        sentence: 'The baby is sleeping.', sentenceCn: '宝宝在睡觉。'
      },
      {
        w: 'friend', ipa: '/frend/', cn: 'n. 朋友', emoji: '🧑‍🤝‍🧑',
        chunks: [['fr', '/fr/'], ['ie', '/e/', 1], ['nd', '/nd/']],
        parts: ['friend'],
        sentence: 'She is my best friend.', sentenceCn: '她是我最好的朋友。'
      }
    ]
  },
  {
    id: 'u4',
    grade: 'g3',
    title: 'Unit 5',
    theme: '动物园',
    emoji: '🐼',
    color: '#4CAF7D',
    tint: '#EAF8F0',
    words: [
      {
        w: 'panda', ipa: '/ˈpændə/', cn: 'n. 熊猫', emoji: '🐼',
        chunks: [['p', '/p/'], ['a', '/æ/', 1], ['n', '/n/'], ['d', '/d/'], ['a', '/ə/', 1]],
        parts: ['pan', 'da'],
        sentence: 'The panda eats bamboo.', sentenceCn: '熊猫吃竹子。'
      },
      {
        w: 'monkey', ipa: '/ˈmʌŋki/', cn: 'n. 猴子', emoji: '🐵',
        chunks: [['m', '/m/'], ['o', '/ʌ/', 1], ['n', '/n/'], ['k', '/k/'], ['ey', '/i/', 1]],
        parts: ['mon', 'key'],
        sentence: 'The monkey is clever.', sentenceCn: '猴子很聪明。'
      },
      {
        w: 'elephant', ipa: '/ˈelɪfənt/', cn: 'n. 大象', emoji: '🐘',
        chunks: [['e', '/e/', 1], ['le', '/lɪ/', 1], ['ph', '/f/'], ['a', '/ə/', 1], ['nt', '/nt/']],
        parts: ['e', 'le', 'phant'],
        sentence: 'An elephant has a long nose.', sentenceCn: '大象有长长的鼻子。'
      },
      {
        w: 'tiger', ipa: '/ˈtaɪɡə/', cn: 'n. 老虎', emoji: '🐯',
        chunks: [['t', '/t/'], ['i', '/aɪ/', 1], ['g', '/ɡ/'], ['er', '/ə/', 1]],
        parts: ['ti', 'ger'],
        sentence: 'The tiger is strong.', sentenceCn: '老虎很强壮。'
      },
      {
        w: 'rabbit', ipa: '/ˈræbɪt/', cn: 'n. 兔子', emoji: '🐰',
        chunks: [['r', '/r/'], ['a', '/æ/', 1], ['bb', '/b/'], ['i', '/ɪ/', 1], ['t', '/t/']],
        parts: ['rab', 'bit'],
        sentence: 'The rabbit likes carrots.', sentenceCn: '兔子喜欢胡萝卜。'
      },
      {
        w: 'bird', ipa: '/bɜːd/', cn: 'n. 鸟', emoji: '🐦',
        chunks: [['b', '/b/'], ['ir', '/ɜː/', 1], ['d', '/d/']],
        parts: ['bird'],
        sentence: 'A bird can fly.', sentenceCn: '鸟会飞。'
      },
      {
        w: 'fish', ipa: '/fɪʃ/', cn: 'n. 鱼', emoji: '🐟',
        chunks: [['f', '/f/'], ['i', '/ɪ/', 1], ['sh', '/ʃ/']],
        parts: ['fish'],
        sentence: 'The fish swims in water.', sentenceCn: '鱼在水里游。'
      },
      {
        w: 'cat', ipa: '/kæt/', cn: 'n. 猫', emoji: '🐱',
        chunks: [['c', '/k/'], ['a', '/æ/', 1], ['t', '/t/']],
        parts: ['cat'],
        sentence: 'The cat is cute.', sentenceCn: '这只猫很可爱。'
      },
      {
        w: 'dog', ipa: '/dɒɡ/', cn: 'n. 狗', emoji: '🐶',
        chunks: [['d', '/d/'], ['o', '/ɒ/', 1], ['g', '/ɡ/']],
        parts: ['dog'],
        sentence: 'My dog is friendly.', sentenceCn: '我的狗很友好。'
      }
    ]
  },
  {
    id: 'u5',
    grade: 'g4',
    title: 'Unit 1',
    theme: '美味食物',
    emoji: '🍎',
    color: '#EE8B4A',
    tint: '#FFF2E8',
    words: [
      {
        w: 'apple', ipa: '/ˈæpl/', cn: 'n. 苹果', emoji: '🍎',
        chunks: [['a', '/æ/', 1], ['pp', '/p/'], ['le', '/l/']],
        parts: ['ap', 'ple'],
        sentence: 'I eat an apple a day.', sentenceCn: '我每天吃一个苹果。'
      },
      {
        w: 'banana', ipa: '/bəˈnɑːnə/', cn: 'n. 香蕉', emoji: '🍌',
        chunks: [['b', '/b/'], ['a', '/ə/', 1], ['n', '/n/'], ['a', '/ɑː/', 1], ['n', '/n/'], ['a', '/ə/', 1]],
        parts: ['ba', 'na', 'na'],
        sentence: 'The banana is yellow.', sentenceCn: '香蕉是黄色的。'
      },
      {
        w: 'bread', ipa: '/bred/', cn: 'n. 面包', emoji: '🍞',
        chunks: [['br', '/br/'], ['ea', '/e/', 1], ['d', '/d/']],
        parts: ['bread'],
        sentence: 'I like bread for breakfast.', sentenceCn: '我早餐喜欢吃面包。'
      },
      {
        w: 'milk', ipa: '/mɪlk/', cn: 'n. 牛奶', emoji: '🥛',
        chunks: [['m', '/m/'], ['i', '/ɪ/', 1], ['l', '/l/'], ['k', '/k/']],
        parts: ['milk'],
        sentence: 'Drink some milk.', sentenceCn: '喝点牛奶。'
      },
      {
        w: 'water', ipa: '/ˈwɔːtə/', cn: 'n. 水', emoji: '💧',
        chunks: [['w', '/w/'], ['a', '/ɔː/', 1], ['t', '/t/'], ['er', '/ə/', 1]],
        parts: ['wa', 'ter'],
        sentence: 'I drink water every day.', sentenceCn: '我每天喝水。'
      },
      {
        w: 'rice', ipa: '/raɪs/', cn: 'n. 米饭', emoji: '🍚',
        chunks: [['r', '/r/'], ['i', '/aɪ/', 1], ['ce', '/s/']],
        parts: ['rice'],
        sentence: 'We eat rice for lunch.', sentenceCn: '我们午饭吃米饭。'
      },
      {
        w: 'egg', ipa: '/eɡ/', cn: 'n. 鸡蛋', emoji: '🥚',
        chunks: [['e', '/e/', 1], ['gg', '/ɡ/']],
        parts: ['egg'],
        sentence: 'The egg is big.', sentenceCn: '这个鸡蛋很大。'
      },
      {
        w: 'cake', ipa: '/keɪk/', cn: 'n. 蛋糕', emoji: '🍰',
        chunks: [['c', '/k/'], ['a', '/eɪ/', 1], ['ke', '/k/']],
        parts: ['cake'],
        sentence: 'The cake is sweet.', sentenceCn: '蛋糕很甜。'
      },
      {
        w: 'juice', ipa: '/dʒuːs/', cn: 'n. 果汁', emoji: '🧃',
        chunks: [['j', '/dʒ/'], ['ui', '/uː/', 1], ['ce', '/s/']],
        parts: ['juice'],
        sentence: 'I like orange juice.', sentenceCn: '我喜欢橙汁。'
      }
    ]
  },
  {
    id: 'u6',
    grade: 'g3',
    title: 'Unit 3',
    theme: '缤纷颜色',
    emoji: '🌈',
    color: '#9B7BE0',
    tint: '#F3EEFF',
    words: [
      {
        w: 'red', ipa: '/red/', cn: 'adj. 红色的', emoji: '🔴',
        chunks: [['r', '/r/'], ['e', '/e/', 1], ['d', '/d/']],
        parts: ['red'],
        sentence: 'The apple is red.', sentenceCn: '苹果是红色的。'
      },
      {
        w: 'blue', ipa: '/bluː/', cn: 'adj. 蓝色的', emoji: '🔵',
        chunks: [['bl', '/bl/'], ['ue', '/uː/', 1]],
        parts: ['blue'],
        sentence: 'The sky is blue.', sentenceCn: '天空是蓝色的。'
      },
      {
        w: 'green', ipa: '/ɡriːn/', cn: 'adj. 绿色的', emoji: '🟢',
        chunks: [['g', '/ɡ/'], ['r', '/r/'], ['ee', '/iː/', 1], ['n', '/n/']],
        parts: ['green'],
        sentence: 'The grass is green.', sentenceCn: '草是绿色的。'
      },
      {
        w: 'yellow', ipa: '/ˈjeləʊ/', cn: 'adj. 黄色的', emoji: '🟡',
        chunks: [['y', '/j/'], ['e', '/e/', 1], ['ll', '/l/'], ['ow', '/əʊ/', 1]],
        parts: ['yel', 'low'],
        sentence: 'The sun is yellow.', sentenceCn: '太阳是黄色的。'
      },
      {
        w: 'orange', ipa: '/ˈɒrɪndʒ/', cn: 'adj. 橙色的；n. 橙子', emoji: '🟠',
        chunks: [['o', '/ɒ/', 1], ['r', '/r/'], ['a', '/ɪ/', 1], ['n', '/n/'], ['ge', '/dʒ/']],
        parts: ['or', 'ange'],
        sentence: 'The orange is sweet.', sentenceCn: '橙子很甜。'
      },
      {
        w: 'purple', ipa: '/ˈpɜːpl/', cn: 'adj. 紫色的', emoji: '🟣',
        chunks: [['p', '/p/'], ['ur', '/ɜː/', 1], ['p', '/p/'], ['le', '/l/']],
        parts: ['pur', 'ple'],
        sentence: 'The flower is purple.', sentenceCn: '这朵花是紫色的。'
      },
      {
        w: 'pink', ipa: '/pɪŋk/', cn: 'adj. 粉色的', emoji: '🌸',
        chunks: [['p', '/p/'], ['i', '/ɪ/', 1], ['nk', '/ŋk/']],
        parts: ['pink'],
        sentence: 'She has a pink bag.', sentenceCn: '她有一个粉色的包。'
      },
      {
        w: 'brown', ipa: '/braʊn/', cn: 'adj. 棕色的', emoji: '🟤',
        chunks: [['br', '/br/'], ['ow', '/aʊ/', 1], ['n', '/n/']],
        parts: ['brown'],
        sentence: 'The bear is brown.', sentenceCn: '熊是棕色的。'
      },
      {
        w: 'black', ipa: '/blæk/', cn: 'adj. 黑色的', emoji: '⚫',
        chunks: [['bl', '/bl/'], ['a', '/æ/', 1], ['ck', '/k/']],
        parts: ['black'],
        sentence: 'The cat is black.', sentenceCn: '这只猫是黑色的。'
      },
      {
        w: 'white', ipa: '/waɪt/', cn: 'adj. 白色的', emoji: '⚪',
        chunks: [['wh', '/w/'], ['i', '/aɪ/', 1], ['te', '/t/']],
        parts: ['white'],
        sentence: 'Snow is white.', sentenceCn: '雪是白色的。'
      }
    ]
  },
  {
    id: 'u7',
    grade: 'g3',
    title: 'Unit 6',
    theme: '我的身体',
    emoji: '🧒',
    color: '#34A9C4',
    tint: '#E9F9FC',
    words: [
      {
        w: 'head', ipa: '/hed/', cn: 'n. 头', emoji: '🙂',
        chunks: [['h', '/h/'], ['ea', '/e/', 1], ['d', '/d/']],
        parts: ['head'],
        sentence: 'Nod your head.', sentenceCn: '点点头。'
      },
      {
        w: 'hair', ipa: '/heə/', cn: 'n. 头发', emoji: '💇',
        chunks: [['h', '/h/'], ['air', '/eə/', 1]],
        parts: ['hair'],
        sentence: 'Her hair is long.', sentenceCn: '她的头发很长。'
      },
      {
        w: 'eye', ipa: '/aɪ/', cn: 'n. 眼睛', emoji: '👁️',
        chunks: [['eye', '/aɪ/', 1]],
        parts: ['eye'],
        sentence: 'I have two eyes.', sentenceCn: '我有两只眼睛。'
      },
      {
        w: 'ear', ipa: '/ɪə/', cn: 'n. 耳朵', emoji: '👂',
        chunks: [['ear', '/ɪə/', 1]],
        parts: ['ear'],
        sentence: 'I hear with my ears.', sentenceCn: '我用耳朵听。'
      },
      {
        w: 'nose', ipa: '/nəʊz/', cn: 'n. 鼻子', emoji: '👃',
        chunks: [['n', '/n/'], ['o', '/əʊ/', 1], ['se', '/z/']],
        parts: ['nose'],
        sentence: 'Touch your nose.', sentenceCn: '摸摸你的鼻子。'
      },
      {
        w: 'mouth', ipa: '/maʊθ/', cn: 'n. 嘴', emoji: '👄',
        chunks: [['m', '/m/'], ['ou', '/aʊ/', 1], ['th', '/θ/']],
        parts: ['mouth'],
        sentence: 'Open your mouth.', sentenceCn: '张开你的嘴。'
      },
      {
        w: 'hand', ipa: '/hænd/', cn: 'n. 手', emoji: '✋',
        chunks: [['h', '/h/'], ['a', '/æ/', 1], ['n', '/n/'], ['d', '/d/']],
        parts: ['hand'],
        sentence: 'Wash your hands.', sentenceCn: '洗洗你的手。'
      },
      {
        w: 'foot', ipa: '/fʊt/', cn: 'n. 脚', emoji: '🦶',
        chunks: [['f', '/f/'], ['oo', '/ʊ/', 1], ['t', '/t/']],
        parts: ['foot'],
        sentence: 'My foot hurts.', sentenceCn: '我的脚疼。'
      },
      {
        w: 'arm', ipa: '/ɑːm/', cn: 'n. 手臂', emoji: '💪',
        chunks: [['ar', '/ɑː/', 1], ['m', '/m/']],
        parts: ['arm'],
        sentence: 'Raise your arm.', sentenceCn: '抬起你的手臂。'
      },
      {
        w: 'leg', ipa: '/leɡ/', cn: 'n. 腿', emoji: '🦵',
        chunks: [['l', '/l/'], ['e', '/e/', 1], ['g', '/ɡ/']],
        parts: ['leg'],
        sentence: 'The leg is long.', sentenceCn: '这条腿很长。'
      }
    ]
  },
  {
    id: 'u8',
    grade: 'g4',
    title: 'Unit 2',
    theme: '天气变变变',
    emoji: '☀️',
    color: '#E2A21F',
    tint: '#FFF7E0',
    words: [
      {
        w: 'sunny', ipa: '/ˈsʌni/', cn: 'adj. 晴朗的', emoji: '☀️',
        chunks: [['s', '/s/'], ['u', '/ʌ/', 1], ['nn', '/n/'], ['y', '/i/', 1]],
        parts: ['sun', 'ny'],
        sentence: 'It is sunny today.', sentenceCn: '今天天气晴朗。'
      },
      {
        w: 'rainy', ipa: '/ˈreɪni/', cn: 'adj. 下雨的', emoji: '🌧️',
        chunks: [['r', '/r/'], ['ai', '/eɪ/', 1], ['n', '/n/'], ['y', '/i/', 1]],
        parts: ['rai', 'ny'],
        sentence: 'It is rainy today.', sentenceCn: '今天下雨。'
      },
      {
        w: 'cloudy', ipa: '/ˈklaʊdi/', cn: 'adj. 多云的', emoji: '☁️',
        chunks: [['cl', '/kl/'], ['ou', '/aʊ/', 1], ['d', '/d/'], ['y', '/i/', 1]],
        parts: ['clou', 'dy'],
        sentence: 'The sky is cloudy.', sentenceCn: '天空多云。'
      },
      {
        w: 'windy', ipa: '/ˈwɪndi/', cn: 'adj. 有风的', emoji: '🌬️',
        chunks: [['w', '/w/'], ['i', '/ɪ/', 1], ['n', '/n/'], ['d', '/d/'], ['y', '/i/', 1]],
        parts: ['win', 'dy'],
        sentence: 'It is windy outside.', sentenceCn: '外面风很大。'
      },
      {
        w: 'snowy', ipa: '/ˈsnəʊi/', cn: 'adj. 下雪的', emoji: '❄️',
        chunks: [['sn', '/sn/'], ['ow', '/əʊ/', 1], ['y', '/i/', 1]],
        parts: ['snow', 'y'],
        sentence: 'It is snowy in winter.', sentenceCn: '冬天会下雪。'
      },
      {
        w: 'hot', ipa: '/hɒt/', cn: 'adj. 热的', emoji: '🔥',
        chunks: [['h', '/h/'], ['o', '/ɒ/', 1], ['t', '/t/']],
        parts: ['hot'],
        sentence: 'It is hot in summer.', sentenceCn: '夏天很热。'
      },
      {
        w: 'cold', ipa: '/kəʊld/', cn: 'adj. 冷的', emoji: '🥶',
        chunks: [['c', '/k/'], ['o', '/əʊ/', 1], ['l', '/l/'], ['d', '/d/']],
        parts: ['cold'],
        sentence: 'It is cold in winter.', sentenceCn: '冬天很冷。'
      },
      {
        w: 'warm', ipa: '/wɔːm/', cn: 'adj. 温暖的', emoji: '🌤️',
        chunks: [['w', '/w/'], ['ar', '/ɔː/', 1], ['m', '/m/']],
        parts: ['warm'],
        sentence: 'The weather is warm.', sentenceCn: '天气很暖和。'
      },
      {
        w: 'cool', ipa: '/kuːl/', cn: 'adj. 凉爽的', emoji: '😎',
        chunks: [['c', '/k/'], ['oo', '/uː/', 1], ['l', '/l/']],
        parts: ['cool'],
        sentence: 'It is cool in autumn.', sentenceCn: '秋天很凉爽。'
      }
    ]
  },
  {
    id: 'u9',
    grade: 'g4',
    title: 'Unit 3',
    theme: '动作小达人',
    emoji: '🏃',
    color: '#E36B5C',
    tint: '#FFEFEC',
    words: [
      {
        w: 'run', ipa: '/rʌn/', cn: 'v. 跑', emoji: '🏃',
        chunks: [['r', '/r/'], ['u', '/ʌ/', 1], ['n', '/n/']],
        parts: ['run'],
        sentence: 'I run in the park.', sentenceCn: '我在公园跑步。'
      },
      {
        w: 'jump', ipa: '/dʒʌmp/', cn: 'v. 跳', emoji: '🤸',
        chunks: [['j', '/dʒ/'], ['u', '/ʌ/', 1], ['mp', '/mp/']],
        parts: ['jump'],
        sentence: 'Jump high!', sentenceCn: '跳得高一点！'
      },
      {
        w: 'swim', ipa: '/swɪm/', cn: 'v. 游泳', emoji: '🏊',
        chunks: [['sw', '/sw/'], ['i', '/ɪ/', 1], ['m', '/m/']],
        parts: ['swim'],
        sentence: 'I can swim.', sentenceCn: '我会游泳。'
      },
      {
        w: 'sing', ipa: '/sɪŋ/', cn: 'v. 唱歌', emoji: '🎤',
        chunks: [['s', '/s/'], ['i', '/ɪ/', 1], ['ng', '/ŋ/']],
        parts: ['sing'],
        sentence: 'Let us sing a song.', sentenceCn: '我们一起唱歌吧。'
      },
      {
        w: 'dance', ipa: '/dɑːns/', cn: 'v. 跳舞', emoji: '💃',
        chunks: [['d', '/d/'], ['a', '/ɑː/', 1], ['n', '/n/'], ['ce', '/s/']],
        parts: ['dance'],
        sentence: 'She can dance well.', sentenceCn: '她跳舞跳得很好。'
      },
      {
        w: 'read', ipa: '/riːd/', cn: 'v. 阅读', emoji: '📖',
        chunks: [['r', '/r/'], ['ea', '/iː/', 1], ['d', '/d/']],
        parts: ['read'],
        sentence: 'I read books every night.', sentenceCn: '我每天晚上看书。'
      },
      {
        w: 'write', ipa: '/raɪt/', cn: 'v. 写', emoji: '✍️',
        chunks: [['wr', '/r/'], ['i', '/aɪ/', 1], ['te', '/t/']],
        parts: ['write'],
        sentence: 'Write your name here.', sentenceCn: '在这里写下你的名字。'
      },
      {
        w: 'draw', ipa: '/drɔː/', cn: 'v. 画画', emoji: '🎨',
        chunks: [['dr', '/dr/'], ['aw', '/ɔː/', 1]],
        parts: ['draw'],
        sentence: 'I like to draw.', sentenceCn: '我喜欢画画。'
      },
      {
        w: 'play', ipa: '/pleɪ/', cn: 'v. 玩；踢球', emoji: '⚽',
        chunks: [['pl', '/pl/'], ['ay', '/eɪ/', 1]],
        parts: ['play'],
        sentence: 'Let us play together.', sentenceCn: '我们一起玩吧。'
      }
    ]
  },
  {
    id: 'g6u1',
    grade: 'g5',
    title: 'Unit 1',
    theme: '学校生活',
    emoji: '📚',
    color: '#4CAF7D',
    tint: '#EAF8F0',
    words: [
      {
        w: 'subject', ipa: '/ˈsʌbdʒɪkt/', cn: 'n. 科目', emoji: '📚',
        chunks: [['s', '/s/'], ['u', '/ʌ/', 1], ['b', '/b/'], ['j', '/dʒ/'], ['e', '/ɪ/', 1], ['ct', '/kt/']],
        parts: ['sub', 'ject'],
        sentence: 'My favourite subject is English.', sentenceCn: '我最喜欢的科目是英语。'
      },
      {
        w: 'English', ipa: '/ˈɪŋɡlɪʃ/', cn: 'n. 英语；adj. 英国的', emoji: '🔤',
        chunks: [['E', '/ɪ/', 1], ['ng', '/ŋ/'], ['l', '/l/'], ['ish', '/ɪʃ/', 1]],
        parts: ['Eng', 'lish'],
        sentence: 'I can speak English.', sentenceCn: '我会说英语。'
      },
      {
        w: 'math', ipa: '/mæθ/', cn: 'n. 数学', emoji: '➗',
        chunks: [['m', '/m/'], ['a', '/æ/', 1], ['th', '/θ/']],
        parts: ['math'],
        sentence: 'Math is my favourite subject.', sentenceCn: '数学是我最喜欢的科目。'
      },
      {
        w: 'music', ipa: '/ˈmjuːzɪk/', cn: 'n. 音乐', emoji: '🎵',
        chunks: [['m', '/m/'], ['u', '/juː/', 1], ['s', '/z/'], ['ic', '/ɪk/', 1]],
        parts: ['mu', 'sic'],
        sentence: 'We have music on Friday.', sentenceCn: '我们星期五有音乐课。'
      },
      {
        w: 'art', ipa: '/ɑːt/', cn: 'n. 美术；艺术', emoji: '🎨',
        chunks: [['ar', '/ɑː/', 1], ['t', '/t/']],
        parts: ['art'],
        sentence: 'I like art class.', sentenceCn: '我喜欢美术课。'
      },
      {
        w: 'science', ipa: '/ˈsaɪəns/', cn: 'n. 科学', emoji: '🔬',
        chunks: [['sci', '/saɪ/', 1], ['ence', '/əns/', 1]],
        parts: ['sci', 'ence'],
        sentence: 'Science is interesting.', sentenceCn: '科学很有趣。'
      },
      {
        w: 'Monday', ipa: '/ˈmʌndeɪ/', cn: 'n. 星期一', emoji: '📅',
        chunks: [['Mon', '/mʌn/', 1], ['day', '/deɪ/', 1]],
        parts: ['Mon', 'day'],
        sentence: 'We go to school on Monday.', sentenceCn: '我们星期一去上学。'
      },
      {
        w: 'Tuesday', ipa: '/ˈtjuːzdeɪ/', cn: 'n. 星期二', emoji: '🗓️',
        chunks: [['Tues', '/tjuːz/', 1], ['day', '/deɪ/', 1]],
        parts: ['Tues', 'day'],
        sentence: 'I have a music class on Tuesday.', sentenceCn: '我星期二有音乐课。'
      },
      {
        w: 'Friday', ipa: '/ˈfraɪdeɪ/', cn: 'n. 星期五', emoji: '🎉',
        chunks: [['Fri', '/fraɪ/', 1], ['day', '/deɪ/', 1]],
        parts: ['Fri', 'day'],
        sentence: 'Friday is my favourite day.', sentenceCn: '星期五是我最喜欢的一天。'
      },
      {
        w: 'weekend', ipa: '/ˌwiːkˈend/', cn: 'n. 周末', emoji: '🏖️',
        chunks: [['week', '/wiːk/', 1], ['end', '/end/', 1]],
        parts: ['week', 'end'],
        sentence: 'I play football at the weekend.', sentenceCn: '我周末踢足球。'
      }
    ]
  },
  {
    id: 'g6u2',
    grade: 'g5',
    title: 'Unit 2',
    theme: '爱好与运动',
    emoji: '⚽',
    color: '#2FA98C',
    tint: '#E8F8F3',
    words: [
      {
        w: 'hobby', ipa: '/ˈhɒbi/', cn: 'n. 爱好', emoji: '🎯',
        chunks: [['h', '/h/'], ['o', '/ɒ/', 1], ['bb', '/b/'], ['y', '/i/', 1]],
        parts: ['hob', 'by'],
        sentence: 'My hobby is reading.', sentenceCn: '我的爱好是阅读。'
      },
      {
        w: 'football', ipa: '/ˈfʊtbɔːl/', cn: 'n. 足球', emoji: '⚽',
        chunks: [['foot', '/fʊt/', 1], ['ball', '/bɔːl/', 1]],
        parts: ['foot', 'ball'],
        sentence: 'I play football with my friends.', sentenceCn: '我和朋友们踢足球。'
      },
      {
        w: 'basketball', ipa: '/ˈbɑːskɪtbɔːl/', cn: 'n. 篮球', emoji: '🏀',
        chunks: [['bas', '/bɑːs/', 1], ['ket', '/kɪt/', 1], ['ball', '/bɔːl/', 1]],
        parts: ['bas', 'ket', 'ball'],
        sentence: 'He likes basketball.', sentenceCn: '他喜欢篮球。'
      },
      {
        w: 'swimming', ipa: '/ˈswɪmɪŋ/', cn: 'n. 游泳', emoji: '🏊',
        chunks: [['sw', '/sw/'], ['i', '/ɪ/', 1], ['mm', '/m/'], ['ing', '/ɪŋ/', 1]],
        parts: ['swim', 'ming'],
        sentence: 'Swimming is good exercise.', sentenceCn: '游泳是很好的锻炼。'
      },
      {
        w: 'reading', ipa: '/ˈriːdɪŋ/', cn: 'n. 阅读', emoji: '📖',
        chunks: [['r', '/r/'], ['ea', '/iː/', 1], ['d', '/d/'], ['ing', '/ɪŋ/', 1]],
        parts: ['read', 'ing'],
        sentence: 'Reading makes me happy.', sentenceCn: '阅读让我快乐。'
      },
      {
        w: 'painting', ipa: '/ˈpeɪntɪŋ/', cn: 'n. 绘画', emoji: '🖌️',
        chunks: [['p', '/p/'], ['ai', '/eɪ/', 1], ['n', '/n/'], ['t', '/t/'], ['ing', '/ɪŋ/', 1]],
        parts: ['paint', 'ing'],
        sentence: 'She is good at painting.', sentenceCn: '她擅长绘画。'
      },
      {
        w: 'collect', ipa: '/kəˈlekt/', cn: 'v. 收集', emoji: '📦',
        chunks: [['c', '/k/'], ['o', '/ə/', 1], ['ll', '/l/'], ['e', '/ɪ/', 1], ['ct', '/kt/']],
        parts: ['col', 'lect'],
        sentence: 'I collect stamps.', sentenceCn: '我收集邮票。'
      },
      {
        w: 'guitar', ipa: '/ɡɪˈtɑː/', cn: 'n. 吉他', emoji: '🎸',
        chunks: [['gui', '/ɡɪ/', 1], ['tar', '/tɑː/', 1]],
        parts: ['gui', 'tar'],
        sentence: 'I can play the guitar.', sentenceCn: '我会弹吉他。'
      },
      {
        w: 'piano', ipa: '/piˈænəʊ/', cn: 'n. 钢琴', emoji: '🎹',
        chunks: [['p', '/p/'], ['i', '/iː/', 1], ['a', '/æ/', 1], ['n', '/n/'], ['o', '/əʊ/', 1]],
        parts: ['pi', 'a', 'no'],
        sentence: 'She plays the piano well.', sentenceCn: '她钢琴弹得很好。'
      },
      {
        w: 'chess', ipa: '/tʃes/', cn: 'n. 国际象棋', emoji: '♟️',
        chunks: [['ch', '/tʃ/'], ['e', '/e/', 1], ['ss', '/s/']],
        parts: ['chess'],
        sentence: 'Let us play chess.', sentenceCn: '我们下棋吧。'
      }
    ]
  },
  {
    id: 'g7u1',
    grade: 'g5',
    title: 'Unit 3',
    theme: '日常作息',
    emoji: '⏰',
    color: '#7C8FE0',
    tint: '#EEF1FF',
    words: [
      {
        w: 'morning', ipa: '/ˈmɔːnɪŋ/', cn: 'n. 早晨', emoji: '🌅',
        chunks: [['m', '/m/'], ['or', '/ɔː/', 1], ['n', '/n/'], ['ing', '/ɪŋ/', 1]],
        parts: ['morn', 'ing'],
        sentence: 'I get up at six in the morning.', sentenceCn: '我早上六点起床。'
      },
      {
        w: 'breakfast', ipa: '/ˈbrekfəst/', cn: 'n. 早餐', emoji: '🥣',
        chunks: [['br', '/br/'], ['ea', '/e/', 1], ['k', '/k/'], ['f', '/f/'], ['a', '/ə/', 1], ['st', '/st/']],
        parts: ['break', 'fast'],
        sentence: 'I have breakfast at seven.', sentenceCn: '我七点吃早餐。'
      },
      {
        w: 'lunch', ipa: '/lʌntʃ/', cn: 'n. 午餐', emoji: '🍱',
        chunks: [['l', '/l/'], ['u', '/ʌ/', 1], ['n', '/n/'], ['ch', '/tʃ/']],
        parts: ['lunch'],
        sentence: 'We have lunch at school.', sentenceCn: '我们在学校吃午饭。'
      },
      {
        w: 'dinner', ipa: '/ˈdɪnə/', cn: 'n. 晚餐', emoji: '🍽️',
        chunks: [['d', '/d/'], ['i', '/ɪ/', 1], ['nn', '/n/'], ['er', '/ə/', 1]],
        parts: ['din', 'ner'],
        sentence: 'My family has dinner together.', sentenceCn: '我们一家人一起吃晚饭。'
      },
      {
        w: 'homework', ipa: '/ˈhəʊmwɜːk/', cn: 'n. 家庭作业', emoji: '📝',
        chunks: [['home', '/həʊm/', 1], ['work', '/wɜːk/', 1]],
        parts: ['home', 'work'],
        sentence: 'I do my homework after school.', sentenceCn: '我放学后做作业。'
      },
      {
        w: 'exercise', ipa: '/ˈeksəsaɪz/', cn: 'n. 锻炼', emoji: '🏃',
        chunks: [['ex', '/eks/', 1], ['er', '/ə/', 1], ['cise', '/saɪz/', 1]],
        parts: ['ex', 'er', 'cise'],
        sentence: 'Exercise keeps us healthy.', sentenceCn: '锻炼让我们保持健康。'
      },
      {
        w: 'usually', ipa: '/ˈjuːʒuəli/', cn: 'adv. 通常', emoji: '⏳',
        chunks: [['usu', '/juːʒu/', 1], ['al', '/ə/', 1], ['ly', '/li/', 1]],
        parts: ['usu', 'al', 'ly'],
        sentence: 'I usually go to bed at nine.', sentenceCn: '我通常九点睡觉。'
      },
      {
        w: 'early', ipa: '/ˈɜːli/', cn: 'adv. 早地', emoji: '🌄',
        chunks: [['ear', '/ɜː/', 1], ['ly', '/li/', 1]],
        parts: ['ear', 'ly'],
        sentence: 'She gets up early every day.', sentenceCn: '她每天起得很早。'
      },
      {
        w: 'late', ipa: '/leɪt/', cn: 'adv. 晚地', emoji: '🌙',
        chunks: [['l', '/l/'], ['a', '/eɪ/', 1], ['te', '/t/']],
        parts: ['late'],
        sentence: 'Do not be late for school.', sentenceCn: '上学不要迟到。'
      },
      {
        w: 'dream', ipa: '/driːm/', cn: 'n. 梦想', emoji: '💭',
        chunks: [['dr', '/dr/'], ['ea', '/iː/', 1], ['m', '/m/']],
        parts: ['dream'],
        sentence: 'My dream is to be a doctor.', sentenceCn: '我的梦想是成为一名医生。'
      }
    ]
  },
  {
    id: 'g7u2',
    grade: 'g6',
    title: 'Unit 1',
    theme: '朋友与外貌',
    emoji: '🤝',
    color: '#D96A9A',
    tint: '#FFEDF4',
    words: [
      {
        w: 'classmate', ipa: '/ˈklɑːsmeɪt/', cn: 'n. 同学', emoji: '👥',
        chunks: [['class', '/klɑːs/', 1], ['mate', '/meɪt/', 1]],
        parts: ['class', 'mate'],
        sentence: 'My classmate is very kind.', sentenceCn: '我的同学很友善。'
      },
      {
        w: 'friendly', ipa: '/ˈfrendli/', cn: 'adj. 友好的', emoji: '🤝',
        chunks: [['fr', '/fr/'], ['ie', '/e/', 1], ['nd', '/nd/'], ['ly', '/li/', 1]],
        parts: ['friend', 'ly'],
        sentence: 'Our teacher is friendly.', sentenceCn: '我们的老师很友好。'
      },
      {
        w: 'funny', ipa: '/ˈfʌni/', cn: 'adj. 有趣的', emoji: '😂',
        chunks: [['f', '/f/'], ['u', '/ʌ/', 1], ['nn', '/n/'], ['y', '/i/', 1]],
        parts: ['fun', 'ny'],
        sentence: 'He tells funny stories.', sentenceCn: '他讲有趣的故事。'
      },
      {
        w: 'shy', ipa: '/ʃaɪ/', cn: 'adj. 害羞的', emoji: '😳',
        chunks: [['sh', '/ʃ/'], ['y', '/aɪ/', 1]],
        parts: ['shy'],
        sentence: 'The little girl is shy.', sentenceCn: '这个小女孩很害羞。'
      },
      {
        w: 'tall', ipa: '/tɔːl/', cn: 'adj. 高的', emoji: '📏',
        chunks: [['t', '/t/'], ['a', '/ɔː/', 1], ['ll', '/l/']],
        parts: ['tall'],
        sentence: 'My brother is tall.', sentenceCn: '我哥哥很高。'
      },
      {
        w: 'short', ipa: '/ʃɔːt/', cn: 'adj. 矮的；短的', emoji: '🔽',
        chunks: [['sh', '/ʃ/'], ['or', '/ɔː/', 1], ['t', '/t/']],
        parts: ['short'],
        sentence: 'She has short hair.', sentenceCn: '她留着短发。'
      },
      {
        w: 'glasses', ipa: '/ˈɡlɑːsɪz/', cn: 'n. 眼镜', emoji: '👓',
        chunks: [['gl', '/ɡl/'], ['a', '/ɑː/', 1], ['ss', '/s/'], ['es', '/ɪz/', 1]],
        parts: ['glas', 'ses'],
        sentence: 'He wears glasses.', sentenceCn: '他戴眼镜。'
      },
      {
        w: 'curly', ipa: '/ˈkɜːli/', cn: 'adj. 卷曲的', emoji: '🌀',
        chunks: [['c', '/k/'], ['ur', '/ɜː/', 1], ['ly', '/li/', 1]],
        parts: ['cur', 'ly'],
        sentence: 'She has curly hair.', sentenceCn: '她有一头卷发。'
      },
      {
        w: 'strong', ipa: '/strɒŋ/', cn: 'adj. 强壮的', emoji: '💪',
        chunks: [['str', '/str/'], ['o', '/ɒ/', 1], ['ng', '/ŋ/']],
        parts: ['strong'],
        sentence: 'The boy is strong.', sentenceCn: '这个男孩很强壮。'
      },
      {
        w: 'polite', ipa: '/pəˈlaɪt/', cn: 'adj. 有礼貌的', emoji: '🙇',
        chunks: [['p', '/p/'], ['o', '/ə/', 1], ['l', '/l/'], ['i', '/aɪ/', 1], ['te', '/t/']],
        parts: ['po', 'lite'],
        sentence: 'Be polite to everyone.', sentenceCn: '对每个人都要有礼貌。'
      }
    ]
  },
  {
    id: 'g8u1',
    grade: 'g6',
    title: 'Unit 2',
    theme: '旅行与交通',
    emoji: '✈️',
    color: '#3E8FA8',
    tint: '#E8F7FA',
    words: [
      {
        w: 'travel', ipa: '/ˈtrævl/', cn: 'v. 旅行', emoji: '✈️',
        chunks: [['tr', '/tr/'], ['a', '/æ/', 1], ['v', '/v/'], ['el', '/l/']],
        parts: ['trav', 'el'],
        sentence: 'I want to travel around China.', sentenceCn: '我想环游中国。'
      },
      {
        w: 'journey', ipa: '/ˈdʒɜːni/', cn: 'n. 旅程', emoji: '🗺️',
        chunks: [['j', '/dʒ/'], ['our', '/ɜː/', 1], ['ney', '/i/', 1]],
        parts: ['jour', 'ney'],
        sentence: 'The journey takes two hours.', sentenceCn: '这段旅程需要两个小时。'
      },
      {
        w: 'airport', ipa: '/ˈeəpɔːt/', cn: 'n. 机场', emoji: '🛫',
        chunks: [['air', '/eə/', 1], ['port', '/pɔːt/', 1]],
        parts: ['air', 'port'],
        sentence: 'We met at the airport.', sentenceCn: '我们在机场见面。'
      },
      {
        w: 'ticket', ipa: '/ˈtɪkɪt/', cn: 'n. 票', emoji: '🎫',
        chunks: [['t', '/t/'], ['i', '/ɪ/', 1], ['ck', '/k/'], ['e', '/ɪ/', 1], ['t', '/t/']],
        parts: ['tick', 'et'],
        sentence: 'I bought a train ticket.', sentenceCn: '我买了一张火车票。'
      },
      {
        w: 'train', ipa: '/treɪn/', cn: 'n. 火车', emoji: '🚆',
        chunks: [['tr', '/tr/'], ['ai', '/eɪ/', 1], ['n', '/n/']],
        parts: ['train'],
        sentence: 'The train is very fast.', sentenceCn: '火车非常快。'
      },
      {
        w: 'subway', ipa: '/ˈsʌbweɪ/', cn: 'n. 地铁', emoji: '🚇',
        chunks: [['sub', '/sʌb/', 1], ['way', '/weɪ/', 1]],
        parts: ['sub', 'way'],
        sentence: 'I go to school by subway.', sentenceCn: '我乘地铁去上学。'
      },
      {
        w: 'bridge', ipa: '/brɪdʒ/', cn: 'n. 桥', emoji: '🌉',
        chunks: [['br', '/br/'], ['i', '/ɪ/', 1], ['dge', '/dʒ/']],
        parts: ['bridge'],
        sentence: 'There is a bridge over the river.', sentenceCn: '河上有一座桥。'
      },
      {
        w: 'museum', ipa: '/mjuˈziːəm/', cn: 'n. 博物馆', emoji: '🏛️',
        chunks: [['mu', '/mjuː/', 1], ['se', '/ziː/', 1], ['um', '/əm/', 1]],
        parts: ['mu', 'se', 'um'],
        sentence: 'The museum is very big.', sentenceCn: '这座博物馆非常大。'
      },
      {
        w: 'map', ipa: '/mæp/', cn: 'n. 地图', emoji: '🗺️',
        chunks: [['m', '/m/'], ['a', '/æ/', 1], ['p', '/p/']],
        parts: ['map'],
        sentence: 'Look at the map.', sentenceCn: '看看地图。'
      },
      {
        w: 'camera', ipa: '/ˈkæmərə/', cn: 'n. 相机', emoji: '📷',
        chunks: [['c', '/k/'], ['a', '/æ/', 1], ['m', '/m/'], ['er', '/ə/', 1], ['a', '/ə/', 1]],
        parts: ['cam', 'er', 'a'],
        sentence: 'She takes photos with a camera.', sentenceCn: '她用相机拍照。'
      }
    ]
  },
  {
    id: 'g8u2',
    grade: 'g8',
    title: 'Unit 1',
    theme: '健康生活',
    emoji: '🥗',
    color: '#4FAF6C',
    tint: '#EAF8EE',
    words: [
      {
        w: 'healthy', ipa: '/ˈhelθi/', cn: 'adj. 健康的', emoji: '🥗',
        chunks: [['h', '/h/'], ['ea', '/e/', 1], ['l', '/l/'], ['th', '/θ/'], ['y', '/i/', 1]],
        parts: ['health', 'y'],
        sentence: 'Eating vegetables keeps us healthy.', sentenceCn: '吃蔬菜让我们保持健康。'
      },
      {
        w: 'doctor', ipa: '/ˈdɒktə/', cn: 'n. 医生', emoji: '👩‍⚕️',
        chunks: [['d', '/d/'], ['o', '/ɒ/', 1], ['c', '/k/'], ['t', '/t/'], ['or', '/ə/', 1]],
        parts: ['doc', 'tor'],
        sentence: 'You should see a doctor.', sentenceCn: '你应该去看医生。'
      },
      {
        w: 'medicine', ipa: '/ˈmedsn/', cn: 'n. 药', emoji: '💊',
        chunks: [['m', '/m/'], ['e', '/e/', 1], ['d', '/d/'], ['i', '/ɪ/', 1], ['cine', '/sn/']],
        parts: ['med', 'i', 'cine'],
        sentence: 'Take the medicine after dinner.', sentenceCn: '晚饭后吃药。'
      },
      {
        w: 'hospital', ipa: '/ˈhɒspɪtl/', cn: 'n. 医院', emoji: '🏥',
        chunks: [['h', '/h/'], ['o', '/ɒ/', 1], ['s', '/s/'], ['p', '/p/'], ['i', '/ɪ/', 1], ['t', '/t/'], ['al', '/l/']],
        parts: ['hos', 'pi', 'tal'],
        sentence: 'My mother works in a hospital.', sentenceCn: '我妈妈在医院工作。'
      },
      {
        w: 'toothache', ipa: '/ˈtuːθeɪk/', cn: 'n. 牙痛', emoji: '🦷',
        chunks: [['tooth', '/tuːθ/', 1], ['ache', '/eɪk/', 1]],
        parts: ['tooth', 'ache'],
        sentence: 'I have a toothache.', sentenceCn: '我牙痛。'
      },
      {
        w: 'headache', ipa: '/ˈhedeɪk/', cn: 'n. 头痛', emoji: '🤕',
        chunks: [['head', '/hed/', 1], ['ache', '/eɪk/', 1]],
        parts: ['head', 'ache'],
        sentence: 'He has a bad headache.', sentenceCn: '他头痛得厉害。'
      },
      {
        w: 'sleep', ipa: '/sliːp/', cn: 'v. 睡觉', emoji: '😴',
        chunks: [['s', '/s/'], ['l', '/l/'], ['ee', '/iː/', 1], ['p', '/p/']],
        parts: ['sleep'],
        sentence: 'Children need enough sleep.', sentenceCn: '孩子们需要充足的睡眠。'
      },
      {
        w: 'tired', ipa: '/ˈtaɪəd/', cn: 'adj. 疲倦的', emoji: '🥱',
        chunks: [['t', '/t/'], ['i', '/aɪ/', 1], ['r', '/r/'], ['ed', '/əd/', 1]],
        parts: ['ti', 'red'],
        sentence: 'I feel tired after running.', sentenceCn: '跑步后我觉得很累。'
      },
      {
        w: 'danger', ipa: '/ˈdeɪndʒə/', cn: 'n. 危险', emoji: '⚠️',
        chunks: [['d', '/d/'], ['a', '/eɪ/', 1], ['n', '/n/'], ['g', '/dʒ/'], ['er', '/ə/', 1]],
        parts: ['dan', 'ger'],
        sentence: 'The sign says danger.', sentenceCn: '牌子上写着危险。'
      },
      {
        w: 'safe', ipa: '/seɪf/', cn: 'adj. 安全的', emoji: '🛡️',
        chunks: [['s', '/s/'], ['a', '/eɪ/', 1], ['fe', '/f/']],
        parts: ['safe'],
        sentence: 'It is safe to cross the road.', sentenceCn: '过马路是安全的。'
      }
    ]
  },
  {
    id: 'g9u1',
    grade: 'g9',
    title: 'Unit 1',
    theme: '环境与未来',
    emoji: '🌍',
    color: '#3E9E69',
    tint: '#E9F8F0',
    words: [
      {
        w: 'environment', ipa: '/ɪnˈvaɪrənmənt/', cn: 'n. 环境', emoji: '🌍',
        chunks: [['en', '/ɪn/', 1], ['vi', '/vaɪ/', 1], ['ron', '/rən/', 1], ['ment', '/mənt/', 1]],
        parts: ['en', 'vi', 'ron', 'ment'],
        sentence: 'We should protect the environment.', sentenceCn: '我们应该保护环境。'
      },
      {
        w: 'pollution', ipa: '/pəˈluːʃn/', cn: 'n. 污染', emoji: '🏭',
        chunks: [['p', '/p/'], ['o', '/ə/', 1], ['ll', '/l/'], ['u', '/uː/', 1], ['tion', '/ʃn/', 1]],
        parts: ['pol', 'lu', 'tion'],
        sentence: 'Air pollution is a big problem.', sentenceCn: '空气污染是个大问题。'
      },
      {
        w: 'protect', ipa: '/prəˈtekt/', cn: 'v. 保护', emoji: '🛡️',
        chunks: [['pr', '/pr/'], ['o', '/ə/', 1], ['t', '/t/'], ['e', '/e/', 1], ['ct', '/kt/']],
        parts: ['pro', 'tect'],
        sentence: 'We must protect wild animals.', sentenceCn: '我们必须保护野生动物。'
      },
      {
        w: 'recycle', ipa: '/ˌriːˈsaɪkl/', cn: 'v. 回收', emoji: '♻️',
        chunks: [['re', '/riː/', 1], ['cy', '/saɪ/', 1], ['cle', '/kl/']],
        parts: ['re', 'cy', 'cle'],
        sentence: 'We recycle paper and bottles.', sentenceCn: '我们回收纸张和瓶子。'
      },
      {
        w: 'future', ipa: '/ˈfjuːtʃə/', cn: 'n. 未来', emoji: '🔮',
        chunks: [['f', '/f/'], ['u', '/juː/', 1], ['t', '/t/'], ['ure', '/tʃə/', 1]],
        parts: ['fu', 'ture'],
        sentence: 'What will the future be like?', sentenceCn: '未来会是什么样呢？'
      },
      {
        w: 'planet', ipa: '/ˈplænɪt/', cn: 'n. 行星', emoji: '🪐',
        chunks: [['pl', '/pl/'], ['a', '/æ/', 1], ['n', '/n/'], ['e', '/ɪ/', 1], ['t', '/t/']],
        parts: ['plan', 'et'],
        sentence: 'The earth is our home planet.', sentenceCn: '地球是我们的家园。'
      },
      {
        w: 'energy', ipa: '/ˈenədʒi/', cn: 'n. 能源', emoji: '⚡',
        chunks: [['e', '/e/', 1], ['n', '/n/'], ['er', '/ə/', 1], ['gy', '/dʒi/', 1]],
        parts: ['en', 'er', 'gy'],
        sentence: 'We should save energy.', sentenceCn: '我们应该节约能源。'
      },
      {
        w: 'plastic', ipa: '/ˈplæstɪk/', cn: 'n. 塑料', emoji: '🧴',
        chunks: [['pl', '/pl/'], ['a', '/æ/', 1], ['st', '/st/'], ['i', '/ɪ/', 1], ['c', '/k/']],
        parts: ['plas', 'tic'],
        sentence: 'Do not use too much plastic.', sentenceCn: '不要使用太多塑料。'
      },
      {
        w: 'forest', ipa: '/ˈfɒrɪst/', cn: 'n. 森林', emoji: '🌳',
        chunks: [['f', '/f/'], ['o', '/ɒ/', 1], ['r', '/r/'], ['e', '/ɪ/', 1], ['st', '/st/']],
        parts: ['for', 'est'],
        sentence: 'Many animals live in the forest.', sentenceCn: '许多动物生活在森林里。'
      },
      {
        w: 'clean', ipa: '/kliːn/', cn: 'v. 清洁；adj. 干净的', emoji: '🧼',
        chunks: [['cl', '/kl/'], ['ea', '/iː/', 1], ['n', '/n/']],
        parts: ['clean'],
        sentence: 'Let us clean the classroom.', sentenceCn: '我们来打扫教室吧。'
      }
    ]
  },
  {
    id: 'g9u2',
    grade: 'g8',
    title: 'Unit 2',
    theme: '科技与发明',
    emoji: '🤖',
    color: '#8A6FD1',
    tint: '#F2EEFF',
    words: [
      {
        w: 'technology', ipa: '/tekˈnɒlədʒi/', cn: 'n. 科技', emoji: '💡',
        chunks: [['tech', '/tek/', 1], ['no', '/nɒ/', 1], ['lo', '/lə/', 1], ['gy', '/dʒi/', 1]],
        parts: ['tech', 'no', 'lo', 'gy'],
        sentence: 'Technology changes our life.', sentenceCn: '科技改变我们的生活。'
      },
      {
        w: 'invention', ipa: '/ɪnˈvenʃn/', cn: 'n. 发明', emoji: '🧪',
        chunks: [['in', '/ɪn/', 1], ['ven', '/ven/', 1], ['tion', '/ʃn/', 1]],
        parts: ['in', 'ven', 'tion'],
        sentence: 'The telephone is a great invention.', sentenceCn: '电话是一项伟大的发明。'
      },
      {
        w: 'machine', ipa: '/məˈʃiːn/', cn: 'n. 机器', emoji: '⚙️',
        chunks: [['m', '/m/'], ['a', '/ə/', 1], ['ch', '/ʃ/'], ['ine', '/iːn/', 1]],
        parts: ['ma', 'chine'],
        sentence: 'This machine can help us.', sentenceCn: '这台机器能帮助我们。'
      },
      {
        w: 'robot', ipa: '/ˈrəʊbɒt/', cn: 'n. 机器人', emoji: '🤖',
        chunks: [['r', '/r/'], ['o', '/əʊ/', 1], ['b', '/b/'], ['ot', '/ɒt/', 1]],
        parts: ['ro', 'bot'],
        sentence: 'The robot can walk and talk.', sentenceCn: '机器人会走路和说话。'
      },
      {
        w: 'internet', ipa: '/ˈɪntənet/', cn: 'n. 互联网', emoji: '🌐',
        chunks: [['in', '/ɪn/', 1], ['ter', '/tə/', 1], ['net', '/net/', 1]],
        parts: ['in', 'ter', 'net'],
        sentence: 'We can learn a lot on the internet.', sentenceCn: '我们可以在网上学到很多。'
      },
      {
        w: 'digital', ipa: '/ˈdɪdʒɪtl/', cn: 'adj. 数字的', emoji: '💻',
        chunks: [['d', '/d/'], ['i', '/ɪ/', 1], ['g', '/dʒ/'], ['i', '/ɪ/', 1], ['tal', '/tl/']],
        parts: ['dig', 'i', 'tal'],
        sentence: 'We live in a digital world.', sentenceCn: '我们生活在数字世界里。'
      },
      {
        w: 'invent', ipa: '/ɪnˈvent/', cn: 'v. 发明', emoji: '💡',
        chunks: [['in', '/ɪn/', 1], ['v', '/v/'], ['e', '/e/', 1], ['nt', '/nt/']],
        parts: ['in', 'vent'],
        sentence: 'Who invented the telephone?', sentenceCn: '谁发明了电话？'
      },
      {
        w: 'electricity', ipa: '/ɪˌlekˈtrɪsəti/', cn: 'n. 电', emoji: '⚡',
        chunks: [['e', '/ɪ/', 1], ['lec', '/lek/', 1], ['tri', '/trɪ/', 1], ['ci', '/sə/', 1], ['ty', '/ti/', 1]],
        parts: ['e', 'lec', 'tri', 'ci', 'ty'],
        sentence: 'We use electricity every day.', sentenceCn: '我们每天都用电。'
      },
      {
        w: 'space', ipa: '/speɪs/', cn: 'n. 太空', emoji: '🚀',
        chunks: [['sp', '/sp/'], ['a', '/eɪ/', 1], ['ce', '/s/']],
        parts: ['space'],
        sentence: 'People can travel into space.', sentenceCn: '人们可以进入太空旅行。'
      },
      {
        w: 'screen', ipa: '/skriːn/', cn: 'n. 屏幕', emoji: '📱',
        chunks: [['scr', '/skr/'], ['ee', '/iː/', 1], ['n', '/n/']],
        parts: ['screen'],
        sentence: 'Do not look at the screen for too long.', sentenceCn: '不要长时间看屏幕。'
      }
    ]
  }
,
  {
    id: 'g7u3',
    grade: 'g7',
    title: 'Unit 1',
    theme: '衣服与购物',
    emoji: '👕',
    color: '#D96A9A',
    tint: '#FFEDF4',
    words: [
      {
        w: 'clothes', ipa: '/kləʊðz/', cn: 'n. 衣服', emoji: '👕',
        chunks: [['cl', '/kl/'], ['o', '/əʊ/', 1], ['th', '/ð/'], ['es', '/z/']],
        parts: ['clothes'],
        sentence: 'I need some new clothes.', sentenceCn: '我需要一些新衣服。'
      },
      {
        w: 'shirt', ipa: '/ʃɜːt/', cn: 'n. 衬衫', emoji: '👔',
        chunks: [['sh', '/ʃ/'], ['ir', '/ɜː/', 1], ['t', '/t/']],
        parts: ['shirt'],
        sentence: 'This shirt is white.', sentenceCn: '这件衬衫是白色的。'
      },
      {
        w: 'sweater', ipa: '/ˈswetə/', cn: 'n. 毛衣', emoji: '🧥',
        chunks: [['sw', '/sw/'], ['ea', '/e/', 1], ['t', '/t/'], ['er', '/ə/', 1]],
        parts: ['sweat', 'er'],
        sentence: 'My sweater is warm.', sentenceCn: '我的毛衣很暖和。'
      },
      {
        w: 'skirt', ipa: '/skɜːt/', cn: 'n. 短裙', emoji: '👗',
        chunks: [['sk', '/sk/'], ['ir', '/ɜː/', 1], ['t', '/t/']],
        parts: ['skirt'],
        sentence: 'She likes the blue skirt.', sentenceCn: '她喜欢这条蓝色的短裙。'
      },
      {
        w: 'shorts', ipa: '/ʃɔːts/', cn: 'n. 短裤', emoji: '🩳',
        chunks: [['sh', '/ʃ/'], ['or', '/ɔː/', 1], ['ts', '/ts/']],
        parts: ['shorts'],
        sentence: 'He wears shorts in summer.', sentenceCn: '他夏天穿短裤。'
      },
      {
        w: 'socks', ipa: '/sɒks/', cn: 'n. 袜子', emoji: '🧦',
        chunks: [['s', '/s/'], ['o', '/ɒ/', 1], ['ck', '/k/'], ['s', '/s/']],
        parts: ['socks'],
        sentence: 'These socks are only five dollars.', sentenceCn: '这双袜子只要五美元。'
      },
      {
        w: 'shoes', ipa: '/ʃuːz/', cn: 'n. 鞋子', emoji: '👟',
        chunks: [['sh', '/ʃ/'], ['oe', '/uː/', 1], ['s', '/z/']],
        parts: ['shoes'],
        sentence: 'My shoes are new.', sentenceCn: '我的鞋子是新的。'
      },
      {
        w: 'hat', ipa: '/hæt/', cn: 'n. 帽子', emoji: '🎩',
        chunks: [['h', '/h/'], ['a', '/æ/', 1], ['t', '/t/']],
        parts: ['hat'],
        sentence: 'Put on your hat.', sentenceCn: '戴上你的帽子。'
      },
      {
        w: 'buy', ipa: '/baɪ/', cn: 'v. 买', emoji: '🛒',
        chunks: [['b', '/b/'], ['uy', '/aɪ/', 1]],
        parts: ['buy'],
        sentence: 'I want to buy a shirt.', sentenceCn: '我想买一件衬衫。'
      },
      {
        w: 'sale', ipa: '/seɪl/', cn: 'n. 促销；特价销售', emoji: '🏷️',
        chunks: [['s', '/s/'], ['a', '/eɪ/', 1], ['le', '/l/']],
        parts: ['sale'],
        sentence: 'The clothes are on sale.', sentenceCn: '这些衣服正在打折。'
      }
    ]
  },
  {
    id: 'g7u4',
    grade: 'g7',
    title: 'Unit 2',
    theme: '校园与规则',
    emoji: '📜',
    color: '#7C8FE0',
    tint: '#EEF1FF',
    words: [
      {
        w: 'rule', ipa: '/ruːl/', cn: 'n. 规则', emoji: '📜',
        chunks: [['r', '/r/'], ['u', '/uː/', 1], ['le', '/l/']],
        parts: ['rule'],
        sentence: 'We have many school rules.', sentenceCn: '我们有很多校规。'
      },
      {
        w: 'arrive', ipa: '/əˈraɪv/', cn: 'v. 到达', emoji: '⏰',
        chunks: [['a', '/ə/', 1], ['rr', '/r/'], ['ive', '/aɪv/', 1]],
        parts: ['ar', 'rive'],
        sentence: 'Do not arrive late for class.', sentenceCn: '上课不要迟到。'
      },
      {
        w: 'hallway', ipa: '/ˈhɔːlweɪ/', cn: 'n. 走廊', emoji: '🏫',
        chunks: [['hall', '/hɔːl/', 1], ['way', '/weɪ/', 1]],
        parts: ['hall', 'way'],
        sentence: 'Do not run in the hallway.', sentenceCn: '不要在走廊里奔跑。'
      },
      {
        w: 'fight', ipa: '/faɪt/', cn: 'v. 打架', emoji: '🥊',
        chunks: [['f', '/f/'], ['igh', '/aɪ/', 1], ['t', '/t/']],
        parts: ['fight'],
        sentence: 'Do not fight with others.', sentenceCn: '不要和别人打架。'
      },
      {
        w: 'quiet', ipa: '/ˈkwaɪət/', cn: 'adj. 安静的', emoji: '🤫',
        chunks: [['qu', '/kw/'], ['i', '/aɪ/', 1], ['et', '/ət/', 1]],
        parts: ['qui', 'et'],
        sentence: 'Please be quiet in the library.', sentenceCn: '在图书馆请保持安静。'
      },
      {
        w: 'wear', ipa: '/weə/', cn: 'v. 穿；戴', emoji: '🧢',
        chunks: [['w', '/w/'], ['ear', '/eə/', 1]],
        parts: ['wear'],
        sentence: 'We must wear school uniforms.', sentenceCn: '我们必须穿校服。'
      },
      {
        w: 'uniform', ipa: '/ˈjuːnɪfɔːm/', cn: 'n. 校服', emoji: '👔',
        chunks: [['u', '/juː/', 1], ['ni', '/nɪ/', 1], ['form', '/fɔːm/', 1]],
        parts: ['u', 'ni', 'form'],
        sentence: 'Our school uniform is blue.', sentenceCn: '我们的校服是蓝色的。'
      },
      {
        w: 'outside', ipa: '/ˌaʊtˈsaɪd/', cn: 'adv. 在外面', emoji: '🌳',
        chunks: [['out', '/aʊt/', 1], ['side', '/saɪd/', 1]],
        parts: ['out', 'side'],
        sentence: 'Do not eat outside the classroom.', sentenceCn: '不要在教室外面吃东西。'
      },
      {
        w: 'listen', ipa: '/ˈlɪsn/', cn: 'v. 听', emoji: '👂',
        chunks: [['l', '/l/'], ['i', '/ɪ/', 1], ['s', '/s/'], ['ten', '/tn/']],
        parts: ['lis', 'ten'],
        sentence: 'Listen to the teacher carefully.', sentenceCn: '认真听老师讲课。'
      },
      {
        w: 'respect', ipa: '/rɪˈspekt/', cn: 'v. 尊重', emoji: '🤝',
        chunks: [['re', '/rɪ/', 1], ['spect', '/spekt/', 1]],
        parts: ['re', 'spect'],
        sentence: 'We should respect our teachers.', sentenceCn: '我们应该尊敬老师。'
      }
    ]
  },
  {
    id: 'g9u3',
    grade: 'g9',
    title: 'Unit 2',
    theme: '成长与规则',
    emoji: '🌱',
    color: '#3E9E69',
    tint: '#E9F8F0',
    words: [
      {
        w: 'teenager', ipa: '/ˈtiːneɪdʒə/', cn: 'n. 青少年', emoji: '🧑',
        chunks: [['teen', '/tiːn/', 1], ['ager', '/eɪdʒə/', 1]],
        parts: ['teen', 'ager'],
        sentence: 'Teenagers have many dreams.', sentenceCn: '青少年有很多梦想。'
      },
      {
        w: 'allow', ipa: '/əˈlaʊ/', cn: 'v. 允许', emoji: '✅',
        chunks: [['a', '/ə/', 1], ['ll', '/l/'], ['ow', '/aʊ/', 1]],
        parts: ['al', 'low'],
        sentence: 'My parents allow me to play after homework.', sentenceCn: '我父母允许我写完作业后玩。'
      },
      {
        w: 'choice', ipa: '/tʃɔɪs/', cn: 'n. 选择', emoji: '🤔',
        chunks: [['ch', '/tʃ/'], ['oi', '/ɔɪ/', 1], ['ce', '/s/']],
        parts: ['choice'],
        sentence: 'You should make your own choice.', sentenceCn: '你应该自己做选择。'
      },
      {
        w: 'decision', ipa: '/dɪˈsɪʒn/', cn: 'n. 决定', emoji: '🧭',
        chunks: [['de', '/dɪ/', 1], ['ci', '/sɪ/', 1], ['sion', '/ʒn/', 1]],
        parts: ['de', 'ci', 'sion'],
        sentence: 'It is an important decision.', sentenceCn: '这是一个重要的决定。'
      },
      {
        w: 'safety', ipa: '/ˈseɪfti/', cn: 'n. 安全', emoji: '🛡️',
        chunks: [['s', '/s/'], ['a', '/eɪ/', 1], ['fe', '/f/'], ['ty', '/ti/', 1]],
        parts: ['safe', 'ty'],
        sentence: 'Safety comes first.', sentenceCn: '安全第一。'
      },
      {
        w: 'responsibility', ipa: '/rɪˌspɒnsəˈbɪləti/', cn: 'n. 责任', emoji: '🎯',
        chunks: [['re', '/rɪ/', 1], ['spon', '/spɒn/', 1], ['si', '/sə/', 1], ['bil', '/bɪl/', 1], ['i', '/ə/', 1], ['ty', '/ti/', 1]],
        parts: ['re', 'spon', 'si', 'bil', 'i', 'ty'],
        sentence: 'It is our responsibility to protect the earth.', sentenceCn: '保护地球是我们的责任。'
      },
      {
        w: 'communicate', ipa: '/kəˈmjuːnɪkeɪt/', cn: 'v. 沟通', emoji: '💬',
        chunks: [['com', '/kəm/', 1], ['mu', '/mjuː/', 1], ['ni', '/nɪ/', 1], ['cate', '/keɪt/', 1]],
        parts: ['com', 'mu', 'ni', 'cate'],
        sentence: 'We should communicate with our parents.', sentenceCn: '我们应该和父母沟通。'
      },
      {
        w: 'improve', ipa: '/ɪmˈpruːv/', cn: 'v. 提高；改善', emoji: '📈',
        chunks: [['im', '/ɪm/', 1], ['prove', '/pruːv/', 1]],
        parts: ['im', 'prove'],
        sentence: 'I want to improve my English.', sentenceCn: '我想提高我的英语。'
      },
      {
        w: 'grow', ipa: '/ɡrəʊ/', cn: 'v. 成长', emoji: '🌱',
        chunks: [['gr', '/ɡr/'], ['ow', '/əʊ/', 1]],
        parts: ['grow'],
        sentence: 'Children grow up quickly.', sentenceCn: '孩子们成长得很快。'
      },
      {
        w: 'brave', ipa: '/breɪv/', cn: 'adj. 勇敢的', emoji: '🦁',
        chunks: [['br', '/br/'], ['a', '/eɪ/', 1], ['ve', '/v/']],
        parts: ['brave'],
        sentence: 'Be brave and try again.', sentenceCn: '勇敢一点，再试一次。'
      }
    ]
  }

];

// 人教版 PEP 全年级词库（由 tools/build_pep_all.py 生成）
if (typeof PEP_ALL_UNITS !== 'undefined') {
  UNITS = PEP_ALL_UNITS;
}

const WORD_INDEX = {};
UNITS.forEach((unit, ui) => {
  unit.words.forEach((word, wi) => {
    WORD_INDEX[unit.id + ':' + word.w] = { unitIndex: ui, wordIndex: wi, unit, word };
  });
});
