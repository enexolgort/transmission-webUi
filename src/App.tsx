import { useState } from "react";
import { Header, type View } from "./components/Header";
import { TorrentTable } from "./components/TorrentTable";
import { StatsBar } from "./components/StatsBar";
import { SettingsPanel } from "./components/SettingsPanel";
import { AddTorrentDialog } from "./components/AddTorrentDialog";
import { useTorrents } from "./hooks/useTorrents";
import { useStats } from "./hooks/useStats";

export default function App() {
  const [view, setView] = useState<View>("torrents");
  const [showAdd, setShowAdd] = useState(false);
  const { torrents, loading, error, refresh } = useTorrents();
  const { stats } = useStats();

  return (
    <div className="app">
      <Header view={view} onViewChange={setView} onAddClick={() => setShowAdd(true)} />

      {view === "torrents" && (
        <main className="app-main">
          <StatsBar stats={stats} />
          <TorrentTable
            torrents={torrents}
            loading={loading}
            error={error}
            onChanged={refresh}
            onAddClick={() => setShowAdd(true)}
          />
        </main>
      )}

      {view === "session" && (
        <main className="app-main">
          <SettingsPanel />
        </main>
      )}

      {showAdd && <AddTorrentDialog onClose={() => setShowAdd(false)} onAdded={refresh} />}
    </div>
  );
}
