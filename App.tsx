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
    const [meals, setMeals] = useState<Meal[]>([]);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const handleOpenCamera = () => {
        setCurrentScreen(Screen.Camera);
    };

    const handlePhotoTaken = (imageDataUrl: string) => {
        setCapturedImage(imageDataUrl);
        setCurrentScreen(Screen.Result);
    };

    const handleCancelCamera = () => {
        setCurrentScreen(Screen.Home);
    };
    
    const handleRetake = () => {
        setCapturedImage(null);
        setCurrentScreen(Screen.Camera);
    };

    const handleConfirmMeal = (newMeal: Meal) => {
        setMeals(prevMeals => [...prevMeals, newMeal]);
        setCapturedImage(null);
        setCurrentScreen(Screen.Home);
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case Screen.Home:
                return <HomeScreen meals={meals} dailyGoal={MOCK_DAILY_GOAL} onOpenCamera={handleOpenCamera} />;
            case Screen.Camera:
                return <CameraScreen onPhotoTaken={handlePhotoTaken} onCancel={handleCancelCamera} />;
            case Screen.Result:
                if (capturedImage) {
                    return <ResultScreen imageDataUrl={capturedImage} onConfirm={handleConfirmMeal} onRetake={handleRetake} />;
                }
                // Fallback to home if no image
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