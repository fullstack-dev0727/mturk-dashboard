import type { Component } from 'solid-js';

import styles from './App.module.css';
import RecordDashboard from './pages/Dashboard';

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <RecordDashboard/>
      </header>
    </div>
  );
};

export default App;
