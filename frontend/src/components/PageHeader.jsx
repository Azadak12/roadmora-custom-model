export default function PageHeader({ eyebrow, title, subtitle, meta = [] }) {
  return (
    <header className="page-header">
      <div className="page-header__mesh"></div>
      <div className="container page-header__inner">
        <span className="section-eyebrow">{eyebrow}</span>
        <h1 className="page-header__title">{title}</h1>
        <p className="page-header__sub">{subtitle}</p>
        {meta.length > 0 && (
          <ul className="page-header__meta">
            {meta.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}
      </div>
    </header>
  );
}
