import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { SCHOOL_LOGO_URL } from './utils/schoolLogo.ts';
import './index.css';

// Ensure the browser tab icon (favicon) always displays the official school logo across any hosting path
const applySchoolFavicon = () => {
  if (typeof document === 'undefined') return;
  const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
  rels.forEach((rel) => {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = SCHOOL_LOGO_URL;
  });
};

applySchoolFavicon();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
