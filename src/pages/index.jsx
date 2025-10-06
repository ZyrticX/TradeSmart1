import Layout from "./Layout.jsx";
import ProtectedRoute from "../components/ProtectedRoute";

import LandingPage from "./LandingPage";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import Trades from "./Trades";
import Journal from "./Journal";
import Watchlist from "./Watchlist";
import Reports from "./Reports";
import Settings from "./Settings";
import Learning from "./Learning";
import Contact from "./Contact";
import Import from "./Import";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Trades: Trades,
    
    Journal: Journal,
    
    Watchlist: Watchlist,
    
    Reports: Reports,
    
    Settings: Settings,
    
    Learning: Learning,
    
    Contact: Contact,
    
    Import: Import,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const { user, loading } = useAuth();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Show loading indicator while loading auth state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontFamily: 'system-ui',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid rgba(255,255,255,0.3)',
                        borderTop: '4px solid white',
                        borderRadius: '50%',
                        margin: '0 auto 20px',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ fontSize: '18px', margin: 0 }}>טוען...</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }
    
    return (
        <Routes>
            {/* Public Routes */}
            <Route 
                path="/" 
                element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
            />
            <Route 
                path="/login" 
                element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            <Route 
                path="/signup" 
                element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
            />
            
            {/* Protected Routes */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Dashboard">
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/trades" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Trades">
                            <Trades />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/journal" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Journal">
                            <Journal />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/watchlist" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Watchlist">
                            <Watchlist />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/reports" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Reports">
                            <Reports />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/settings" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Settings">
                            <Settings />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/learning" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Learning">
                            <Learning />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/contact" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Contact">
                            <Contact />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/import" 
                element={
                    <ProtectedRoute>
                        <Layout currentPageName="Import">
                            <Import />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            
            {/* Catch all - redirect to home or dashboard */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}