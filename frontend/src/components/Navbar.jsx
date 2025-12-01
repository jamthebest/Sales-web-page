import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sun, Moon, Menu, LogOut, LogIn, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = ({ user, logout, darkMode, toggleDarkMode, title = 'Sales Web Store' }) => {
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
            <span className="text-md md:text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 dark:from-sky-400 dark:to-emerald-400 bg-clip-text text-transparent">
              {title}
            </span>
          </div>
          {/* Desktop View */}
          <div className="hidden sm:flex items-center gap-4">
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Hola, {user.name}</span>
                {user.role === 'admin' && (
                  <Button onClick={() => navigate('/admin')} variant="outline" data-testid="nav-admin-btn">
                    <Settings className="w-5 h-5" />
                    Admin
                  </Button>
                )}
                <Button onClick={logout} variant="ghost" data-testid="logout-btn">
                  <LogOut className="w-5 h-5" />
                  Salir
                </Button>
              </>
            ) : (
              <Button onClick={handleLogin} className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700" data-testid="login-btn">
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </Button>
            )}
          </div>

          {/* Mobile View */}
          <div className="sm:hidden flex items-center gap-2">
            {user && (
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                {user.name.split(' ')[0]}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleDarkMode}>
                  {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                </DropdownMenuItem>

                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Salir
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleLogin}>
                    Iniciar Sesión
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
