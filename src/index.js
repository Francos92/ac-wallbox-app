import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HomeMenu from './HomeMenu';
import WallboxWizard from './WallboxWizard';
import ArchiveView from './ArchiveView';
import ProfileSettings from './ProfileSettings';
import PasswordGate from './PasswordGate';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

function App() {
  const [view, setView] = useState('home'); // 'home' | 'wallbox' | 'archive' | 'profile'

  return (
    <>
      {view === 'home' && (
        <HomeMenu
          onSelectModule={(id) => setView(id)}
          onOpenArchive={() => setView('archive')}
          onOpenProfile={() => setView('profile')}
        />
      )}
      {view === 'wallbox' && <WallboxWizard onExit={() => setView('home')} />}
      {view === 'archive' && <ArchiveView onExit={() => setView('home')} />}
      {view === 'profile' && <ProfileSettings onExit={() => setView('home')} />}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <PasswordGate>
    <App />
  </PasswordGate>
);

serviceWorkerRegistration.register();
