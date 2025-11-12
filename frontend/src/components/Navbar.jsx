import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sun, Moon } from 'lucide-react';

const Navbar = ({ user, logout, darkMode, toggleDarkMode, title = 'TiendaApp' }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <nav className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <ShoppingBag className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 dark:from-sky-400 dark:to-emerald-400 bg-clip-text text-transparent">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleDarkMode}
              variant="ghost"
              size="icon"
              className="rounded-full"
              data-testid="theme-toggle-btn"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {user ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Hola, {user.name}</span>
                {user.role === 'admin' && (
                  <Button onClick={() => navigate('/admin')} variant="outline" data-testid="nav-admin-btn">
                    Admin
                  </Button>
                )}
                <Button onClick={logout} variant="ghost" data-testid="logout-btn">Cerrar Sesión</Button>
              </>
            ) : (
              <Button onClick={handleLogin} className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700" data-testid="login-btn">
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
