import { useEffect, useMemo, useRef, useState } from 'react';
import bigNewsLogo from './assets/bignews-logo.png';
import { publishFacebookPagePost } from './facebook';
import {
  buildCategoryPayload,
  DEFAULT_CATEGORY_NAMES,
  WORDPRESS_SITE,
  buildExcerpt,
  detectCategory,
  getSubcategoriesForCategory,
  publishWordPressPost,
} from './wordpress';

const AGENT_DRAFTS_KEY = 'bignews-agent-drafts';
const AGENT_PRESETS_KEY = 'bignews-agent-presets';
const AGENT_AUTOMATION_KEY = 'bignews-agent-automation';
const WORDPRESS_CONNECTION_KEY = 'bignews-wordpress-connection';
const PEXELS_CONNECTION_KEY = 'bignews-pexels-connection';
const AGENT_SEEN_ITEMS_KEY = 'bignews-agent-seen-items';
const DEFAULT_RSS_FEEDS = [
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.bbci.co.uk/news/business/rss.xml',
  'https://feeds.bbci.co.uk/news/technology/rss.xml',
  'https://feeds.skynews.com/feeds/rss/world.xml',
  'https://feeds.skynews.com/feeds/rss/technology.xml',
];

const createAutomationRow = (index) => ({
  id: index + 1,
  category: '',
  subcategory: '',
  delay: '30',
  status: 'Draft',
  withImage: true,
});

function buildAgentPreview(form, mode) {
  const title = form.title.trim();
  const body = form.body.trim();

  if (!title && !body) {
    return null;
  }

  const automaticCategory = detectCategory(title, body);
  const category = mode === 'manual' ? form.category : automaticCategory.category;

  return {
    title: title || 'Titull prove',
    body,
    excerpt: buildExcerpt(body) || 'Permbledhja e postimit do te shfaqet ketu.',
    category,
    image: form.image.trim(),
    confidence: mode === 'automatic' ? automaticCategory.confidence : 'Manuale',
    directPublish: form.directPublish,
    saveDraft: form.saveDraft,
  };
}

function buildCategoryAngle(category) {
  const angles = {
    'Politika&Aktualiteti':
      'Zhvillimi hyn ne grupin e lajmeve me ndikim te menjehershem dhe kerkon ndjekje te vazhdueshme per reagimet qe mund te pasojne.',
    'Ekonomi&Sociale':
      'Kjo histori ka peshe ne fushen e ekonomise, investimeve dhe zhvillimeve qe ndikojne drejtperdrejt ne vendimmarrjen e publikut.',
    'Kosove&Rajon':
      'Ngjarja ofron hapesire per analize dhe interpretim me te thelle, sidomos per ndikimin qe mund te kete ne debatin publik.',
    'Bota&Teknologjia':
      'Ne dimensionin social dhe lokal, kjo ceshtje lidhet me menyren si komunitetet reagojne ndaj zhvillimeve te reja.',
    'Art&Shendet':
      'Si histori me kend te vecante, ajo sjell elemente qe terheqin vemendjen e lexuesit pertej lajmit te shkurter te momentit.',
    'Foto&Video':
      'Ky zhvillim ka vlere te forte vizuale dhe kerkon prezantim qe e afron lexuesin me materialin pamor dhe ritmin e ngjarjes.',
  };

  return angles[category] || angles['Politika&Aktualiteti'];
}

function buildAutomatedArticleBody(article, category) {
  const categoryAngle = buildCategoryAngle(category);

  return [
    `<p>${article.excerpt}</p>`,
    `<p>Sipas raportimit te ${article.source}, kjo ngjarje ka terhequr vemendje per menyren si po zhvillohet dhe per ndikimin qe mund te kete ne ditet ne vazhdim. Ne kete faze, fokusi mbetet te informacioni kryesor i konfirmuar dhe te zhvillimet qe po pasojne lajmin fillestar.</p>`,
    `<p>${categoryAngle}</p>`,
    `<p>Per lexuesin, vlera kryesore e ketij zhvillimi qendron te konteksti: cfare po ndodh tani, pse po diskutohet gjeresisht dhe cilat jane pikat qe duhen ndjekur me kujdes ne vazhdim. Ne rast se publikohen detaje te reja, kjo histori mund te marre dimension edhe me te gjere.</p>`,
    `<p>Burimi origjinal: <a href="${article.link}" target="_blank" rel="noreferrer">${article.source}</a></p>`,
  ].join('');
}

