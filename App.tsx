import React, { useState, useEffect } from 'react';
import { Screen, Meal, DailyGoal, UserProfile } from './types';
import { HomeScreen } from './components/HomeScreen';
import { CameraScreen } from './components/CameraScreen';
import { ResultScreen } from './components/ResultScreen';
import { LoginScreen } from './components/LoginScreen';
import { QuestionnaireScreen } from './components/QuestionnaireScreen';
import { SplashScreen } from './components/SplashScreen';
import { loadTokens } from './lib/tokens';
import { initializeTheme, applyTheme } from './src/lib/theme';
import { navigationManager } from './src/lib/navigationManager';
import { initializeNativeEvents, nativeEventManager } from './src/lib/nativeEvents';
import { questionnaireService } from './src/services/questionnaireService';
import { authService } from './src/services/authService';
import { mealsService } from './src/services/mealsService';
import { supabase } from './src/lib/supabase';
import { t } from './i18n';

const App = () => {
    const [tokensLoaded, setTokensLoaded] = useState(false);
    const [appInitialized, setAppInitialized] = useState(false);

    useEffect(() => {
        // Initialize native event listeners first so we can receive theme immediately
        initializeNativeEvents();
        // Ask parent app to send current theme right away (native should respond with THEME_CHANGE)
        try {
            nativeEventManager.sendToNative({ type: 'REQUEST_THEME' });
        } catch (e) {
            console.warn('Could not request theme from native immediately:', e);
        }
        
        // Initialize theme system (will also subscribe to parent theme changes)
        initializeTheme();
        
        // Listen for theme changes from native app
        const unsubscribeTheme = nativeEventManager.on('THEME_CHANGE', (data) => {
            console.log('🎨 Theme changed from native app:', data.theme);
            applyTheme(data.theme);
        });
        
        // Request theme when app becomes visible again (user returns from parent app)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('🔄 App became visible, requesting current theme from native');
                try {
                    nativeEventManager.sendToNative({ type: 'REQUEST_THEME' });
                } catch (e) {
                    console.warn('Could not request theme on visibility change:', e);
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        loadTokens().then(() => {
            setTokensLoaded(true);
        });
        
        return () => {
            unsubscribeTheme();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dailyGoal, setDailyGoal] = useState<any>(null);
    const [mealsLoading, setMealsLoading] = useState(true);

    const [currentScreen, setCurrentScreen] = useState(Screen.Home);
    
    // Load meals from localStorage on mount
    const [meals, setMeals] = useState(() => {
        try {
            const savedMeals = localStorage.getItem('ovqat-meals');
            return savedMeals ? JSON.parse(savedMeals) : [];
        } catch (error) {
            console.error('Failed to load meals from localStorage:', error);
            return [];
        }
    });
    
    // Save meals to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('ovqat-meals', JSON.stringify(meals));
        } catch (error) {
            console.error('Failed to save meals to localStorage:', error);
        }
    }, [meals]);
    
    const [capturedImage, setCapturedImage] = useState<{ dataUrl: string; file?: File } | null>(null);
    const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);

    // Check for existing authenticated user on app load
    useEffect(() => {
        if (tokensLoaded && !appInitialized) {
            checkExistingSession();
        }
    }, [tokensLoaded, appInitialized]);

    // Sync screen changes from browser history (back/forward)
    useEffect(() => {
        const unsubscribe = navigationManager.onScreenChange((screen) => {
            console.log(`🔄 Screen changed from history: ${screen}`);
            setCurrentScreen(screen);
        });
        
        return unsubscribe;
    }, []);

    const checkExistingSession = async () => {
        const startTime = performance.now();
        console.log('⏱️ [PERF] App initialization started');
        try {
            console.log('🔍 Checking for existing authenticated session...');
            
            // Check URL for token parameter
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('token');
            console.log('🔍 URL params:', window.location.search);
            console.log('🔍 Token from URL:', tokenFromUrl);
            
            if (tokenFromUrl) {
                console.log('🔐 Found token in URL, authenticating...');
                const { user: userData, error } = await authService.authenticateWithToken(tokenFromUrl);
                
                if (error) {
                    console.error('❌ Token auth failed:', error);
                } else if (userData) {
                    console.log('✅ Token auth successful');
                    setIsAuthenticated(true);
                    setUser(userData);
                    setPhoneNumber(userData.phone_number || '');
                    
                    const handleQuestionnaireComplete = () => {
                        navigationManager.push(Screen.Home);
                        setCurrentScreen(Screen.Home);
                    };

                    if (userData.questionnaire_completed) {
                        setCurrentScreen(Screen.Home);
                    } else {
                        setCurrentScreen(Screen.Questionnaire);
                    }
                    setAppInitialized(true);
                    return;
                }
            }
            
            // Check if there's an existing user session
            const { data: { user: authUser } } = await supabase.auth.getUser();
            
            if (authUser) {
                console.log('✅ Found existing auth session:', authUser.id);
                
                // Get user profile data
                const userProfile = await authService.getCurrentUser();
                
                if (userProfile) {
                    console.log('✅ Found user profile:', userProfile);
                    
                    // Set authentication state
                    setIsAuthenticated(true);
                    setUser(userProfile);
                    setPhoneNumber(userProfile.phone_number || '');
                    
                    // Load onboarding status and goals in parallel
                    const [onboardingResult, goalsResult] = await Promise.all([
                        questionnaireService.checkOnboardingStatus(userProfile.id),
                        questionnaireService.getUserGoals(userProfile.id)
                    ]);
                    
                    if (onboardingResult.completed) {
                        // User has completed onboarding
                        if (goalsResult.goals) {
                            const goals = {
                                calories: goalsResult.goals.goal_calories,
                                macros: {
                                    protein: goalsResult.goals.goal_protein_g,
                                    fat: goalsResult.goals.goal_fat_g,
                                    carbs: goalsResult.goals.goal_carbs_g,
                                },
                            };
                            setDailyGoal(goals);
                            // Cache goals for faster subsequent loads
                            try {
                                localStorage.setItem('cachedDailyGoal', JSON.stringify(goals));
                            } catch (e) {
                                console.warn('Failed to cache goals:', e);
                            }
                        }
                        setCurrentScreen(Screen.Home);
                    } else {
                        // User needs to complete onboarding
                        setCurrentScreen(Screen.Questionnaire);
                    }
                } else {
                    console.log('ℹ️ No user profile found, showing login screen');
                }
            } else {
                console.log('ℹ️ No existing auth session found');
            }
        } catch (error) {
            console.error('Error checking existing session:', error);
        } finally {
            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);
            console.log(`⏱️ [PERF] App initialization completed in ${totalTime}s`);
            setAppInitialized(true);
        }
    };

    // Load user goals and meals on authentication
    useEffect(() => {
        const loadUserData = async () => {
            if (isAuthenticated && user) {
                // Clear old cache format (for migration)
                const cacheVersion = localStorage.getItem('cacheVersion');
                if (cacheVersion !== '2') {
                    localStorage.removeItem('cachedDailyGoal');
                    localStorage.removeItem('cachedMeals');
                    localStorage.setItem('cacheVersion', '2');
                    console.log('🔄 Cache cleared for version update');
                }
                
                // Try to load cached data immediately for faster initial render
                try {
                    const cachedGoalsStr = localStorage.getItem('cachedDailyGoal');
                    const cachedMealsStr = localStorage.getItem('cachedMeals');
                    
                    if (cachedGoalsStr) {
                        const cachedGoals = JSON.parse(cachedGoalsStr);
                        console.log('⚡ Using cached goals for instant display');
                        setDailyGoal(cachedGoals);
                    }
                    
                    if (cachedMealsStr) {
                        const cachedMeals = JSON.parse(cachedMealsStr);
                        console.log('⚡ Using cached meals for instant display:', cachedMeals.length, 'meals');
                        setMeals(cachedMeals);
                        setMealsLoading(false); // Show cached meals immediately
                    }
                } catch (e) {
                    console.warn('Failed to load cached data:', e);
                }

                // Load meals in background (non-blocking)
                const dataLoadStart = performance.now();
                console.log('⏱️ [PERF] Starting meals load for user.id:', user.id);
                
                mealsService.loadMeals(user.id).then(mealsResult => {
                    const dataLoadEnd = performance.now();
                    const dataLoadTime = ((dataLoadEnd - dataLoadStart) / 1000).toFixed(2);
                    console.log(`⏱️ [PERF] Meals loaded in ${dataLoadTime}s`);

                    // Set meals and cache them
                    if (mealsResult.success && mealsResult.meals) {
                        setMeals(mealsResult.meals);
                        setMealsLoading(false);
                        console.log('✅ Loaded', mealsResult.meals.length, 'meals from database');
                        
                        // Cache meals in localStorage for faster subsequent loads
                        try {
                            localStorage.setItem('cachedMeals', JSON.stringify(mealsResult.meals));
                        } catch (e) {
                            console.warn('Failed to cache meals:', e);
                        }
                    } else {
                        console.error('Failed to load meals:', mealsResult.error);
                        setMealsLoading(false);
                    }
                }).catch(error => {
                    console.error('Error loading meals:', error);
                    setMealsLoading(false);
                });
            }
        };
        loadUserData();
    }, [isAuthenticated, user]);

    const handleOpenCamera = () => {
        // Create hidden file input to trigger system camera/gallery
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Prefer camera on mobile
        
        input.onchange = (event: Event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    if (dataUrl) {
                        handlePhotoTaken(dataUrl, file);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    };

    const handlePhotoTaken = (imageDataUrl: string, imageFile?: File) => {
        console.log('Photo taken, navigating to Result screen');
        console.log('Image data URL length:', imageDataUrl.length);
        console.log('Image data URL starts with:', imageDataUrl.substring(0, 50));
        setCapturedImage({dataUrl: imageDataUrl, file: imageFile});
        navigationManager.push(Screen.Result);
        setCurrentScreen(Screen.Result);
    };

    const handleCancelCamera = () => {
        console.log('Camera cancelled, navigating to Home screen');
        setCurrentScreen(Screen.Home);
    };
    
    const handleRetake = () => {
        console.log('Retaking photo, opening system camera');
        
        // Create hidden file input to trigger system camera
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (event: Event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    if (dataUrl) {
                        // Update with new photo
                        handlePhotoTaken(dataUrl, file);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    };

    const handleConfirmMeal = async (newMeal: Meal) => {
        console.log('Meal confirmed, saving to database');
        
        // Add to local state first for immediate UI update
        const updatedMeals = [...meals, newMeal];
        setMeals(updatedMeals);
        
        // Update cache immediately for instant display on next load
        try {
            localStorage.setItem('cachedMeals', JSON.stringify(updatedMeals));
            console.log('⚡ Updated meals cache');
        } catch (e) {
            console.warn('Failed to update meals cache:', e);
        }
        
        // Navigate immediately for instant feedback (use replace so back doesn't return to Result)
        setCapturedImage(null);
        setViewingMeal(null);
        navigationManager.replace(Screen.Home);
        setCurrentScreen(Screen.Home);
        
        // Save to Supabase in background (non-blocking)
        if (user?.id) {
            mealsService.saveMeal(user.id, newMeal).then(result => {
                if (result.success) {
                    console.log('✅ Meal saved to database');
                } else {
                    console.error('❌ Failed to save meal to database:', result.error);
                    // TODO: Show error toast to user
                }
            }).catch(error => {
                console.error('❌ Unexpected error saving meal:', error);
            });
        }
    };
    
    const handleMealClick = (meal: Meal) => {
        console.log('Meal clicked, opening Result screen for viewing:', meal);
        setViewingMeal(meal);
        navigationManager.push(Screen.Result);
        setCurrentScreen(Screen.Result);
    };

    const handleBackFromResult = () => {
        console.log('Back from Result screen, navigating to Home screen');
        setCapturedImage(null);
        setViewingMeal(null);
        setCurrentScreen(Screen.Home);
    };

    // Handle successful login
    const handleLoginSuccess = (user: UserProfile | null, phoneNumber: string, needsOnboarding: boolean) => {
        setUser(user);
        setPhoneNumber(phoneNumber);
        setIsAuthenticated(true);
        
        // Reset navigation stack when logging in
        navigationManager.reset();
        
        if (needsOnboarding) {
            navigationManager.push(Screen.Questionnaire);
            setCurrentScreen(Screen.Questionnaire);
        } else {
            navigationManager.push(Screen.Home);
            setCurrentScreen(Screen.Home);
        }
    };

    const handleBackPress = () => {
        const canGoBack = navigationManager.pop();
        
        if (canGoBack) {
            // Navigate to previous screen based on stack
            const previousScreen = navigationManager.getCurrentScreen();
            setCurrentScreen(previousScreen);
        } else {
            // No previous screen - WebView will be closed by native app
            console.log('No previous screen - WebView closing');
        }
    };

    // Handle questionnaire completion
    const handleQuestionnaireComplete = async () => {
        console.log('Questionnaire completed, loading user goals...');
        
        // Load user goals using current user from state
        if (user?.id) {
            try {
                const { goals } = await questionnaireService.getUserGoals(user.id);
                if (goals) {
                    console.log('✅ Goals loaded:', goals);
                    setDailyGoal({
                        calories: goals.goal_calories,
                        macros: {
                            protein: goals.goal_protein_g,
                            fat: goals.goal_fat_g,
                            carbs: goals.goal_carbs_g,
                        },
                    });
                } else {
                    console.error('❌ No goals found after questionnaire');
                }
            } catch (error) {
                console.error('❌ Error loading goals:', error);
            }
        } else {
            console.error('❌ No user found in state');
        }
        
        setCurrentScreen(Screen.Home);
    };

    const renderScreen = () => {
        console.log('Rendering screen:', currentScreen);
        
        // Show splash screen during initial app load
        if (!appInitialized) {
            return <SplashScreen />;
        }
        
        switch (currentScreen) {
            case Screen.Questionnaire:
                return <QuestionnaireScreen phoneNumber={phoneNumber} onComplete={handleQuestionnaireComplete} />;
            case Screen.Home:
                // Show splash screen if dailyGoal is not yet loaded
                if (!dailyGoal) {
                    return <SplashScreen />;
                }
                return <HomeScreen meals={meals} dailyGoal={dailyGoal} mealsLoading={mealsLoading} onOpenCamera={handleOpenCamera} onMealClick={handleMealClick} />;
            case Screen.Camera:
                return <CameraScreen onPhotoTaken={handlePhotoTaken} onCancel={handleCancelCamera} />;
            case Screen.Result:
                // If viewing an existing meal, show it in view-only mode
                if (viewingMeal) {
                    console.log('Rendering Result screen for viewing meal:', viewingMeal);
                    return <ResultScreen existingMeal={viewingMeal} onBack={handleBackFromResult} />;
                }
                // If adding a new meal, show the normal flow
                if (capturedImage) {
                    console.log('Rendering Result screen with new image:', capturedImage.dataUrl.length);
                    return <ResultScreen imageDataUrl={capturedImage.dataUrl} imageFile={capturedImage.file} onConfirm={handleConfirmMeal} onRetake={handleRetake} />;
                }
                // Fallback to home if no image or meal
                console.log('No captured image or meal, falling back to Home screen');
                setCurrentScreen(Screen.Home);
                return null;
            default:
                return <HomeScreen meals={meals} dailyGoal={dailyGoal} mealsLoading={mealsLoading} onOpenCamera={handleOpenCamera} onMealClick={handleMealClick} />;
        }
    };
    
    // Show loading screen while initializing
    if (!tokensLoaded || !appInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg-base">
                <div className="text-label-primary">{t('initializing')}</div>
            </div>
        );
    }

    // Show login screen if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto shadow-2xl min-h-screen">
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto shadow-2xl min-h-screen">
            {renderScreen()}
        </div>
    );
};

export default App;