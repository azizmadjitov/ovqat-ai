import React, { useState, useEffect } from 'react';
import { Screen, Meal, DailyGoal } from './types';
import { HomeScreen } from './components/HomeScreen';
import { CameraScreen } from './components/CameraScreen';
import { ResultScreen } from './components/ResultScreen';
import { loadTokens } from './lib/tokens';

const MOCK_DAILY_GOAL: DailyGoal = {
    calories: 2200,
    macros: { protein: 150, fat: 70, carbs: 250 }
};

const App: React.FC = () => {
    const [tokensLoaded, setTokensLoaded] = useState(false);

    useEffect(() => {
        loadTokens().then(() => {
            setTokensLoaded(true);
        });
    }, []);

    const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Home);
    
    // Load meals from localStorage on mount
    const [meals, setMeals] = useState<Meal[]>(() => {
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
    
    const [capturedImage, setCapturedImage] = useState<{dataUrl: string, file?: File} | null>(null);
    const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);

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

    const renderScreen = () => {
        console.log('Rendering screen:', currentScreen);
        switch (currentScreen) {
            case Screen.Home:
                return <HomeScreen meals={meals} dailyGoal={MOCK_DAILY_GOAL} onOpenCamera={handleOpenCamera} onMealClick={handleMealClick} />;
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
                return <HomeScreen meals={meals} dailyGoal={MOCK_DAILY_GOAL} onOpenCamera={handleOpenCamera} onMealClick={handleMealClick} />;
        }
    };
    
    if (!tokensLoaded) {
        // Render nothing or a loading spinner until tokens are loaded to prevent style flashing
        return null;
    }

    return (
        <div className="max-w-md mx-auto shadow-2xl min-h-screen">
            {renderScreen()}
        </div>
    );
};

export default App;