async function translateTextToAlbanian(text) {
  const cleanText = (text || '').trim();

  if (!cleanText) {
    return '';
  }

  const response = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|sq`
  );

  if (!response.ok) {
    throw new Error('Perkthimi ne shqip deshtoi.');
  }

  const data = await response.json();
  return data?.responseData?.translatedText?.trim() || cleanText;
}

function AdminApp() {
  const automationTimerRef = useRef(null);
  const automationCursorRef = useRef(0);
  const seenItemsRef = useRef([]);

  const [agentMode, setAgentMode] = useState('manual');
  const [manualForm, setManualForm] = useState({
    title: '',
    body: '',
    image: '',
    category: DEFAULT_CATEGORY_NAMES[0],
    subcategory: '',
    saveDraft: true,
    directPublish: false,
  });
  const [automaticForm, setAutomaticForm] = useState({
    title: '',
    body: '',
    image: '',
    saveDraft: true,
    directPublish: false,
  });
  const [drafts, setDrafts] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const savedDrafts = window.localStorage.getItem(AGENT_DRAFTS_KEY);
    return savedDrafts ? JSON.parse(savedDrafts) : [];
  });
  const [automationRows, setAutomationRows] = useState(() => {
    if (typeof window === 'undefined') {
      return Array.from({ length: 5 }, (_, index) => createAutomationRow(index));
    }

    const saved = window.localStorage.getItem(AGENT_AUTOMATION_KEY);
    return saved
      ? JSON.parse(saved)
      : Array.from({ length: 5 }, (_, index) => createAutomationRow(index));
  });
  const [presets, setPresets] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const saved = window.localStorage.getItem(AGENT_PRESETS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetName, setPresetName] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [activeAutomationStep, setActiveAutomationStep] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [seenItems, setSeenItems] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const saved = window.localStorage.getItem(AGENT_SEEN_ITEMS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [wordpressConnection, setWordpressConnection] = useState(() => {
    if (typeof window === 'undefined') {
      return { site: WORDPRESS_SITE, token: '' };
    }

    const saved = window.localStorage.getItem(WORDPRESS_CONNECTION_KEY);
    return saved ? JSON.parse(saved) : { site: WORDPRESS_SITE, token: '' };
  });
  const [pexelsConnection, setPexelsConnection] = useState(() => {
    if (typeof window === 'undefined') {
      return { token: '' };
    }

    const saved = window.localStorage.getItem(PEXELS_CONNECTION_KEY);
    return saved ? JSON.parse(saved) : { token: '' };
  });
  const [agentMessage, setAgentMessage] = useState(
    'Paneli eshte gati per lidhje direkte me WordPress.com sapo te vendosesh site domain dhe access token.'
  );

  const manualPreview = useMemo(() => buildAgentPreview(manualForm, 'manual'), [manualForm]);
  const automaticPreview = useMemo(
    () => buildAgentPreview(automaticForm, 'automatic'),
    [automaticForm]
  );
  const currentPreview = agentMode === 'manual' ? manualPreview : automaticPreview;
  const readyAutomationRows = useMemo(
    () => automationRows.filter((row) => row.status === 'Ready' && row.category.trim()),
    [automationRows]
  );
  const manualSubcategories = useMemo(
    () => getSubcategoriesForCategory(manualForm.category),
    [manualForm.category]
  );

  useEffect(() => {
    seenItemsRef.current = seenItems;
  }, [seenItems]);

  const updateAutomationRow = (rowId, key, value) => {
    setAutomationRows((currentRows) => {
      const nextRows = currentRows.map((row) =>
        row.id === rowId ? { ...row, [key]: value } : row
      );
      window.localStorage.setItem(AGENT_AUTOMATION_KEY, JSON.stringify(nextRows));
      return nextRows;
    });
  };

  const updateWordPressConnection = (key, value) => {
    setWordpressConnection((current) => {
      const next = { ...current, [key]: value };
      window.localStorage.setItem(WORDPRESS_CONNECTION_KEY, JSON.stringify(next));
      return next;
    });
  };

  const updatePexelsConnection = (value) => {
    setPexelsConnection(() => {
      const next = { token: value };
      window.localStorage.setItem(PEXELS_CONNECTION_KEY, JSON.stringify(next));
      return next;
    });
  };

  const rememberSeenItem = (link) => {
    if (!link) {
      return;
    }

    setSeenItems((current) => {
      const next = [link, ...current.filter((item) => item !== link)].slice(0, 200);
      window.localStorage.setItem(AGENT_SEEN_ITEMS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleManualImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setManualForm((current) => ({
        ...current,
        image: typeof reader.result === 'string' ? reader.result : current.image,
      }));
      setAgentMessage(`Fotoja "${file.name}" u ngarkua nga device.`);
    };
    reader.readAsDataURL(file);
  };

  const saveDraft = () => {
    if (!currentPreview) {
      setAgentMessage('Ploteso titullin ose permbajtjen qe te ruhet drafti.');
      return;
    }

    const nextDrafts = [{ id: Date.now(), ...currentPreview, mode: agentMode }, ...drafts].slice(0, 8);
    setDrafts(nextDrafts);
    window.localStorage.setItem(AGENT_DRAFTS_KEY, JSON.stringify(nextDrafts));
    setAgentMessage('Drafti u ruajt lokalisht.');
  };

  const copyForWordPress = async () => {
    if (!currentPreview) {
      setAgentMessage('Nuk ka ende permbajtje per ta kopjuar.');
      return;
    }

    const payload = [
      `Titulli: ${currentPreview.title}`,
      `Kategoria: ${currentPreview.category}`,
      agentMode === 'manual' && manualForm.subcategory
        ? `Nenkategoria: ${manualForm.subcategory}`
        : '',
      '',
      currentPreview.body || currentPreview.excerpt,
      currentPreview.image ? `Foto: ${currentPreview.image}` : '',
      currentPreview.directPublish ? 'Publiko direkt: Po' : 'Publiko direkt: Jo',
    ]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(payload);
    setAgentMessage('Permbajtja u kopjua. Ngjite manualisht ne WordPress ose lidhe me token per publikim real.');
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      setAgentMessage('Vendos nje emer per preset-in.');
      return;
    }

    const nextPresets = [
      { id: Date.now(), name: presetName.trim(), rows: automationRows },
      ...presets.filter((preset) => preset.name !== presetName.trim()),
    ].slice(0, 8);

    setPresets(nextPresets);
    setPresetName('');
    window.localStorage.setItem(AGENT_PRESETS_KEY, JSON.stringify(nextPresets));
    setAgentMessage('Preset-i u ruajt.');
  };

  const loadPreset = () => {
    const preset = presets.find((item) => String(item.id) === selectedPreset);
    if (!preset) {
      setAgentMessage('Zgjidh nje preset per ta ngarkuar.');
      return;
    }

    setAutomationRows(preset.rows);
    window.localStorage.setItem(AGENT_AUTOMATION_KEY, JSON.stringify(preset.rows));
    setAgentMessage(`Preset-i "${preset.name}" u ngarkua.`);
  };

  const fetchArticlesFromFeeds = async () => {
    const responses = await Promise.all(
      DEFAULT_RSS_FEEDS.map(async (feedUrl) => {
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
        );

        if (!response.ok) {
          throw new Error(`RSS feed deshtoi: ${feedUrl}`);
        }

        return response.json();
      })
    );

    return responses
      .filter((result) => result?.status === 'ok')
      .flatMap((result) =>
        (result.items || []).map((item) => ({
          title: item.title?.trim() || 'Titull automatik',
          excerpt:
            buildExcerpt(item.description || item.content || '') ||
            'Lajm i perpunuar automatikisht.',
          image: item.thumbnail || item.enclosure?.link || item.enclosure?.thumbnail || '',
          link: item.link || item.guid || '',
          source: result.feed?.title || 'RSS Feed',
          publishedAt: item.pubDate || '',
          detectedCategory: detectCategory(item.title || '', item.description || item.content || '')
            .category,
        }))
      )
      .filter((item) => item.link && item.title)
      .sort((left, right) => new Date(right.publishedAt) - new Date(left.publishedAt));
  };

  const pickArticleForCategory = async (targetCategory) => {
    const articles = await fetchArticlesFromFeeds();
    const unseenArticles = articles.filter((article) => !seenItemsRef.current.includes(article.link));

    if (!unseenArticles.length) {
      throw new Error('Nuk u gjet asnje artikull i ri nga RSS feeds.');
    }

    return (
      unseenArticles.find((article) => article.detectedCategory === targetCategory) ||
      unseenArticles[0]
    );
  };

  const fetchPexelsImage = async (query) => {
    if (!pexelsConnection.token.trim()) {
      return '';
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: pexelsConnection.token.trim(),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Kerkimi i fotos ne Pexels deshtoi.');
    }

    const data = await response.json();
    return data?.photos?.[0]?.src?.large2x || data?.photos?.[0]?.src?.large || '';
  };

  const publishDirectly = async () => {
    if (!currentPreview) {
      setAgentMessage('Ploteso titullin dhe permbajtjen perpara publikimit.');
      return;
    }

    if (!wordpressConnection.site.trim() || !wordpressConnection.token.trim()) {
      setAgentMessage('Vendos site domain dhe access token per WordPress.com.');
      return;
    }

    setIsPublishing(true);

    try {
      const createdPost = await publishWordPressPost({
        token: wordpressConnection.token,
        site: wordpressConnection.site,
        title: currentPreview.title,
        body: currentPreview.body || currentPreview.excerpt,
        excerpt: currentPreview.excerpt,
        category: buildCategoryPayload(
          currentPreview.category,
          agentMode === 'manual' ? manualForm.subcategory : ''
        ),
        image: currentPreview.image,
        status: currentPreview.directPublish ? 'publish' : 'draft',
      });

      let facebookNote = '';

      if (currentPreview.directPublish && createdPost?.URL) {
        try {
          await publishFacebookPagePost({
            title: currentPreview.title,
            excerpt: currentPreview.excerpt,
            link: createdPost.URL,
          });
          facebookNote = ' Postimi u dergua edhe ne Facebook Page.';
        } catch (facebookError) {
          facebookNote = ` Facebook deshtoi: ${facebookError.message}`;
        }
      }

      setAgentMessage(
        `Postimi u krijua me sukses ne WordPress si ${currentPreview.directPublish ? 'published' : 'draft'}: ${
          createdPost?.title || currentPreview.title
        }.${facebookNote}`
      );
    } catch (error) {
      setAgentMessage(error.message || 'Publikimi direkt ne WordPress deshtoi.');
    } finally {
      setIsPublishing(false);
    }
  };

  const runAutomationStep = async (row) => {
    setActiveAutomationStep(row.id);

    const article = await pickArticleForCategory(row.category);
    const translatedTitle = await translateTextToAlbanian(article.title);
    const translatedExcerpt = await translateTextToAlbanian(article.excerpt);
    const translatedArticle = {
      ...article,
      title: translatedTitle || article.title,
      excerpt: translatedExcerpt || article.excerpt,
    };
    const title = translatedArticle.title;
    const excerpt = translatedArticle.excerpt;
    const body = buildAutomatedArticleBody(translatedArticle, row.category);
    const pexelsImage = row.withImage ? await fetchPexelsImage(title) : '';
    const finalImage = pexelsImage || (row.withImage ? article.image : '');

    const createdPost = await publishWordPressPost({
      token: wordpressConnection.token,
      site: wordpressConnection.site,
      title,
      body,
      excerpt,
      category: buildCategoryPayload(row.category, row.subcategory),
      image: finalImage,
      status: automaticForm.directPublish ? 'publish' : 'draft',
    });

    let facebookNote = '';

    if (automaticForm.directPublish && createdPost?.URL) {
      try {
        await publishFacebookPagePost({
          title,
          excerpt,
          link: createdPost.URL,
        });
        facebookNote = ' Postimi u dergua edhe ne Facebook Page.';
      } catch (facebookError) {
        facebookNote = ` Facebook deshtoi: ${facebookError.message}`;
      }
    }

    rememberSeenItem(article.link);
    setAgentMessage(
      `Hapi ${row.id} u ekzekutua me sukses. Artikulli "${createdPost?.title || title}" u mor nga ${article.source}, u perkthye ne shqip dhe u publikua te ${row.category} si ${
        row.subcategory ? `${row.subcategory} / ` : ''
      }${
        automaticForm.directPublish ? 'published' : 'draft'
      }.${facebookNote}`
    );
  };

  const startAgent = () => {
    if (!wordpressConnection.site.trim() || !wordpressConnection.token.trim()) {
      setAgentMessage('Vendos site domain dhe access token para se te nisesh agjentin.');
      return;
    }

    if (!readyAutomationRows.length) {
      setAgentMessage('Vendos te pakten nje hap si Ready dhe zgjidh kategorine e tij.');
      return;
    }

    automationCursorRef.current = 0;
    setAgentRunning(true);
    setAgentMessage('Agjenti u nis. Do te kerkoje vete artikullin e pare nga RSS dhe do ta publikoje menjehere.');
  };

  const stopAgent = () => {
    setAgentRunning(false);
    setActiveAutomationStep(null);
    if (automationTimerRef.current) {
      window.clearTimeout(automationTimerRef.current);
      automationTimerRef.current = null;
    }
    setAgentMessage('Agjenti u ndal.');
  };

  useEffect(() => {
    if (!agentRunning) {
      return undefined;
    }

    if (!readyAutomationRows.length) {
      setAgentRunning(false);
      setActiveAutomationStep(null);
      setAgentMessage("Nuk ka hapa Ready per t'u ekzekutuar.");
      return undefined;
    }

    let cancelled = false;

    const scheduleNextStep = async () => {
      const row = readyAutomationRows[automationCursorRef.current % readyAutomationRows.length];

      if (!row || cancelled) {
        return;
      }

      try {
        await runAutomationStep(row);
      } catch (error) {
        if (!cancelled) {
          setAgentMessage(error.message || `Hapi ${row.id} deshtoi.`);
        }
      }

      if (cancelled) {
        return;
      }

      automationCursorRef.current =
        (automationCursorRef.current + 1) % Math.max(readyAutomationRows.length, 1);

      const delayInMinutes = Math.max(Number(row.delay) || 0, 1);
      automationTimerRef.current = window.setTimeout(
        scheduleNextStep,
        delayInMinutes * 60 * 1000
      );
    };

    scheduleNextStep();

    return () => {
      cancelled = true;
      if (automationTimerRef.current) {
        window.clearTimeout(automationTimerRef.current);
        automationTimerRef.current = null;
      }
    };
  }, [
    agentRunning,
    automaticForm.directPublish,
    readyAutomationRows,
    wordpressConnection.site,
    wordpressConnection.token,
  ]);

  const currentForm = agentMode === 'manual' ? manualForm : automaticForm;
  const setCurrentForm = agentMode === 'manual' ? setManualForm : setAutomaticForm;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src={bigNewsLogo} alt="BigNews logo" />
          <div>
            <p className="admin-eyebrow">PulseMag Basic Panel</p>
            <h1>Krijo nje postim te ri</h1>
          </div>
        </div>
        <a className="admin-link" href="/" target="_blank" rel="noreferrer">
          Shko te faqja
        </a>
      </header>

      <main className="admin-layout">
        <section className="admin-card admin-card--status">
          <p className="admin-status">
            {wordpressConnection.token.trim()
              ? 'WordPress.com token u ruajt lokalisht. Paneli eshte gati per publikim.'
              : 'Vendos access token-in e WordPress.com per publikim direkt.'}
          </p>
          <h2>AI Posting Agent</h2>
          <h3>Automatizo postimet cdo 30 minuta</h3>
          <span className={`admin-pill ${agentRunning ? 'admin-pill--running' : ''}`}>
            {agentRunning ? 'Ne pune' : 'Ndalur'}
          </span>
          <div className="admin-warning">
            Publikimi direkt punon vetem pasi te shtosh `site domain` dhe `access token`
            te WordPress.com. Agjenti automatik perdor RSS feeds kryesore dhe i publikon sipas
            hapave `Ready`.
          </div>
          <p className="admin-helper">
            Per Facebook Page, lidhja tani behet ne server me `FACEBOOK_PAGE_ID` dhe
            `FACEBOOK_PAGE_ACCESS_TOKEN`. Kur `Publiko direkt` eshte aktiv, agjenti do ta
            dergoje postimin e sapo publikuar edhe ne Facebook me link-un e artikullit.
          </p>
          <div className="admin-wordpress-connection">
            <label className="agent-field">
              <span>WordPress site</span>
              <input
                type="text"
                value={wordpressConnection.site}
                onChange={(event) => updateWordPressConnection('site', event.target.value)}
                placeholder="bignews9.wordpress.com"
              />
            </label>
            <label className="agent-field">
              <span>Access token</span>
              <input
                type="password"
                value={wordpressConnection.token}
                onChange={(event) => updateWordPressConnection('token', event.target.value)}
                placeholder="Vendos access token-in"
              />
            </label>
          </div>
          <div className="admin-wordpress-connection">
            <label className="agent-field">
              <span>Pexels API token</span>
              <input
                type="password"
                value={pexelsConnection.token}
                onChange={(event) => updatePexelsConnection(event.target.value)}
                placeholder="Vendos Pexels API token"
              />
            </label>
            <label className="agent-field">
              <span>Statusi i fotos automatike</span>
              <input
                type="text"
                value={pexelsConnection.token.trim() ? 'Pexels gati per foto automatike' : 'Pa token Pexels'}
                readOnly
              />
            </label>
          </div>
          <p className="admin-helper">
            Burimet default te agjentit jane RSS zyrtare nga BBC dhe Sky News. Me vone mund t'i
            zevendesojme me linket e tua specifike.
          </p>
        </section>

        <section className="admin-card">
          <div className="admin-presets">
            <input
              type="text"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="Preset name"
            />
            <button type="button" onClick={savePreset}>
              Save preset
            </button>
            <select value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)}>
              <option value="">Zgjidh preset-in</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={loadPreset}>
              Load preset
            </button>
          </div>

          <div className="admin-actions">
            <button type="button" onClick={startAgent}>
              Nis agjentin
            </button>
            <button type="button" className="admin-actions__secondary" onClick={stopAgent}>
              Ndal agjentin
            </button>
          </div>

          <p className="admin-helper">Hapat `Ready` do te ekzekutohen ciklikisht sipas voneses se caktuar.</p>

          <div className="automation-table">
            <div className="automation-table__head">
              <span>Titulli</span>
              <span>Kategoria</span>
              <span>Nenkategoria</span>
              <span>Vonese</span>
              <span>Statusi</span>
              <span>Foto</span>
            </div>
            {automationRows.map((row) => (
              <div className="automation-table__row" key={row.id}>
                <span>{activeAutomationStep === row.id ? `Hapi ${row.id} - Ne pune` : `Hapi ${row.id}`}</span>
                <select
                  value={row.category}
                  onChange={(event) => {
                    updateAutomationRow(row.id, 'category', event.target.value);
                    updateAutomationRow(row.id, 'subcategory', '');
                  }}
                >
                  <option value="">Zgjidh kategorine</option>
                  {DEFAULT_CATEGORY_NAMES.map((categoryName) => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
                <select
                  value={row.subcategory}
                  onChange={(event) => updateAutomationRow(row.id, 'subcategory', event.target.value)}
                >
                  <option value="">Zgjidh nenkategorine</option>
                  {getSubcategoriesForCategory(row.category).map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={row.delay}
                  onChange={(event) => updateAutomationRow(row.id, 'delay', event.target.value)}
                />
                <select
                  value={row.status}
                  onChange={(event) => updateAutomationRow(row.id, 'status', event.target.value)}
                >
                  <option>Draft</option>
                  <option>Ready</option>
                  <option>Paused</option>
                </select>
                <label className="automation-table__checkbox">
                  <input
                    type="checkbox"
                    checked={row.withImage}
                    onChange={(event) => updateAutomationRow(row.id, 'withImage', event.target.checked)}
                  />
                  <span>Po</span>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-compose__header">
            <div className="agent-switch">
              <button
                type="button"
                className={
                  agentMode === 'manual'
                    ? 'agent-switch__button agent-switch__button--active'
                    : 'agent-switch__button'
                }
                onClick={() => setAgentMode('manual')}
              >
                Manual
              </button>
              <button
                type="button"
                className={
                  agentMode === 'automatic'
                    ? 'agent-switch__button agent-switch__button--active'
                    : 'agent-switch__button'
                }
                onClick={() => setAgentMode('automatic')}
              >
                Automatik
              </button>
            </div>
            <div className="admin-inline-flags">
              <label>
                <input
                  type="checkbox"
                  checked={currentForm.saveDraft}
                  onChange={(event) =>
                    setCurrentForm((current) => ({
                      ...current,
                      saveDraft: event.target.checked,
                      directPublish: event.target.checked ? false : current.directPublish,
                    }))
                  }
                />
                Ruaj si draft
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={currentForm.directPublish}
                  onChange={(event) =>
                    setCurrentForm((current) => ({
                      ...current,
                      directPublish: event.target.checked,
                      saveDraft: event.target.checked ? false : current.saveDraft,
                    }))
                  }
                />
                Publiko direkt
              </label>
            </div>
          </div>

          <div className="admin-compose">
            <label className="agent-field">
              <span>Titulli</span>
              <input
                type="text"
                value={currentForm.title}
                onChange={(event) =>
                  setCurrentForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>

            <div className="admin-category-row">
              <span>Kategoria</span>
              <div className="admin-category-buttons">
                {DEFAULT_CATEGORY_NAMES.map((categoryName) => (
                  <button
                    type="button"
                    key={categoryName}
                    className={
                      agentMode === 'manual' && manualForm.category === categoryName
                        ? 'admin-category-button admin-category-button--active'
                        : 'admin-category-button'
                    }
                    onClick={() =>
                      setManualForm((current) => ({
                        ...current,
                        category: categoryName,
                        subcategory: '',
                      }))
                    }
                  >
                    {categoryName}
                  </button>
                ))}
              </div>
            </div>

            <label className="agent-field">
              <span>Nenkategoria</span>
              <select
                value={manualForm.subcategory}
                onChange={(event) =>
                  setManualForm((current) => ({ ...current, subcategory: event.target.value }))
                }
              >
                <option value="">Zgjidh nenkategorine</option>
                {manualSubcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </label>

            <label className="agent-field">
              <span>Permbledhja</span>
              <input
                type="text"
                value={currentPreview?.excerpt || ''}
                readOnly
                placeholder="Permbledhja krijohet nga permbajtja"
              />
            </label>

            <label className="agent-field">
              <span>Permbajtja</span>
              <textarea
                rows="8"
                value={currentForm.body}
                onChange={(event) =>
                  setCurrentForm((current) => ({ ...current, body: event.target.value }))
                }
              />
            </label>

            <label className="agent-field">
              <span>Foto e artikullit</span>
              <input
                type="text"
                value={currentForm.image}
                onChange={(event) =>
                  setCurrentForm((current) => ({ ...current, image: event.target.value }))
                }
                placeholder="https://..."
              />
            </label>

            {agentMode === 'manual' ? (
              <label className="agent-field">
                <span>Ose ngarko foto nga device</span>
                <input type="file" accept="image/*" onChange={handleManualImageUpload} />
              </label>
            ) : null}

            {agentMode === 'manual' && manualForm.image ? (
              <div className="admin-upload-preview">
                <span className="admin-upload-preview__label">Preview i fotos</span>
                <img
                  className="admin-upload-preview__image"
                  src={manualForm.image}
                  alt="Preview i fotos se artikullit"
                />
              </div>
            ) : null}
          </div>

          <div className="admin-footer-actions">
            <button type="button" onClick={saveDraft}>
              Ruaj si draft
            </button>
            <button type="button" className="admin-actions__secondary" onClick={copyForWordPress}>
              Kopjo per WordPress
            </button>
            <button
              type="button"
              className="admin-actions__secondary"
              onClick={publishDirectly}
              disabled={isPublishing}
            >
              {isPublishing
                ? 'Po publikohet...'
                : currentForm.directPublish
                  ? 'Publiko direkt'
                  : 'Dergo si draft ne WordPress'}
            </button>
          </div>

          {agentMode === 'automatic' ? (
            <div className="agent-suggestion admin-suggestion">
              <span>Kategoria e sugjeruar</span>
              <strong>{automaticPreview?.category || DEFAULT_CATEGORY_NAMES[0]}</strong>
              <small>Siguri: {automaticPreview?.confidence || 'Default'}</small>
            </div>
          ) : null}

          {agentMessage ? <p className="agent-message">{agentMessage}</p> : null}
          <p className="admin-helper">
            `Kopjo per WordPress` kopjon tekstin e formes. `Nis agjentin` punon ndryshe: gjen vete artikullin
            nga RSS feeds dhe e publikon sipas hapit `Ready`.
          </p>
        </section>

        <section className="admin-card">
          <h3>Draftet Lokale</h3>
          {drafts.length ? (
            <div className="agent-drafts">
              {drafts.map((draft) => (
                <div className="agent-drafts__item" key={draft.id}>
                  <strong>{draft.title}</strong>
                  <span>{draft.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="agent-preview__empty">Nuk ka ende drafte lokale.</div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminApp;
