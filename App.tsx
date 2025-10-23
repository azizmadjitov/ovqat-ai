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
        
        loadTokens().then(() => {
            setTokensLoaded(true);
        });
        
        return () => {
            unsubscribeTheme();
        };
    }, []);

    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dailyGoal, setDailyGoal] = useState<any>(null);

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

    // Update native navbar when screen changes
    useEffect(() => {
        navigationManager.push(currentScreen);
    }, [currentScreen]);

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
                    
                    // Check onboarding status
                    const { completed } = await questionnaireService.checkOnboardingStatus(userProfile.id);
                    
                    if (completed) {
                        // User has completed onboarding - load goals
                        const { goals } = await questionnaireService.getUserGoals(userProfile.id);
                        if (goals) {
                            setDailyGoal({
                                calories: goals.goal_calories,
                                macros: {
                                    protein: goals.goal_protein_g,
                                    fat: goals.goal_fat_g,
                                    carbs: goals.goal_carbs_g,
                                },
                            });
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
                // Try to load cached goals immediately for faster initial render
                try {
                    const cachedGoalsStr = localStorage.getItem('cachedDailyGoal');
                    if (cachedGoalsStr) {
                        const cachedGoals = JSON.parse(cachedGoalsStr);
                        console.log('⚡ Using cached goals for instant display');
                        setDailyGoal(cachedGoals);
                    }
                } catch (e) {
                    console.warn('Failed to load cached goals:', e);
                }

                const dataLoadStart = performance.now();
                console.log('⏱️ [PERF] Starting data load for user.id:', user.id);
                try {
                    // Load goals and meals in parallel
                    const [goalsResult, mealsResult] = await Promise.all([
                        questionnaireService.getUserGoals(user.id),
                        mealsService.loadMeals(user.id)
                    ]);

                    const dataLoadEnd = performance.now();
                    const dataLoadTime = ((dataLoadEnd - dataLoadStart) / 1000).toFixed(2);
                    console.log(`⏱️ [PERF] Data loaded in ${dataLoadTime}s`);
                    console.log('🔍 goalsResult:', goalsResult);

                    // Set goals
                    if (goalsResult.goals) {
                        console.log('✅ Goals loaded from database:', goalsResult.goals);
                        const goals = {
                            calories: goalsResult.goals.goal_calories,
                            macros: {
                                protein: goalsResult.goals.goal_protein_g,
                                fat: goalsResult.goals.goal_fat_g,
                                carbs: goalsResult.goals.goal_carbs_g,
                            },
                        };
                        setDailyGoal(goals);
                        // Cache goals in localStorage for faster subsequent loads
                        try {
                            localStorage.setItem('cachedDailyGoal', JSON.stringify(goals));
                        } catch (e) {
                            console.warn('Failed to cache goals:', e);
                        }
                    } else {
                        console.warn('⚠️ No goals found in database, setting defaults');
                        setDailyGoal({
                            calories: 2000,
                            macros: {
                                protein: 150,
                                fat: 65,
                                carbs: 250,
                            },
                        });
                    }

                    // Set meals
                    if (mealsResult.success && mealsResult.meals) {
                        setMeals(mealsResult.meals);
                        console.log('✅ Loaded', mealsResult.meals.length, 'meals from database');
                    } else {
                        console.error('Failed to load meals:', mealsResult.error);
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                    // Set default goals on error
                    setDailyGoal({
                        calories: 2000,
                        macros: {
                            protein: 150,
                            fat: 65,
                            carbs: 250,
                        },
                    });
                }
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
        setMeals(prevMeals => [...prevMeals, newMeal]);
        
        // Navigate immediately for instant feedback
        setCapturedImage(null);
        setViewingMeal(null);
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
                return <HomeScreen meals={meals} dailyGoal={dailyGoal} onOpenCamera={handleOpenCamera} onMealClick={handleMealClick} />;
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
                return <HomeScreen meals={meals} dailyGoal={dailyGoal} onOpenCamera={handleOpenCamera} onMealClick={handleMealClick} />;
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