import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { ColorModeProvider } from './components/color-mode';
import CrewSleep from './CrewSleep';
import { PageViews } from './analytics';
import './index.css';
import './theme.css';

const system = createSystem(defaultConfig);

// Hash routes (#/<profile>?tab=…) work on any static host without rewrite rules.
createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <HashRouter>
          {/* Profile names are the user's own: report only that a profile is open. */}
          <PageViews route={(path) => (path === '/' ? path : '/profile')} />
          <Routes>
            <Route path="/" element={<CrewSleep />} />
            <Route path="/:profile" element={<CrewSleep />} />
            {/* Any other address (e.g. a stale history entry, Back in the installed app) goes home instead of showing a blank page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>,
);
