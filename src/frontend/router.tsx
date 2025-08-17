// libs
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Styled from 'styled-components';

// views
// import HomeView from './views/home';
import SettingsView from './views/settings';
import ChatView from './views/chat';
import RegistryView from './views/registry';

export const RoutesWrapper = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" />} />
      <Route path="/settings" Component={SettingsView} />
      <Route path="/chat" Component={ChatView} />
      <Route path="/chat/:chatId" Component={ChatView} />
      <Route path="/registry" Component={RegistryView} />
    </Routes>
  );
};

export const MainRouter = () => {
  return (
    <Router>
      <RoutesWrapper />
    </Router>
  );
};

const Router = Styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;
