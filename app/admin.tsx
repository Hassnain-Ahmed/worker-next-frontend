'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, LogOut, Shield, User } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';

// Hardcoded credentials
const VALID_CREDENTIALS = {
    username: '111077hala990',
    password: '20085011077'
};

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [authExpiry, setAuthExpiry] = useState<number | null>(null);

    useLayoutEffect(() => {
        // Simulate checking authentication state
        // In a real app, this would check localStorage or session storage
        setIsLoading(false);
    }, []);

    // Check if session is expired
    useLayoutEffect(() => {
        if (authExpiry && isAuthenticated) {
            const checkExpiry = () => {
                const now = new Date().getTime();
                if (now >= authExpiry) {
                    handleLogout();
                }
            };

            const interval = setInterval(checkExpiry, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [authExpiry, isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Rate limiting - max 5 attempts
        if (loginAttempts >= 5) {
            setError('Too many failed attempts. Please wait before trying again.');
            return;
        }

        if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
            // Set authentication and expiry (24 hours)
            const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);

            setIsAuthenticated(true);
            setAuthExpiry(expiry);
            setUsername('');
            setPassword('');
            setLoginAttempts(0);
        } else {
            setError('Invalid username or password');
            setLoginAttempts(prev => prev + 1);
            setPassword('');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setAuthExpiry(null);
        setUsername('');
        setPassword('');
        setError('');
        setLoginAttempts(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin(e);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Media Dashboard</CardTitle>
                        <CardDescription>
                            Please sign in to access the media records dashboard
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium">
                                    Username
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="pl-10"
                                        disabled={loginAttempts >= 5}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="pr-10"
                                        disabled={loginAttempts >= 5}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        disabled={loginAttempts >= 5}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {loginAttempts > 0 && loginAttempts < 5 && (
                                <div className="text-sm text-muted-foreground text-center">
                                    Failed attempts: {loginAttempts}/5
                                </div>
                            )}

                            <Button
                                onClick={handleLogin}
                                className="w-full"
                                disabled={!username || !password || loginAttempts >= 5}
                            >
                                Sign In
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground space-y-2">
                            <div className="border-t pt-4">
                                <p className="font-medium text-foreground mb-2">Demo Credentials:</p>
                                <div className="space-y-1 text-xs bg-muted p-3 rounded-lg">
                                    <div><strong>Username:</strong> admin</div>
                                    <div><strong>Password:</strong> password123</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <Shield className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold">Media Dashboard</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Secure media management system
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Welcome, {VALID_CREDENTIALS.username}</span>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="min-h-[calc(100vh-4rem)]">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/50">
                <div className="container mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>© 2025 Media Dashboard. All rights reserved.</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Session expires in 24 hours</span>
                            <span>•</span>
                            <span>Secure Connection</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}