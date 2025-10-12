

import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BarChart3, BookOpen, Eye, FileText, TrendingUp, Settings, Menu, GraduationCap, Mail, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  {
    title: "Dashboard",
    titleHe: "דף ראשי",
    titleEs: "Panel Principal",
    url: createPageUrl("Dashboard"),
    icon: BarChart3,
  },
  {
    title: "Trades",
    titleHe: "עסקאות",
    titleEs: "Operaciones",
    url: createPageUrl("Trades"),
    icon: TrendingUp,
  },
  {
    title: "Journal",
    titleHe: "יומן",
    titleEs: "Diario",
    url: createPageUrl("Journal"),
    icon: BookOpen,
  },
  {
    title: "Reports",
    titleHe: "דוחות",
    titleEs: "Reportes",
    url: createPageUrl("Reports"),
    icon: FileText,
  },
  {
    title: "Learning",
    titleHe: "למידה",
    titleEs: "Aprendizaje",
    url: createPageUrl("Learning"),
    icon: GraduationCap,
  },
  {
    title: "Import",
    titleHe: "ייבוא נתונים",
    titleEs: "Importar Datos",
    url: createPageUrl("Import"),
    icon: Upload,
  },
  {
    title: "Contact",
    titleHe: "צור קשר",
    titleEs: "Contacto",
    url: createPageUrl("Contact"),
    icon: Mail,
  },
  {
    title: "Settings",
    titleHe: "הגדרות",
    titleEs: "Configuración",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [language, setLanguage] = React.useState(() => localStorage.getItem('language') || 'en');
  const [currentAccount, setCurrentAccount] = React.useState(null);

  const isRTL = language === 'he';

  // Make currentAccount updater available globally
  React.useEffect(() => {
    window.currentAccountUpdater = (newAccount) => {
      setCurrentAccount(newAccount);
    };
  }, []);

  React.useEffect(() => {
    // Simple theme loading without dark mode complexity
    if (!localStorage.getItem('language')) {
      localStorage.setItem('language', 'en');
      setLanguage('en');
    }

    const loadCurrentAccount = async () => {
      const currentAccountId = localStorage.getItem('currentAccountId');
      if (currentAccountId) {
        try {
          const { Account } = await import('@/api/entities');
          const account = await Account.get(currentAccountId);
          
          if (account) {
            setCurrentAccount(account);
          } else {
            console.warn('⚠️ Account not found:', currentAccountId);
            // Clear invalid account ID
            localStorage.removeItem('currentAccountId');
            setCurrentAccount(null);
          }
        } catch (error) {
          console.error('Error loading current account:', error);
          setCurrentAccount(null);
        }
      }
    };
    loadCurrentAccount();
  }, []);

  const setLanguageAndReload = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // No need to reload - state change will re-render
  };

  React.useEffect(() => {
    const handleStorageChange = () => {
      const savedLanguage = localStorage.getItem('language') || 'en';
      setLanguage(savedLanguage);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getNavigationTitle = (item) => {
    switch(language) {
      case 'he': return item.titleHe;
      default: return item.title;
    }
  };

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(
      getText(
        'Are you sure you want to log out?',
        'האם אתה בטוח שברצונך להתנתק?',
        '¿Estás seguro de que quieres cerrar sesión?'
      )
    );
    
    if (confirmed) {
      await signOut();
      navigate('/login');
    }
  };

  const NavigationContent = ({ isMobile = false }) => (
    <nav className={`flex gap-1 ${isMobile ? 'flex-col items-start' : 'flex-row items-center'}`}>
      {navigationItems.map((item) => (
        <Button
          key={item.title}
          asChild
          variant={location.pathname === item.url ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="w-4 h-4" />
            <span>{getNavigationTitle(item)}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        /* Base RTL/LTR styles */
        .rtl { direction: rtl; }
        .ltr { direction: ltr; }
        .rtl th, .rtl td { text-align: right; }
        .ltr th, .ltr td { text-align: left; }
        .rtl .group:hover .group-hover\\:block { display: block; }

        /* General body and mobile-specific styling */
        body {
          background-color: #f9fafb;
          color: #111827;
          padding-bottom: env(keyboard-inset-height, 0px);
        }
        
        /* Modal positioning override for desktop */
        @media (min-width: 1024px) {
          [role="dialog"][data-state="open"] {
            position: fixed !important;
            top: 5% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
          }
        }
        
        /* Tablet positioning - top left */
        @media (min-width: 768px) and (max-width: 1023px) {
          [role="dialog"][data-state="open"] {
            position: fixed !important;
            top: 2rem !important;
            left: 2rem !important;
            right: 2rem !important;
            bottom: auto !important;
            transform: none !important;
            margin: 0 !important;
            width: auto !important;
            max-width: none !important;
          }
        }
        
        /* Mobile positioning and keyboard handling */
        @media (max-width: 767px) {
          [role="dialog"][data-state="open"] {
            position: fixed !important;
            top: 1rem !important;
            left: 1rem !important;
            right: 1rem !important;
            bottom: 1rem !important;
            transform: none !important;
            margin: 0 !important;
            height: calc(100% - 2rem - env(keyboard-inset-height, 0px)) !important;
            width: auto !important;
            max-width: none !important;
          }
          
          /* Ensure modal content can scroll when keyboard is open */
          [data-radix-dialog-content] {
            overflow-y: auto !important;
          }
        }

        /* Input fields styling (light mode specific overrides) */
        input[type="text"], input[type="email"], input[type="number"], input[type="password"],
        input[type="date"], input[type="datetime-local"], input[type="file"],
        textarea, .select-trigger-style {
          background-color: #ffffff !important;
          border: 1px solid #9ca3af !important;
        }
        select {
          background-color: #ffffff !important;
        }
        .bg-gray-100 { 
          background-color: #f3f4f6 !important;
        }
        .bg-gray-50 { 
          background-color: #f9fafb;
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="hidden sm:block text-lg font-bold text-gray-900">
                {language === 'he' ? 'מערכת מסחר' : 'Trading Hub'}
              </h1>
            </Link>
          </div>

          <div className="hidden lg:flex">
            <NavigationContent />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={language === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLanguageAndReload('en')}
                className="text-xs px-2 py-1 h-6"
              >
                ENG
              </Button>
              <Button
                variant={language === 'he' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLanguageAndReload('he')}
                className="text-xs px-2 py-1 h-6"
              >
                ע
              </Button>
            </div>
            
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {getText('Logout', 'התנתק')}
              </Button>
            )}
            
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={isRTL ? "right" : "left"} className="w-64 pt-10">
                  <NavigationContent isMobile={true} />
                  {user && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {getText('Logout', 'התנתק')}
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Active Account Banner */}
      {currentAccount && (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-4">
          <div className="container mx-auto flex items-center justify-center">
            <p className="text-sm font-medium">
              {getText('Active Account:', 'חשבון פעיל:')} {currentAccount.name}
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

