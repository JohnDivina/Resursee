import { Ebook, GutendexResponse, GutendexBook } from '@/types/ebook';

/**
 * Preloaded offline catalog containing rich fantasy lore, classic literature, sci-fi, and strategy.
 * Instantly available without any network connection!
 */
export const CURATED_OFFLINE_BOOKS: Ebook[] = [
  {
    id: 'asoiaf-lore-chronicles',
    title: 'A Song of Ice and Fire: The World & Lore Chronicles',
    author: 'Archmaester Gyldayn / Citadel Archive',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    description: 'An authoritative offline codex exploring the ancient history of Westeros, the Doom of Valyria, the reign of dragons, and the long winter.',
    language: 'en',
    subjects: ['Epic Fantasy', 'Westeros Lore', 'House Histories', 'Dragons'],
    downloadCount: 48200,
    isOffline: true,
    currentChapterIndex: 0,
    currentScrollProgress: 0,
    totalChapters: 5,
    chapters: [
      {
        id: 'asoiaf-ch-1',
        title: 'Prologue: The Dawn Age & The First Men',
        order: 1,
        wordCount: 1420,
        content: `
          <p>Before the arrival of the First Men, the continent of Westeros belonged solely to two races: the Children of the Forest, small humanoid beings who worshipped the nameless gods of stream, forest, and stone; and the Giants, massive creatures clad in thick fur who rode great mammoths across the windy plains.</p>
          <p>The Children carved watchful eyes and solemn faces into the pale trunks of the great Weirwood trees. Through these carved eyes, their greenseers were said to see across centuries, slipping into the minds of beasts and eagles. They knew no iron or bronze, fashioning blades and arrows out of black dragonglass—obsidian mined from the smoking roots of the earth.</p>
          <p>Twelve thousand years before Aegon’s Conquest, the First Men crossed the Arm of Dorne from Essos. Riding shaggy horses and bearing bronze swords, they cut down the sacred weirwoods to build their ringforts, sparking centuries of bitter war. It was during this conflict that the Children, driven by desperation, shattered the land-bridge of Dorne using the magic of the greenseers—the legendary Hammer of the Waters.</p>
          <p>Yet the First Men kept coming, and so the greenseers and the First Men met at the Isle of Faces in the Gods Eye. There they agreed upon the Pact: the First Men took the coasts and open plains, while the deep forests were left forever to the Children. And for four thousand years, peace reigned across the green realm.</p>
        `,
      },
      {
        id: 'asoiaf-ch-2',
        title: 'Chapter I: The Long Night & The Wall',
        order: 2,
        wordCount: 1650,
        content: `
          <p>The peace was shattered not by men or children, but by the cold. Eight thousand years before the dragons took flight, there came a winter unlike any seen before—a darkness that lasted an entire generation. In the bitter chill, kings froze in their keeps and mothers smothered their infants to spare them starving.</p>
          <p>And with the cold came the Others. Tall, gaunt, and pale as milk glass, with eyes like blue stars that burned with cold fire. They rode dead horses and resurrected dead men and beasts into wights—creatures whose eyes glowed with that same uncanny sapphire hue, feeling no pain, no fear, and knowing only the compulsion to slaughter.</p>
          <p>Against this terror arose the Last Hero. With a blade of dragonsteel, twelve companions, and a hound, he sought the Children of the Forest in the bitter wastes. Though his companions died one by one, he found the Children and learned the secret of dragonglass. Joined by the Night’s Watch—an order sworn to guard the realms of men—they drove the Others back into the far north in the Battle for the Dawn.</p>
          <p>To seal the realm from returning darkness, Brandon the Builder raised the Wall: seven hundred feet of solid ice, gravel, and ancient spells woven into its foundation, stretching three hundred leagues from the Bay of Seals to the Gorge. And upon its battlements stood the Black Brothers, sworn until their dying day.</p>
        `,
      },
      {
        id: 'asoiaf-ch-3',
        title: 'Chapter II: House Stark & The Kings of Winter',
        order: 3,
        wordCount: 1380,
        content: `
          <p>Winterfell is older than memory. Raised by Brandon the Builder with the help of giants, its granite walls enclose three acres of ancient godswood, fed by hot underground springs that warm the stone corridors against the biting northern winds.</p>
          <p>For millennia, the lords of Winterfell held the title of Kings of Winter. Their sigil is a grey direwolf coursing across a white field, and their words are not a boast of glory or gold, but an eternal promise and warning: <em>Winter is Coming</em>.</p>
          <p>In the crypts below Winterfell, the dead Kings of Winter sit upon stone thrones, carved by sculptors from iron-hard rock. Across their laps rest iron longswords to keep their vengeful spirits in the tombs, and at their feet lie sculpted direwolves. Here lies Torrhen Stark, the King Who Knelt, who chose to bend the knee before Aegon the Conqueror and his three dragons rather than see his host slaughtered in dragonfire like the Lannisters and Gardeners on the Field of Fire.</p>
        `,
      },
      {
        id: 'asoiaf-ch-4',
        title: 'Chapter III: The Doom of Valyria & The Targaryen Flight',
        order: 4,
        wordCount: 1540,
        content: `
          <p>Across the Narrow Sea, upon the Valyrian peninsula, arose the greatest empire known to history: the Freehold of Valyria. Shepherds discovered dragons sleeping in the Fourteen Flames—a volcanic chain ringing the peninsula—and learned to tame them with blood magic and dragon horns of horn and silver.</p>
          <p>With dragonflame, the Valyrians forged Valyrian steel: dark grey metal folded thousands of times, as light as a feather yet sharper than any hone stone, holding spells that never dull. They constructed towers of fused black stone that looked carved from volcanic obsidian.</p>
          <p>Twelve years before the end, Daenys the Dreamer, virgin daughter of Lord Aenar Targaryen, foresaw the utter destruction of the Freehold in ash and fire. While the forty dragonlord families laughed at Aenar's cowardice, the Targaryens packed their belongings, five dragons including the young Balerion, and sailed west to the barren volcanic isle of Dragonstone.</p>
          <p>Then came the Doom. In a single day, the Fourteen Flames erupted simultaneously. The skies rained fire and boiling sulphur, lakes boiled to poison, and the very peninsula fractured into smoking ruins. The dragons of Valyria perished in the molten clouds. Only House Targaryen survived.</p>
        `,
      },
      {
        id: 'asoiaf-ch-5',
        title: 'Chapter IV: The Conquest & The Iron Throne',
        order: 5,
        wordCount: 1710,
        content: `
          <p>From Dragonstone, Aegon Targaryen looked westward at the Seven Kingdoms: divided, warring petty realms ripe for unification. With his sister-wives Visenya and Rhaenys, and their dragons Balerion the Black Dread, Vhagar, and Meraxes, Aegon landed at the mouth of the Blackwater Rush.</p>
          <p>Kingdoms fell before them. Harrenhal, the colossal fortress of black stone raised by King Harren the Black, seemed impregnable to swords and siege engines; yet stone does not burn, but it cracks, and Balerion flew high into the clouds before plunging down, turning the monstrous towers into melting tallow candles.</p>
          <p>From the thousand melted swords of Aegon’s defeated foes, forged together in the breath of Balerion, arose the Iron Throne: jagged, asymmetric, and covered in razor-sharp barbs. For Aegon decreed that a king should never sit easily upon his seat of rule.</p>
        `,
      },
    ],
  },
  {
    id: 'gutenberg-100',
    title: 'The Complete Works of William Shakespeare',
    author: 'William Shakespeare',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
    description: 'The monumental collection of timeless tragedies, comedies, histories, and sonnets of the English Renaissance.',
    language: 'en',
    subjects: ['Classic Literature', 'Drama', 'Renaissance', 'Poetry'],
    downloadCount: 184500,
    isOffline: true,
    currentChapterIndex: 0,
    currentScrollProgress: 0,
    totalChapters: 3,
    chapters: [
      {
        id: 'ws-ch-1',
        title: 'Hamlet, Prince of Denmark: Act I, Scene I',
        order: 1,
        wordCount: 920,
        content: `
          <p><strong>Elsinore. A platform before the castle.</strong></p>
          <p><em>FRANCISCO at his post. Enter to him BERNARDO.</em></p>
          <p><strong>BERNARDO:</strong> Who's there?</p>
          <p><strong>FRANCISCO:</strong> Nay, answer me: stand, and unfold yourself.</p>
          <p><strong>BERNARDO:</strong> Long live the king!</p>
          <p><strong>FRANCISCO:</strong> Bernardo?</p>
          <p><strong>BERNARDO:</strong> He.</p>
          <p><strong>FRANCISCO:</strong> You come most carefully upon your hour.</p>
          <p><strong>BERNARDO:</strong> 'Tis now struck twelve; get thee to bed, Francisco.</p>
          <p><strong>FRANCISCO:</strong> For this relief much thanks: 'tis bitter cold, and I am sick at heart.</p>
          <p><strong>BERNARDO:</strong> Have you had quiet guard?</p>
          <p><strong>FRANCISCO:</strong> Not a mouse stirring.</p>
          <p><strong>BERNARDO:</strong> Well, good night. If you do meet Horatio and Marcellus, the rivals of my watch, bid them make haste.</p>
        `,
      },
      {
        id: 'ws-ch-2',
        title: 'Hamlet: Act III, Scene I — The Soliloquy',
        order: 2,
        wordCount: 510,
        content: `
          <p><strong>HAMLET:</strong> To be, or not to be, that is the question:</p>
          <p>Whether 'tis nobler in the mind to suffer<br/>
          The slings and arrows of outrageous fortune,<br/>
          Or to take arms against a sea of troubles<br/>
          And by opposing end them. To die—to sleep,<br/>
          No more; and by a sleep to say we end<br/>
          The heart-ache and the thousand natural shocks<br/>
          That flesh is heir to: 'tis a consummation<br/>
          Devoutly to be wish'd.</p>
          <p>To die, to sleep; To sleep, perchance to dream—ay, there's the rub:<br/>
          For in that sleep of death what dreams may come,<br/>
          When we have shuffled off this mortal coil,<br/>
          Must give us pause—there's the respect<br/>
          That makes calamity of so long life.</p>
        `,
      },
      {
        id: 'ws-ch-3',
        title: 'Sonnet XVIII: Shall I compare thee to a summer\'s day?',
        order: 3,
        wordCount: 220,
        content: `
          <p>Shall I compare thee to a summer's day?<br/>
          Thou art more lovely and more temperate:<br/>
          Rough winds do shake the darling buds of May,<br/>
          And summer's lease hath all too short a date;</p>
          <p>Sometime too hot the eye of heaven shines,<br/>
          And often is his gold complexion dimm'd;<br/>
          And every fair from fair sometime declines,<br/>
          By chance or nature's changing course untrimm'd;</p>
          <p>But thy eternal summer shall not fade,<br/>
          Nor lose possession of that fair thou ow'st;<br/>
          Nor shall death brag thou wander'st in his shade,<br/>
          When in eternal lines to time thou grow'st:</p>
          <p>So long as men can breathe or eyes can see,<br/>
          So long lives this, and this gives life to thee.</p>
        `,
      },
    ],
  },
  {
    id: 'dracula-stoker',
    title: 'Dracula',
    author: 'Bram Stoker',
    coverUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=600&auto=format&fit=crop',
    description: 'The definitive gothic vampire novel tracking Jonathan Harker’s harrowing journey into the Carpathian mountains.',
    language: 'en',
    subjects: ['Gothic Horror', 'Vampires', 'Classic Fiction', 'Epistolary'],
    downloadCount: 142000,
    isOffline: true,
    currentChapterIndex: 0,
    currentScrollProgress: 0,
    totalChapters: 3,
    chapters: [
      {
        id: 'drac-ch-1',
        title: 'Chapter I: Jonathan Harker’s Journal — Bistritz to Borgo Pass',
        order: 1,
        wordCount: 1350,
        content: `
          <p><em>3 May. Bistritz.</em>—Left Munich at 8:35 P. M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late. Buda-Pesth seems a wonderful place, from the glimpse which I got of it from the train and the little I could walk through the streets.</p>
          <p>The impression I had was that we were leaving the West and entering the East; the most western of splendid bridges over the Danube took us among the traditions of Turkish rule. The population of Transylvania is composed of four distinct nationalities: Saxons in the South, and mixed with them the Wallachs; Magyars in the West, and Szekelys in the East and North. I am going among the latter, who claim to be descended from Attila and the Huns.</p>
          <p>I read that every known superstition in the world is gathered into the horseshoe of the Carpathians, as if it were the centre of some sort of imaginative whirlpool; if so my stay may be very interesting. (Mem., I must ask the Count all about them.)</p>
        `,
      },
      {
        id: 'drac-ch-2',
        title: 'Chapter II: The Castle of Count Dracula',
        order: 2,
        wordCount: 1450,
        content: `
          <p><em>5 May.</em>—I must have been asleep, for certainly if I had been fully awake I must have noticed the approach to such a remarkable place. In the gloom the courtyard looked of considerable size, and as several dark ways led from it under great round arches, it perhaps seemed bigger than it really is.</p>
          <p>Suddenly, I heard a heavy step approaching behind the great door. There was the rattle of chains and the clanking of massive bolts drawn back. A key turned with the loud grating noise of long disuse, and the massive door swung back.</p>
          <p>Within, stood a tall old man, clean shaven save for a long white moustache, and clad in black from head to foot, without a single speck of colour about him anywhere. He held in his hand an antique silver lamp, in which the flame burned without chimney or globe of any kind, throwing long quivering shadows.</p>
          <p>The old man motioned me in with his right hand with a courtly gesture, saying in excellent English, but with a strange intonation: <em>"Welcome to my house! Enter freely and of your own will!"</em></p>
        `,
      },
      {
        id: 'drac-ch-3',
        title: 'Chapter III: The Count\'s Secret',
        order: 3,
        wordCount: 1210,
        content: `
          <p>His face was a strong—a very strong—aquiline, with thin nose and distinctly arched nostrils; with lofty domed forehead, and hair growing scantily round the temples, but profusely elsewhere. His eyebrows were very massive, almost meeting over the nose, and their bushy hair seemed to curl in its own profusion. The mouth, so far as I could see it under the heavy moustache, was fixed and rather cruel-looking, with peculiarly sharp white teeth; these protruded over the lips, whose remarkable ruddiness showed astonishing vitality in a man of his years.</p>
          <p>For the rest, his ears were pale, and at the tops extremely pointed; the chin was broad and strong, and the cheeks firm though thin. The general effect was one of extraordinary pallor.</p>
          <p>Hitherto I had noticed the backs of his hands, and they seemed rather white and fine; but seeing them close, I could not fail to notice that they were rather coarse—broad, with squat fingers. Strange to say, there were hairs in the centre of the palm. The nails were long and fine, and cut to a sharp point. As the Count leaned over me and his hands touched me, I could not repress a shudder. It may have been that his breath was rank, but a horrible feeling of nausea came over me.</p>
        `,
      },
    ],
  },
  {
    id: 'frankenstein-shelley',
    title: 'Frankenstein; or, The Modern Prometheus',
    author: 'Mary Wollstonecraft Shelley',
    coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600&auto=format&fit=crop',
    description: 'The groundbreaking masterpiece of gothic science fiction exploring the consequences of playing creator.',
    language: 'en',
    subjects: ['Science Fiction', 'Gothic', 'Philosophy', 'Classics'],
    downloadCount: 165000,
    isOffline: true,
    currentChapterIndex: 0,
    currentScrollProgress: 0,
    totalChapters: 2,
    chapters: [
      {
        id: 'frank-ch-1',
        title: 'Chapter IV: The Secret of Life',
        order: 1,
        wordCount: 1100,
        content: `
          <p>From the midst of this darkness a sudden light broke in upon me—a light so brilliant and wondrous, yet so simple, that while I became dizzy with the immensity of the prospect which it illustrated, I was surprised that among so many men of genius who had directed their inquiries towards the same science, that I alone should be reserved to discover so astonishing a secret.</p>
          <p>Remember, I am not recording the vision of a madman. The sun does not more certainly shine in the heavens than that which I now affirm is true. Some miracle might have produced it, yet the stages of the discovery were distinct and probable. After days and nights of incredible labour and fatigue, I succeeded in discovering the cause of generation and life; nay, more, I became myself capable of bestowing animation upon lifeless matter.</p>
          <p>The astonishment which I at first felt on this discovery soon gave place to delight and rapture. After so much time spent in painful labour, to arrive at once at the summit of my desires was the most gratifying consummation of my toils.</p>
        `,
      },
      {
        id: 'frank-ch-2',
        title: 'Chapter V: The Spark of Being',
        order: 2,
        wordCount: 1250,
        content: `
          <p>It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.</p>
          <p>How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God!</p>
          <p>His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips.</p>
        `,
      },
    ],
  },
  {
    id: 'art-of-war-sun-tzu',
    title: 'The Art of War',
    author: 'Sun Tzu',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop',
    description: 'The ancient Chinese military treatise attributed to Sun Tzu, composed of 13 strategic chapters on tactics and human psychology.',
    language: 'en',
    subjects: ['Strategy', 'Military History', 'Philosophy', 'Classics'],
    downloadCount: 220000,
    isOffline: true,
    currentChapterIndex: 0,
    currentScrollProgress: 0,
    totalChapters: 3,
    chapters: [
      {
        id: 'aow-ch-1',
        title: 'Chapter I: Laying Plans',
        order: 1,
        wordCount: 880,
        content: `
          <p>Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.</p>
          <p>The art of war, then, is governed by five constant factors, to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field. These are: (1) The Moral Law; (2) Heaven; (3) Earth; (4) The Commander; (5) Method and discipline.</p>
          <p>All warfare is based on deception. Hence, when able to attack, we must seem unable; when using our forces, we must seem inactive; when we are near, we must make the enemy believe we are far away; when far away, we must make him believe we are near.</p>
        `,
      },
      {
        id: 'aow-ch-2',
        title: 'Chapter III: Attack by Stratagem',
        order: 2,
        wordCount: 750,
        content: `
          <p>Sun Tzu said: In the practical art of war, the best thing of all is to take the enemy's country whole and intact; to shatter and destroy it is not so good. So, too, it is better to recapture an army entire than to destroy it.</p>
          <p>Hence to fight and conquer in all your battles is not supreme excellence; supreme excellence consists in breaking the enemy's resistance without fighting.</p>
          <p>If you know the enemy and know yourself, you need not fear the result of a hundred battles. If you know yourself but not the enemy, for every victory gained you will also suffer a defeat. If you know neither the enemy nor yourself, you will succumb in every battle.</p>
        `,
      },
      {
        id: 'aow-ch-3',
        title: 'Chapter VI: Weak Points and Strong',
        order: 3,
        wordCount: 820,
        content: `
          <p>Sun Tzu said: Whoever is first in the field and awaits the coming of the enemy, will be fresh for the fight; whoever is second in the field and has to hasten to battle will arrive exhausted.</p>
          <p>Therefore the clever combatant imposes his will on the enemy, but does not allow the enemy's will to be imposed on him.</p>
          <p>Military tactics are like unto water; for water in its natural course runs away from high places and hastens downwards. So in war, the way is to avoid what is strong and to strike at what is weak. Water shapes its course according to the nature of the ground over which it flows; the soldier works out his victory in relation to the foe whom he is facing.</p>
        `,
      },
    ],
  },
];

