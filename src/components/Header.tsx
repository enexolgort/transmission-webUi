export type View = "torrents" | "session";

interface Props {
  view: View;
  onViewChange: (v: View) => void;
  onAddClick: () => void;
}

export function Header({ view, onViewChange, onAddClick }: Props) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark" aria-hidden>
          {"\u2B07"}
        </span>
        <span>Transmission</span>
      </div>

      <nav className="app-header__nav" role="tablist" aria-label="View">
        <button
          role="tab"
          aria-selected={view === "torrents"}
          className={`app-header__tab${view === "torrents" ? " app-header__tab--active" : ""}`}
          onClick={() => onViewChange("torrents")}
        >
          Torrents
        </button>
        <button
          role="tab"
          aria-selected={view === "session"}
          className={`app-header__tab${view === "session" ? " app-header__tab--active" : ""}`}
          onClick={() => onViewChange("session")}
        >
          Session & settings
        </button>
      </nav>

      {view === "torrents" && (
        <button className="button button--primary" onClick={onAddClick}>
          + Add torrent
        </button>
      )}
    </header>
  );
}