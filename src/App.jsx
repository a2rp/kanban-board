import { useEffect, useState } from "react";
import KanbanBoard from "./components/kanbanBoard/index.jsx";
import BackToTop from "./components/backToTop/index.jsx";
import SiteFooter from "./components/siteFooter/index.jsx";
import SiteHeader from "./components/siteHeader/index.jsx";
import styles from "./App.module.css";
const App = () => {
 const [showBackToTop, setShowBackToTop] = useState(false);
 useEffect(() => { const update = () => setShowBackToTop(window.scrollY > 50); window.addEventListener("scroll", update, { passive: true }); update(); return () => window.removeEventListener("scroll", update); }, []);
 return <div className={styles.appShell} id="top"><SiteHeader title="Kanban Board" mark="K" repoUrl="https://github.com/a2rp/kanban-board" navItems={[["Board","#board"],["Activity","#activity"]]} /><main className={styles.pageContent}><KanbanBoard /></main><SiteFooter repoUrl="https://github.com/a2rp/kanban-board" /><BackToTop visible={showBackToTop} /></div>;
};
export default App;