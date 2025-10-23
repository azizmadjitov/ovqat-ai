import React, { useState, useEffect } from 'react';
import { Screen, Meal, DailyGoal, UserProfile } from './types';
import { HomeScreen } from './components/HomeScreen';
import { CameraScreen } from './components/CameraScreen';
import { ResultScreen } from './components/ResultScreen';
import { LoginScreen } from './components/LoginScreen';
import { QuestionnaireScreen } from './components/QuestionnaireScreen';
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
        // Initialize theme system
        initializeTheme();
        
        // Initialize native event listeners
        initializeNativeEvents();
        
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
        try {
            console.log('🔍 Checking for existing authenticated session...');
            
            // Check for token in URL parameter first
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');
            
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
            setAppInitialized(true);
        }
    };

    // Load user goals and meals on authentication
    useEffect(() => {
        const loadUserData = async () => {
            if (isAuthenticated && user) {
                try {
                    // Load goals and meals in parallel
                    const [goalsResult, mealsResult] = await Promise.all([
                        questionnaireService.getUserGoals(user.id),
                        mealsService.loadMeals(user.id)
                    ]);

                    // Set goals
                    if (goalsResult.goals) {
                        setDailyGoal({
                            calories: goalsResult.goals.goal_calories,
                            macros: {
                                protein: goalsResult.goals.goal_protein_g,
                                fat: goalsResult.goals.goal_fat_g,
                                carbs: goalsResult.goals.goal_carbs_g,
                            },
                        });
                    } else {
                        console.log('No goals found, setting defaults');
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
        navigationManager.push(Screen.Camera);
        setCurrentScreen(Screen.Camera);
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
        console.log('Retaking photo, navigating to Camera screen');
        setCapturedImage(null);
        navigationManager.pop();
        setCurrentScreen(Screen.Camera);
    };

    const handleConfirmMeal = async (newMeal: Meal) => {
        console.log('Meal confirmed, saving to database');
        
        // Add to local state first for immediate UI update
        setMeals(prevMeals => [...prevMeals, newMeal]);
        
        // Save to Supabase if user is authenticated
        if (user?.id) {
            const result = await mealsService.saveMeal(user.id, newMeal);
            if (!result.success) {
                console.error('Failed to save meal to database:', result.error);
            }
        }
        
        setCapturedImage(null);
        setViewingMeal(null);
        setCurrentScreen(Screen.Home);
    };
    
    const handleMealClick = (meal: Meal) => {
        console.log('Meal clicked, opening Result screen for viewing:', meal);
        setViewingMeal(meal);
        navigationManager.push(Screen.Result);
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
        console.log('Questionnaire completed');
        
        // Load user goals
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { goals } = await questionnaireService.getUserGoals(authUser.id);
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
        }
        
        setCurrentScreen(Screen.Home);
    };

    const renderScreen = () => {
        console.log('Rendering screen:', currentScreen);
        switch (currentScreen) {
            case Screen.Questionnaire:
                return <QuestionnaireScreen phoneNumber={phoneNumber} onComplete={handleQuestionnaireComplete} />;
            case Screen.Home:
                // Show loading state if dailyGoal is not yet loaded
                if (!dailyGoal) {
                    return (
                        <div className="flex items-center justify-center min-h-screen bg-bg-base">
                            <div className="text-label-primary">{t('loading')}</div>
                        </div>
                    );
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