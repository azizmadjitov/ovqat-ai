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
        setCurrentScreen(Screen.Home);
    };

    const renderScreen = () => {
        console.log('Rendering screen:', currentScreen);
        switch (currentScreen) {
            case Screen.Home:
                return <HomeScreen meals={meals} dailyGoal={MOCK_DAILY_GOAL} onOpenCamera={handleOpenCamera} />;
            case Screen.Camera:
                return <CameraScreen onPhotoTaken={handlePhotoTaken} onCancel={handleCancelCamera} />;
            case Screen.Result:
                console.log('Rendering Result screen with image:', !!capturedImage);
                if (capturedImage) {
                    console.log('Captured image URL length:', capturedImage.dataUrl.length);
                    return <ResultScreen imageDataUrl={capturedImage.dataUrl} imageFile={capturedImage.file} onConfirm={handleConfirmMeal} onRetake={handleRetake} />;
                }
                // Fallback to home if no image
                console.log('No captured image, falling back to Home screen');
                setCurrentScreen(Screen.Home);
                return null;
            default:
                return <HomeScreen meals={meals} dailyGoal={MOCK_DAILY_GOAL} onOpenCamera={handleOpenCamera} />;
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