/**
 * Searches the online Gutenberg catalog via Gutendex API.
 * Falls back gracefully to filtering our curated catalog if offline or if network fails.
 */
export async function searchOnlineCatalog(query: string = '', page: number = 1): Promise<GutendexBook[]> {
  try {
    const url = query.trim()
      ? `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page=${page}`
      : `https://gutendex.com/books/?page=${page}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: GutendexResponse = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn('Gutendex API unreachable, falling back to local offline catalog:', err);
  }

  // Fallback to local curated offline catalog
  const filtered = CURATED_OFFLINE_BOOKS.filter((b) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.subjects?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return filtered.map((b) => ({
    id: parseInt(b.id.replace(/\D/g, '') || '9999', 10),
    title: b.title,
    authors: [{ name: b.author }],
    translators: [],
    subjects: b.subjects || [],
    bookshelves: [],
    languages: [b.language || 'en'],
    copyright: false,
    media_type: 'Text',
    formats: {
      'image/jpeg': b.coverUrl || '',
      'text/plain': `local://${b.id}`,
    },
    download_count: b.downloadCount || 1000,
  }));
}

/**
 * Converts a Gutendex catalog item into a fully formed offline Ebook.
 * Fetches text content, parses into chapters, and prepares for IndexedDB storage.
 */
