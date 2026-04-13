import { useState } from 'react';
import bigNewsLogo from './assets/bignews-logo.png';

const categories = [
  {
    name: 'KATEGORIA A',
    articles: [
      {
        label: 'Breaking',
        title: 'Qendra e qytetit merr nje plan te ri per levizjen urbane.',
        excerpt:
          'Nje pakete e re masash synon hapesira me te sigurta per kembesoret, korsite e bicikletave dhe transport me te shpejte publik.',
        time: 'Sot, 08:30',
        author: 'Redaksia BIgNews',
        body: [
          'Bashkia prezantoi nje pakete te re masash qe synon transformimin e levizjes urbane ne zonat me te frekuentuara te qytetit. Fokus kryesor mbetet balanca mes automjeteve, transportit publik dhe hapesirave per kembesoret.',
          'Sipas planit fillestar, korsite e dedikuara per autobuset dhe bicikletat do te zgjerohen ne disa akse kryesore, ndersa trotuaret do te ridimensionohen per te rritur sigurine dhe qarkullimin gjate oreve te pikut.',
          'Ekspertet e mobilitetit thone se faza e zbatimit do te jete vendimtare, pasi projekti pritet te kete ndikim jo vetem ne trafikun ditor, por edhe ne menyren se si qytetaret perdorin hapesirat publike ne afat me te gjate.',
        ],
      },
      {
        label: 'Zhvillim',
        title: 'Tre projekte te medha infrastrukturore hyjne ne fazen finale.',
        excerpt:
          'Institucionet lokale njoftojne se investimet do te hapin vende pune dhe do te permiresojne qarkullimin ne zonat me te ngarkuara.',
        time: 'Sot, 11:15',
        author: 'Arber Kola',
        body: [
          'Tre projekte te rendesishme infrastrukturore po hyjne ne fazat e fundit te realizimit, sipas njoftimeve zyrtare nga institucionet pergjegjese. Behet fjale per nderhyrje qe synojne te lehtesojne trafikun dhe te modernizojne sherbimet publike.',
          'Autoritetet theksojne se ndikimi kryesor do te ndihet ne zonat me densitet te larte levizjeje, ku qarkullimi eshte shnderruar ne shqetesim te vazhdueshem per banoret dhe bizneset lokale.',
          'Paralelisht me perfundimin e punimeve, pritet te hapen edhe vende te reja pune ne sektorin e sherbimeve dhe mirembajtjes, duke i dhene projektit nje efekt me te gjere ekonomik.',
        ],
      },
    ],
  },
  {
    name: 'KATEGORIA B',
    articles: [
      {
        label: 'Teknologji',
        title: 'Start-up-et vendase po rrisin interesin per zgjidhje me AI.',
        excerpt:
          'Ndermarrjet e reja po fokusohen te automatizimi, sherbimi ndaj klientit dhe mjetet inteligjente per bizneset e vogla.',
        time: 'Sot, 09:10',
        author: 'Elira Meta',
        body: [
          'Ekosistemi i start-up-eve vendase po shfaq gjithnje e me shume interes per zgjidhje te bazuara ne inteligjencen artificiale, sidomos ne fusha si automatizimi i proceseve dhe analizimi i te dhenave.',
          'Sipermarresit e rinj po ndertojne produkte qe ulin kostot e operimit per bizneset e vogla, duke ofruar asistente virtuale, raportim me te shpejte dhe personalizim te sherbimeve.',
          'Analistet e tregut mendojne se ky zhvillim mund te krijoje nje avantazh te ri konkurrues per kompanite qe pershtaten shpejt me teknologjite e reja.',
        ],
      },
      {
        label: 'Digital',
        title: 'Platforma te reja mediatike po afrojne lexues me formate me dinamike.',
        excerpt:
          'Publiku po konsumon me shume permbajtje te shkurter, video te shpejta dhe njoftime te personalizuara sipas interesit.',
        time: 'Sot, 13:40',
        author: 'Sara Dervishi',
        body: [
          'Formatet e reja digjitale po ndryshojne menyren se si publiku i ndjek lajmet gjate dites. Artikujt e shkurter, kartat me permbledhje dhe videot vertikale po marrin me shume vemendje ne platformat mobile.',
          'Mediat po testojne gjithashtu modele te reja njoftimesh dhe personalizimi, me qellim qe secili lexues te marre me shpejt temat qe i interesojne me shume.',
          'Ekspertet e komunikimit thone se sfida mbetet ruajtja e cilesise editoriale, edhe kur forma e permbajtjes behet me e shkurter dhe me ritmike.',
        ],
      },
    ],
  },
  {
    name: 'KATEGORIA C',
    articles: [
      {
        label: 'Analize',
        title: 'Si po ndryshon menyra se si lexojme lajmet gjate dites.',
        excerpt:
          'Nga mobile te newsletter-et, zakonet e leximit po kalojne drejt permbledhjeve me te shkurtra dhe me te qarta.',
        time: 'Sot, 10:05',
        author: 'Jonida Basha',
        body: [
          'Lexuesit po kalojne gjithnje e me shume drejt konsumit te shpejte te informacionit, vecanerisht ne oret e para te dites dhe ne levizje. Kjo ka bere qe mediat te ridimensionojne formatin e publikimeve.',
          'Newsletter-et dhe permbledhjet editoriale po luajne nje rol te rendesishem, duke ofruar nje filter te qarte per historite me ndikim me te larte.',
          'Megjithate, ne fund te dites, artikujt analitike dhe formatet me te thelluara vazhdojne te mbeten te domosdoshme per te kuptuar sfondin e ngjarjeve.',
        ],
      },
      {
        label: 'Fokus',
        title: 'Ekspertet shohin me shume vlere te historite me kontekst.',
        excerpt:
          'Materialet qe shpjegojne sfondin dhe pasojat e nje ngjarjeje po marrin me shume vemendje se titujt e shkurter.',
        time: 'Sot, 15:20',
        author: 'Klea Ismaili',
        body: [
          'Historite qe vendosin ngjarjet ne kontekst po fitojne me shume peshe ne peizazhin mediatik, sidomos ne temat ku informacioni i shpejte nuk mjafton per te kuptuar zhvillimet.',
          'Sipas analisteve, lexuesit kerkojne me shume qartesi, krahasim dhe shpjegim, jo vetem njoftime te shkurtra apo tituj alarmues.',
          'Ky trend pritet te rrise rendesine e rubrikave analitike dhe te reportazheve qe sjellin nje pasqyre me te plote te realitetit.',
        ],
      },
    ],
  },
  {
    name: 'KATEGORIA D',
    articles: [
      {
        label: 'Komuniteti',
        title: 'Nisma lokale bashkon te rinjte ne aktivitete kulturore dhe sociale.',
        excerpt:
          'Eventet javore po krijojne hapesira te reja bashkepunimi mes shkollave, organizatave dhe komunitetit lokal.',
        time: 'Sot, 12:00',
        author: 'Mira Gjata',
        body: [
          'Nje nisme lokale po mbledh te rinjte ne aktivitete kulturore, diskutime publike dhe projekte sociale qe synojne te forcojne lidhjen me komunitetin.',
          'Organizatoret thone se synimi eshte krijimi i nje hapesire ku te rinjte jo vetem te marrin pjese, por edhe te propozojne ide konkrete per zonen ku jetojne.',
          'Modele te tilla bashkepunimi po shihen si nje menyre efektive per te nxitur angazhim qytetar dhe pjesemarrje me te gjere ne jeten publike.',
        ],
      },
      {
        label: 'Terren',
        title: 'Banoret kerkojne me shume investime ne zonat periferike.',
        excerpt:
          'Zerat nga komuniteti vene theksin te ndricimi, pastertia dhe sherbimet bazike qe ndikojne jeten e perditshme.',
        time: 'Sot, 16:05',
        author: 'Dritan Qose',
        body: [
          'Banoret e disa zonave periferike po kerkojne me shume investime ne sherbimet bazike, duke theksuar se infrastruktura e dobet ndikon drejtpersedrejti ne cilesine e jetes.',
          'Ne takimet e fundit me perfaqesues lokale, shqetesimet kryesore kane qene ndricimi publik, pastertia dhe mirembajtja e rrugeve te brendshme.',
          'Komuniteti shpreson qe kerkesat te reflektohen ne planet e ardhshme te investimeve, me qellim uljen e pabarazive mes qendres dhe periferise.',
        ],
      },
    ],
  },
  {
    name: 'KATEGORIA E',
    articles: [
      {
        label: 'Speciale',
        title: 'Seria editoriale e muajit sjell histori frymezuese nga njerez te zakonshem.',
        excerpt:
          'Rrefime personale, sfida dhe suksese qe tregojne ane me njerezore te zhvillimeve ne shoqeri.',
        time: 'Sot, 14:10',
        author: 'Anisa Hoxha',
        body: [
          'Seria editoriale e muajit vendos ne qender histori frymezuese nga njerez te zakonshem, duke sjelle ne fokus pervoja qe shpesh mbeten jashte vemendjes se perditshme mediatike.',
          'Rrefimet trajtojne sfida personale, rrugetime profesionale dhe momente kthese qe kane ndryshuar jeten e protagonisteve.',
          'Redaksia synon qe permes ketij formati te ofroje jo vetem informacion, por edhe frymezim per lexuesit qe kerkojne histori me dimension njerezor.',
        ],
      },
      {
        label: 'Ekskluzive',
        title: 'BIgNews pergatit nje format te ri per intervista dhe reportazhe.',
        excerpt:
          'Rubrika e re do te sjelle biseda me personazhe interesante dhe histori te kuruara me nje identitet me te vecante.',
        time: 'Sot, 18:30',
        author: 'Redaksia BIgNews',
        body: [
          'BIgNews po pergatit nje format te ri editorial te fokusuar te intervistat dhe reportazhet me ritëm me te ngadalshem, por me permbajtje me te pasur.',
          'Rubrika do te sjelle biseda me personazhe interesante nga fusha te ndryshme, si dhe histori te kuruara me me shume hapesire per narrativë dhe kontekst.',
          'Sipas redaksise, qellimi eshte krijimi i nje eksperience leximi qe diferencon portalin nga formatet standarde te lajmit te shkurter.',
        ],
      },
    ],
  },
];

