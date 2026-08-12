import { Outlet } from 'react-router-dom';
import Nav from './Nav';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="layout">
      <Nav />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}