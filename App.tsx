import React, { useState, useEffect } from 'react';
import { Screen, Meal, DailyGoal, UserProfile } from './types';
import { HomeScreen } from './components/HomeScreen';
import { CameraScreen } from './components/CameraScreen';
import { ResultScreen } from './components/ResultScreen';
import { LoginScreen } from './components/LoginScreen';
import { QuestionnaireScreen } from './components/QuestionnaireScreen';
import { loadTokens } from './lib/tokens';
import { questionnaireService } from './src/services/questionnaireService';
import { supabase } from './src/lib/supabase';
import { t } from './i18n';

const App = () => {
    const [tokensLoaded, setTokensLoaded] = useState(false);

    useEffect(() => {
        loadTokens().then(() => {
            setTokensLoaded(true);
        });
    }, []);

    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null as UserProfile | null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dailyGoal, setDailyGoal] = useState(null as DailyGoal | null);

    const [currentScreen, setCurrentScreen] = useState(Screen.Home);
    
    // Load meals from localStorage on mount
    const [meals, setMeals] = useState([] as Meal[]);
    
    // Save meals to localStorage whenever they change
    useEffect(() => {
        try {
            const savedMeals = localStorage.getItem('ovqat-meals');
            if (savedMeals) {
                setMeals(JSON.parse(savedMeals));
            }
        } catch (error) {
            console.error('Failed to load meals from localStorage:', error);
        }
    }, []);
    
    useEffect(() => {
        try {
            localStorage.setItem('ovqat-meals', JSON.stringify(meals));
        } catch (error) {
            console.error('Failed to save meals to localStorage:', error);
        }
    }, [meals]);
    
    const [capturedImage, setCapturedImage] = useState(null as {dataUrl: string, file?: File} | null);
    const [viewingMeal, setViewingMeal] = useState(null as Meal | null);

    const handleOpenCamera = () => {
        console.log('Navigating to Camera screen');
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
        setCurrentScreen(Screen.Camera);
    };

    const handleConfirmMeal = (newMeal: Meal) => {
        console.log('Meal confirmed, navigating to Home screen');
        setMeals(prevMeals => [...prevMeals, newMeal]);
        setCapturedImage(null);
        setViewingMeal(null);
        setCurrentScreen(Screen.Home);
    };
    
    const handleMealClick = (meal: Meal) => {
        console.log('Meal clicked, opening Result screen for viewing:', meal);
        setViewingMeal(meal);
        setCurrentScreen(Screen.Result);
    };
    
    const handleBackFromResult = () => {
        console.log('Back from Result screen, navigating to Home screen');
        setCapturedImage(null);
        setViewingMeal(null);
        setCurrentScreen(Screen.Home);
    };

    // Handle successful login
    const handleLoginSuccess = async (userProfile: UserProfile | null, phone: string, needsOnboarding: boolean) => {
        console.log('Login successful:', { userProfile, phone, needsOnboarding });
        setIsAuthenticated(true);
        setUser(userProfile);
        setPhoneNumber(phone);
        
        if (needsOnboarding) {
            // User needs to complete questionnaire
            setCurrentScreen(Screen.Questionnaire);
        } else {
            // User has completed onboarding - load goals and show home screen
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
                            <div className="text-label-primary">Loading...</div>
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
    
    if (!tokensLoaded) {
        // Render nothing or a loading spinner until tokens are loaded to prevent style flashing
        return null;
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