function App() {
  const [activeCategory, setActiveCategory] = useState(categories[0].name);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const selectedCategory =
    categories.find((category) => category.name === activeCategory) ?? categories[0];

  const handleCategorySelect = (categoryName) => {
    setActiveCategory(categoryName);
    setSelectedArticle(null);
  };

  const handleArticleOpen = (article) => {
    setSelectedArticle({
      ...article,
      category: selectedCategory.name,
    });
  };

  const handleBackToHome = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero__content">
          <div>
            <img className="hero__logo" src={bigNewsLogo} alt="BIgNews logo" />
            <p className="hero__lead">
              Nje homepage moderne per lajme, me pese kategori te gatshme per
              publikim dhe nje newsletter ne fund per te mbajtur audiencen te
              lidhur.
            </p>
          </div>

          <aside className="hero__spotlight">
            <p className="spotlight__label">Highlight</p>
            <h2>Hapesire perfekte per breaking news ose artikullin kryesor.</h2>
            <p>
              Seksioni hyres eshte ndertuar qe te prezantoje identitet te forte
              vizual dhe lexueshmeri te larte.
            </p>
          </aside>
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
            <p className="article-page__excerpt">{selectedArticle.excerpt}</p>

            <div className="article-page__author">
              <span>Nga {selectedArticle.author}</span>
              <span>BIgNews</span>
            </div>

            <div className="article-page__body">
              {selectedArticle.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ) : (
          <>
            <section className="section-heading">
              <p className="section-heading__kicker">Kategorite Default</p>
              <h2>Lajmet me te fundit ne hapesira te ndryshme</h2>
            </section>

            <section className="categories-frame" aria-label="Kategorite e lajmeve">
              <div className="category-pills" role="tablist" aria-label="Zgjidh kategorine">
                {categories.map((category) => {
                  const isActive = category.name === activeCategory;

                  return (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      key={category.name}
                      className={`category-pill ${isActive ? 'category-pill--active' : ''}`}
                      onClick={() => handleCategorySelect(category.name)}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>

              <div className="articles-showcase">
                {selectedCategory.articles.map((article) => (
                  <article className="article-card" key={article.title}>
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
                ))}
              </div>
            </section>

            <section className="newsletter" aria-label="Newsletter subscription">
              <div className="newsletter__copy">
                <p className="section-heading__kicker">Newsletter</p>
                <h2>Abonohu per te marre lajmet me te fundit nga BIgNews</h2>
                <p>
                  Vendos email-in tend dhe merr permbledhje periodike me historite
                  me te rendesishme direkt ne inbox.
                </p>
              </div>

              <form className="newsletter__form">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input id="email" type="email" placeholder="Shkruaj email-in tend" />
                <button type="submit">Subscribe</button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