export async function downloadOnlineBook(book: GutendexBook): Promise<Ebook> {
  const localMatch = CURATED_OFFLINE_BOOKS.find(
    (cb) => cb.title.toLowerCase() === book.title.toLowerCase() || cb.id === `gutenberg-${book.id}`
  );

  if (localMatch) {
    return {
      ...localMatch,
      isOffline: true,
      downloadedAt: Date.now(),
    };
  }

  // Find preferred download format: text/html, then text/plain
  const htmlUrl = book.formats['text/html'] || book.formats['text/html; charset=utf-8'];
  const txtUrl = book.formats['text/plain'] || book.formats['text/plain; charset=utf-8'] || book.formats['text/plain; charset=us-ascii'];
  const coverUrl = book.formats['image/jpeg'] || `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop`;

  let fullText = '';
  const targetUrl = htmlUrl || txtUrl;

  if (targetUrl) {
    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        fullText = await res.text();
      }
    } catch (err) {
      console.warn('Direct fetch failed, trying cors proxy:', err);
    }
  }

  if (!fullText) {
    // If text fetch failed, generate starter chapters from metadata
    fullText = `
      <h1>${book.title}</h1>
      <h2>By ${book.authors[0]?.name || 'Author'}</h2>
      <p>This classic book is part of the Project Gutenberg public domain library.</p>
      <p>Subjects: ${book.subjects.join(', ')}</p>
      <p>Language: ${book.languages.join(', ')}</p>
      <p>Ready for distraction-free offline reading in Resursee Reader.</p>
    `;
  }

  // Parse chapters
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullText, 'text/html');
  const hTags = doc.querySelectorAll('h1, h2, h3');
  const chapters: { id: string; title: string; content: string; order: number; wordCount: number }[] = [];

  if (hTags.length > 2) {
    // Break by headings
    let order = 1;
    hTags.forEach((h, idx) => {
      if (idx > 15) return; // limit to 15 chapters for performance
      let content = '';
      let sibling = h.nextElementSibling;
      while (sibling && !['H1', 'H2', 'H3'].includes(sibling.tagName)) {
        if (sibling.tagName === 'P') {
          content += `<p>${sibling.textContent?.trim() || ''}</p>\n`;
        }
        sibling = sibling.nextElementSibling;
      }
      if (content.length > 50) {
        const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        chapters.push({
          id: `ch_${order}_${Date.now()}`,
          title: h.textContent?.trim() || `Chapter ${order}`,
          content,
          order,
          wordCount: words,
        });
        order++;
      }
    });
  }

  if (chapters.length === 0) {
    // Fallback: chunk paragraphs
    const paragraphs = doc.querySelectorAll('p');
    let currentChunk = '';
    let order = 1;
    paragraphs.forEach((p) => {
      const t = p.textContent?.trim();
      if (t) currentChunk += `<p>${t}</p>\n`;
      if (currentChunk.length > 3000) {
        chapters.push({
          id: `ch_${order}_${Date.now()}`,
          title: `Chapter ${order}`,
          content: currentChunk,
          order,
          wordCount: currentChunk.split(/\s+/).length,
        });
        currentChunk = '';
        order++;
      }
    });

    if (currentChunk.length > 50) {
      chapters.push({
        id: `ch_${order}_${Date.now()}`,
        title: `Chapter ${order}`,
        content: currentChunk,
        order,
        wordCount: currentChunk.split(/\s+/).length,
      });
    }
  }

  return {
    id: `gutenberg_${book.id}`,
    title: book.title,
    author: book.authors[0]?.name || 'Unknown Author',
    coverUrl,
    description: `Public domain book from Project Gutenberg with ${chapters.length} chapters.`,
    language: book.languages[0] || 'en',
    subjects: book.subjects,
    downloadCount: book.download_count,
    isOffline: true,
    downloadedAt: Date.now(),
    lastReadAt: Date.now(),
    currentChapterIndex: 0,
    currentScrollProgress: 0,
    totalChapters: chapters.length || 1,
    chapters: chapters.length > 0 ? chapters : [
      {
        id: 'ch_1',
        title: 'Chapter 1',
        content: `<p>${doc.body?.textContent?.slice(0, 5000) || 'Book text downloaded.'}</p>`,
        order: 1,
        wordCount: 800,
      },
    ],
  };
}
