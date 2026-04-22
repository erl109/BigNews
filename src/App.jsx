import { useEffect, useMemo, useState } from 'react';
import bigNewsLogo from './assets/bignews-logo.png';
import cornerLogo from './assets/corner-logo.jpg';
import {
  DEFAULT_CATEGORY_NAMES,
  WORDPRESS_API,
  buildCategories,
  fallbackCategories,
  getSubcategoriesForCategory,
  mapWordPressPost,
  normalizeText,
} from './wordpress';

function App() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORY_NAMES[0]);
  const [activeSubcategory, setActiveSubcategory] = useState(
    getSubcategoriesForCategory(DEFAULT_CATEGORY_NAMES[0])[0] || ''
  );
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [categoryHighlightIndexes, setCategoryHighlightIndexes] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [newsletterSending, setNewsletterSending] = useState(false);

  const NEWSLETTER_ENDPOINT = 'https://formspree.io/f/xkokodvl';

  useEffect(() => {
    let cancelled = false;

    async function loadWordPressContent() {
      try {
        setLoading(true);
        setLoadError('');

        const [categoriesResponse, postsResponse] = await Promise.all([
          fetch(`${WORDPRESS_API}/categories`),
          fetch(`${WORDPRESS_API}/posts?number=20`),
        ]);

        if (!categoriesResponse.ok || !postsResponse.ok) {
          throw new Error('WordPress API request failed.');
        }

        const [categoriesData, postsData] = await Promise.all([
          categoriesResponse.json(),
          postsResponse.json(),
        ]);

        if (cancelled) {
          return;
        }

        const mappedPosts = (postsData?.posts || []).map(mapWordPressPost);
        const nextCategories = buildCategories(categoriesData, postsData);
        setCategories(nextCategories);
        setRecentPosts(mappedPosts);

        const activeExists = nextCategories.some((category) => category.name === activeCategory);
        if (!activeExists) {
          setActiveCategory(nextCategories[0]?.name || DEFAULT_CATEGORY_NAMES[0]);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError('Lidhja me WordPress deshtoi. Po shfaqet struktura baze.');
          setCategories(fallbackCategories);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWordPressContent();

    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  useEffect(() => {
    if (recentPosts.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setHighlightIndex((currentIndex) => (currentIndex + 1) % recentPosts.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [recentPosts]);

  const selectedCategory =
    categories.find((category) => category.name === activeCategory) ?? categories[0];
  const availableSubcategories = useMemo(
    () => getSubcategoriesForCategory(activeCategory),
    [activeCategory]
  );
  const filteredArticles = useMemo(() => {
    const articles = selectedCategory?.articles || [];

    if (!activeSubcategory) {
      return articles;
    }

    return articles.filter(
      (article) =>
        normalizeText(article.subcategory || article.label) === normalizeText(activeSubcategory)
    );
  }, [activeSubcategory, selectedCategory]);
  const categoryHighlights = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        latestArticles: (category.articles || []).slice(0, 5),
      })),
    [categories]
  );
  const heroHighlight = useMemo(() => recentPosts[highlightIndex] || null, [recentPosts, highlightIndex]);

  const setCategoryHighlightIndex = (categoryName, index) => {
    setCategoryHighlightIndexes((current) => ({
      ...current,
      [categoryName]: index,
    }));
  };

  const handleCategorySelect = (categoryName) => {
    setActiveCategory(categoryName);
    setActiveSubcategory(getSubcategoriesForCategory(categoryName)[0] || '');
    setSelectedArticle(null);
  };

  const handleArticleOpen = (article) => {
    setSelectedArticle(article);
  };

  const handleBackToHome = () => {
    setSelectedArticle(null);
  };

  useEffect(() => {
    if (!availableSubcategories.length) {
      if (activeSubcategory !== '') {
        setActiveSubcategory('');
      }
      return;
    }

    const subcategoryExists = availableSubcategories.some(
      (subcategory) => normalizeText(subcategory) === normalizeText(activeSubcategory)
    );

    if (!subcategoryExists) {
      setActiveSubcategory(availableSubcategories[0]);
    }
  }, [activeSubcategory, availableSubcategories]);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();

    if (!newsletterEmail.trim()) {
      setNewsletterStatus('Vendos email-in per abonim.');
      return;
    }

    setNewsletterSending(true);
    setNewsletterStatus('');

    try {
      const response = await fetch(NEWSLETTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          source: 'BigNews Newsletter',
        }),
      });

      if (!response.ok) {
        throw new Error('Dergimi i newsletter deshtoi.');
      }

      setNewsletterEmail('');
      setNewsletterStatus('Faleminderit! Abonimi u dergua me sukses.');
    } catch (error) {
      setNewsletterStatus(error.message || 'Dergimi deshtoi. Provo perseri.');
    } finally {
      setNewsletterSending(false);
    }
  };

  return (
    <>
      <div className="page-corners" aria-hidden="true">
        <img className="page-corners__logo page-corners__logo--left" src={cornerLogo} alt="" />
        <img className="page-corners__logo page-corners__logo--right" src={cornerLogo} alt="" />
      </div>

      <div className="page-shell">
        <header className="hero">
          <div className="hero__content">
            <div className="hero__main">
              <div className="hero__banner">
                <img className="hero__logo" src={bigNewsLogo} alt="BigNews logo" />
              </div>
            </div>

            {!selectedArticle ? (
              <aside className="hero__spotlight">
                <div className="hero__spotlight-copy">
                  <p className="spotlight__label">Highlight</p>
                  <h2>
                    {heroHighlight?.title ||
                      'Publiko artikullin e pare ne WordPress qe te shfaqet ketu.'}
                  </h2>
                  <p>
                    {heroHighlight?.excerpt ||
                      'Kjo zone do te mbushet automatikisht nga postimi me i fundit ne WordPress.'}
                  </p>
                  {heroHighlight ? (
                    <button
                      type="button"
                      className="hero__spotlight-button"
                      onClick={() => handleArticleOpen(heroHighlight)}
                    >
                      Lexo artikullin
                    </button>
                  ) : null}
                </div>

                <div className="hero__spotlight-image" aria-label="Foto e artikullit highlight">
                  <span className="hero__spotlight-badge">Foto Artikulli</span>
                  {heroHighlight?.image ? (
                    <div
                      className="hero__spotlight-frame hero__spotlight-frame--image"
                      style={{ backgroundImage: `url(${heroHighlight.image})` }}
                    />
                  ) : (
                    <div className="hero__spotlight-frame">
                      <span>{heroHighlight?.title || 'Pamja kryesore e dites'}</span>
                    </div>
                  )}
                  {recentPosts.length > 1 ? (
                    <div className="hero__spotlight-controls">
                      {recentPosts.slice(0, 10).map((post, index) => (
                        <button
                          type="button"
                          key={post.id}
                          className={`hero__spotlight-dot ${
                            index === highlightIndex ? 'hero__spotlight-dot--active' : ''
                          }`}
                          aria-label={`Shfaq artikullin ${index + 1}`}
                          onClick={() => setHighlightIndex(index)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>
        </header>

        <main className="content">
          {selectedArticle ? (
            <article className="article-page">
              <button type="button" className="article-page__back" onClick={handleBackToHome}>
                Kthehu te artikujt
              </button>

              <div className="article-page__header">
                <span className="article-page__tag">{selectedArticle.category}</span>
                <span className="article-page__time">{selectedArticle.time}</span>
              </div>

              <h1>{selectedArticle.title}</h1>

              {selectedArticle.image ? (
                <img
                  className="article-page__image"
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                />
              ) : null}

              <div
                className="article-page__body"
                dangerouslySetInnerHTML={{ __html: selectedArticle.bodyHtml }}
              />
            </article>
          ) : (
            <>
              <section className="section-heading">
                <h2>Lajmet me te fundit ne hapesira te ndryshme</h2>
                {loadError ? <p className="section-heading__note">{loadError}</p> : null}
                {loading ? (
                  <p className="section-heading__note">Po merren artikujt nga WordPress...</p>
                ) : null}
              </section>

              <section className="categories-frame" aria-label="Kategorite e lajmeve">
                <div className="category-groups" role="tablist" aria-label="Zgjidh kategorine">
                  {categories.map((category) => {
                    const isActive = category.name === activeCategory;
                    const categorySubcategories = getSubcategoriesForCategory(category.name);

                    return (
                      <div
                        key={category.name}
                        className={`category-group ${isActive ? 'category-group--active' : ''}`}
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          className={`category-pill ${isActive ? 'category-pill--active' : ''}`}
                          onClick={() => handleCategorySelect(category.name)}
                        >
                          {category.name}
                        </button>

                        {isActive && categorySubcategories.length ? (
                          <div className="subcategory-pills" aria-label="Zgjidh nenkategorine">
                            {categorySubcategories.map((subcategory) => (
                              <button
                                type="button"
                                key={subcategory}
                                className={`subcategory-pill ${
                                  activeSubcategory === subcategory ? 'subcategory-pill--active' : ''
                                }`}
                                onClick={() => setActiveSubcategory(subcategory)}
                              >
                                {subcategory}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="articles-showcase">
                  {filteredArticles.length ? (
                    filteredArticles.map((article) => (
                      <article className="article-card" key={article.id}>
                        {article.image ? (
                          <img className="article-card__image" src={article.image} alt={article.title} />
                        ) : null}
                        <div className="article-card__meta">
                          <span className="article-card__label">{article.label}</span>
                          <span>{article.time}</span>
                        </div>
                        <h3>{article.title}</h3>
                        <p>{article.excerpt}</p>
                        <button
                          type="button"
                          className="article-card__button"
                          onClick={() => handleArticleOpen(article)}
                        >
                          Lexo artikullin
                        </button>
                      </article>
                    ))
                  ) : (
                    <article className="article-card article-card--empty">
                      <div className="article-card__meta">
                        <span className="article-card__label">
                          {activeSubcategory || selectedCategory?.name}
                        </span>
                      </div>
                      <h3>Nuk ka ende artikuj ne kete kategori.</h3>
                      <p>
                        Krijo nje postim ne WordPress dhe caktoje ne kete kategori
                        {activeSubcategory ? ` / ${activeSubcategory}` : ''} qe te shfaqet
                        automatikisht ketu.
                      </p>
                    </article>
                  )}
                </div>
              </section>

              <section className="category-highlights" aria-label="Highlights sipas kategorive">
                {categoryHighlights.map((category) => (
                  <section className="category-highlight-block" key={category.name}>
                    <div className="category-highlight-block__header">
                      <p className="section-heading__kicker">Highlights</p>
                      <h3>{category.name}</h3>
                    </div>

                    {category.latestArticles.length ? (
                      (() => {
                        const activeIndex = Math.min(
                          categoryHighlightIndexes[category.name] || 0,
                          Math.max(category.latestArticles.length - 1, 0)
                        );
                        const activeArticle = category.latestArticles[activeIndex];

                        return (
                          <div className="category-highlight-hero">
                            <div className="category-highlight-hero__copy">
                              <p className="spotlight__label">Highlight</p>
                              <h4>{activeArticle.title}</h4>
                              <p>{activeArticle.excerpt}</p>
                              <button
                                type="button"
                                className="hero__spotlight-button"
                                onClick={() => handleArticleOpen(activeArticle)}
                              >
                                Lexo artikullin
                              </button>
                            </div>

                            <div
                              className="category-highlight-hero__media"
                              aria-label={`Foto e artikullit nga ${category.name}`}
                            >
                              <span className="hero__spotlight-badge">Foto Artikulli</span>
                              {activeArticle.image ? (
                                <div
                                  className="hero__spotlight-frame hero__spotlight-frame--image"
                                  style={{ backgroundImage: `url(${activeArticle.image})` }}
                                />
                              ) : (
                                <div className="hero__spotlight-frame">
                                  <span>{activeArticle.title}</span>
                                </div>
                              )}

                              {category.latestArticles.length > 1 ? (
                                <div className="hero__spotlight-controls">
                                  {category.latestArticles.map((article, index) => (
                                    <button
                                      type="button"
                                      key={`${category.name}-${article.id}`}
                                      className={`hero__spotlight-dot ${
                                        index === activeIndex ? 'hero__spotlight-dot--active' : ''
                                      }`}
                                      aria-label={`Shfaq artikullin ${index + 1} te ${category.name}`}
                                      onClick={() => setCategoryHighlightIndex(category.name, index)}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="category-highlight-block__grid">
                        <article className="article-card article-card--empty article-card--compact">
                          <div className="article-card__meta">
                            <span className="article-card__label">{category.name}</span>
                          </div>
                          <h3>Nuk ka ende artikuj ne kete kategori.</h3>
                          <p>
                            Sapo te publikosh postime ne WordPress per {category.name}, 5 me te
                            fundit do te shfaqen automatikisht ketu.
                          </p>
                        </article>
                      </div>
                    )}
                  </section>
                ))}
              </section>

              <section className="newsletter" aria-label="Newsletter subscription">
                <div className="newsletter__copy">
                  <p className="section-heading__kicker">Newsletter</p>
                  <h2>
                    Abonohu per te marre lajmet me te fundit nga{' '}
                    <span className="newsletter__brand">BigNews</span>
                  </h2>
                  <p>
                    Vendos email-in tend dhe merr permbledhje periodike me historite
                    me te rendesishme direkt ne inbox.
                  </p>
                </div>

                <form className="newsletter__form" onSubmit={handleNewsletterSubmit}>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Shkruaj email-in tend"
                    value={newsletterEmail}
                    onChange={(event) => setNewsletterEmail(event.target.value)}
                  />
                  <button type="submit" disabled={newsletterSending}>
                    {newsletterSending ? 'Po dergohet...' : 'Subscribe'}
                  </button>
                  {newsletterStatus ? <p className="newsletter__status">{newsletterStatus}</p> : null}
                </form>
              </section>
            </>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
