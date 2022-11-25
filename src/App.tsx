import { Routes, Route } from "@solidjs/router"

import styles from './App.module.css';
import RecordDashboard from './pages/Dashboard';
import Login from "./pages/Login";
import AdminPanel from "./pages/Admin";

const App = () => {
  return (
      <Routes>
        <Route path="/dashboard" component={RecordDashboard} />
        <Route path="/" component={Login} />
        <Route path="/admin" component={AdminPanel} />
      </Routes>
  );
};

export default App;
