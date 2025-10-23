import React, { useState, useEffect } from 'react';
import { Meal } from '../types';
import { t } from '../i18n';
import { analyzeMeal, NutritionResult } from '../src/services/nutritionSupabase';
import { LoadingSpinner } from './LoadingSpinner';

// --- Asset Imports ---
const chevronLeftIcon = '/assets/icons/chevron-left.svg';
const uploadIcon = '/assets/icons/upload-line.svg';
const minusIcon = '/assets/icons/minus.svg';
const plusIcon = '/assets/icons/plus.svg';
const caloriesIconUrl = '/assets/img/calories.png';
const healthIconUrl = '/assets/img/health-score.png';
const proteinIconUrl = '/assets/img/protein.png';
const carbsIconUrl = '/assets/img/carbs.png';
const fatIconUrl = '/assets/img/fat.png';
const fiberIconUrl = '/assets/img/fiber.png';

// --- Helper Components ---

const TopStat: React.FC<{ value: string; label: string; icon: string }> = ({ value, label, icon }) => (
    <div className="flex flex-col items-start gap-y-2">
        <span className="text-title-h1 text-label-primary">{value}</span>
        <div className="flex items-center gap-x-1">
            <img src={icon} alt="" className="w-5 h-5" onError={(e) => console.log(`Failed to load icon: ${icon}`)} /> {/* 1.25rem */}
            <span className="text-label-md text-label-primary">{label}</span>
        </div>
    </div>
);

const NutrientStat: React.FC<{ value: string; label: string; icon: string }> = ({ value, label, icon }) => (
    <div className="flex flex-col items-start gap-y-2">
        <span className="text-title-h3 text-label-primary">{value}</span>
        <div className="flex items-center gap-x-1">
            <img src={icon} alt={`${label} icon`} className="w-5 h-5" onError={(e) => console.log(`Failed to load icon: ${icon}`)} /> {/* 1.25rem */}
            <span className="text-label-md text-label-primary">{label}</span>
        </div>
    </div>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="var(--static-black)" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.5001 14.2002C17.6818 14.2001 17.8585 14.26 18.0027 14.3705C18.1469 14.4811 18.2506 14.6362 18.2976 14.8118C18.4126 15.2687 18.6492 15.6859 18.9824 16.019C19.3155 16.3522 19.7327 16.5888 20.1896 16.7038C20.3651 16.7508 20.5201 16.8543 20.6308 16.9984C20.7414 17.1425 20.8013 17.3191 20.8013 17.5007C20.8013 17.6824 20.7414 17.859 20.6308 18.0031C20.5201 18.1472 20.3651 18.2507 20.1896 18.2977C19.7327 18.4127 19.3155 18.6493 18.9824 18.9825C18.6492 19.3156 18.4126 19.7328 18.2976 20.1897C18.251 20.3656 18.1475 20.5212 18.0033 20.6323C17.859 20.7433 17.6821 20.8035 17.5001 20.8035C17.3181 20.8035 17.1412 20.7433 16.9969 20.6323C16.8527 20.5212 16.7492 20.3656 16.7026 20.1897C16.5876 19.7328 16.351 19.3156 16.0178 18.9825C15.6847 18.6493 15.2675 18.4127 14.8106 18.2977C14.6347 18.2511 14.4791 18.1476 14.368 18.0034C14.257 17.8591 14.1968 17.6822 14.1968 17.5002C14.1968 17.3182 14.257 17.1413 14.368 16.997C14.4791 16.8528 14.6347 16.7493 14.8106 16.7027C15.2675 16.5877 15.6847 16.3511 16.0178 16.0179C16.351 15.6848 16.5876 15.2676 16.7026 14.8107L16.7499 14.682C16.8157 14.5383 16.9213 14.4164 17.0543 14.331C17.1873 14.2456 17.342 14.2002 17.5001 14.2002ZM9.90011 2.2002C10.1605 2.20032 10.4124 2.29279 10.611 2.46118C10.8096 2.62957 10.942 2.86294 10.9847 3.1198C11.2916 4.9568 11.8812 6.1998 12.7403 7.06C13.5994 7.9191 14.8435 8.5087 16.6805 8.8156C16.9368 8.85894 17.1695 8.99165 17.3373 9.19018C17.505 9.38872 17.5971 9.64026 17.5971 9.9002C17.5971 10.1601 17.505 10.4117 17.3373 10.6102C17.1695 10.8087 16.9368 10.9415 16.6805 10.9848C14.8435 11.2917 13.6005 11.8813 12.7403 12.7404C11.8812 13.5995 11.2916 14.8436 10.9847 16.6806C10.9414 16.9369 10.8087 17.1696 10.6101 17.3373C10.4116 17.5051 10.16 17.5972 9.90011 17.5972C9.64017 17.5972 9.38863 17.5051 9.19009 17.3373C8.99156 17.1696 8.85885 16.9369 8.81551 16.6806C8.50861 14.8436 7.91901 13.6006 7.05991 12.7404C6.20081 11.8813 4.95671 11.2917 3.11971 10.9848C2.86341 10.9415 2.63074 10.8087 2.46296 10.6102C2.29518 10.4117 2.20312 10.1601 2.20312 9.9002C2.20312 9.64026 2.29518 9.38872 2.46296 9.19018C2.63074 8.99165 2.86341 8.85894 3.11971 8.8156C4.95671 8.5087 6.19971 7.9191 7.05991 7.06C7.91901 6.2009 8.50861 4.9568 8.81551 3.1198L8.83531 3.0219C8.89688 2.78643 9.03481 2.57804 9.22749 2.42935C9.42017 2.28066 9.65672 2.20007 9.90011 2.2002Z" />
    </svg>
);

// --- Main Component ---

interface ResultScreenProps {
  // For viewing existing meal
  existingMeal?: Meal;
  onBack?: () => void;
  // For adding new meal
  imageDataUrl?: string;
  imageFile?: File;
  onConfirm?: (meal: Meal) => void;
  onRetake?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ 
    existingMeal,
    onBack,
    imageDataUrl, 
    imageFile, 
    onConfirm, 
    onRetake 
}) => {
    const isViewMode = !!existingMeal;
    
    const [servingAmount, setServingAmount] = useState(1.0);
    const [nutritionData, setNutritionData] = useState<NutritionResult | null>(null);
    const [loading, setLoading] = useState(!isViewMode); // Don't load if viewing existing meal
    const [error, setError] = useState<string | null>(null);
    const [timestamp] = useState(
        existingMeal 
            ? new Date(existingMeal.id).toLocaleString('en-US', { 
                weekday: 'long', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
            : new Date().toLocaleString('en-US', { 
                weekday: 'long', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
    );
    
    // Initialize nutrition data from existing meal if in view mode
    useEffect(() => {
        if (isViewMode && existingMeal) {
            setNutritionData({
                title: existingMeal.name,
                description: existingMeal.description || '', // Load description from stored meal
                takenAtISO: existingMeal.id,
                calories: existingMeal.calories,
                protein_g: existingMeal.macros.protein,
                carbs_g: existingMeal.macros.carbs,
                fat_g: existingMeal.macros.fat,
                fiber_g: existingMeal.macros.fiber || 0,
                healthScore_10: existingMeal.healthScore || 7, // Load health score from stored meal, default to 7 if not available
            });
            setLoading(false);
        }
    }, [isViewMode, existingMeal]);
    
    // Load nutrition data when component mounts (only for new meals)
    useEffect(() => {
        // Skip loading if in view mode
        if (isViewMode) {
            return;
        }
        
        const loadNutritionData = async () => {
            try {
                setLoading(true);
                setError(null); // Clear any previous errors
                
                console.log('Loading nutrition data with:', { imageDataUrl, imageFile });
                
                // Use the Supabase nutrition service
                if (imageFile) {
                    console.log('Using Supabase nutrition service with file');
                    const data = await analyzeMeal(imageFile, 1); // Always use 1 for initial analysis
                    console.log('Received data from analyzeMeal:', data);
                    
                    setNutritionData(data);
                } else {
                    throw new Error('No image file available for analysis');
                }
            } catch (err) {
                console.error('Error loading nutrition data:', err);
                setError('Failed to analyze the meal image. Using mock data instead.');
                // Set mock data as fallback
                setNutritionData({
                    title: "Grilled Chicken Salad",
                    description: "A healthy and delicious salad featuring grilled chicken, fresh greens, cherry tomatoes, and a light vinaigrette dressing. Perfect for a light yet satisfying meal.",
                    takenAtISO: new Date().toISOString(),
                    calories: 380,
                    protein_g: 35,
                    carbs_g: 22,
                    fat_g: 18,
                    fiber_g: 8,
                    healthScore_10: 8
                });
            } finally {
                setLoading(false);
            }
        };
        
        if (imageDataUrl) {
            loadNutritionData();
        } else {
            setError('No image data provided');
            setLoading(false);
        }
    }, [imageDataUrl, imageFile]); // Remove servingAmount from dependencies
    
    const handleServingChange = (delta: number) => {
        setServingAmount(prev => Math.max(1, prev + delta));
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-bg-base text-label-primary flex flex-col items-center justify-center px-6">
                <LoadingSpinner />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-bg-base text-label-primary flex flex-col items-center justify-center">
                <div className="text-center">
                    <p className="text-label-primary">Error: {error}</p>
                    <button 
                        onClick={onRetake}
                        className="mt-4 px-4 py-2 bg-accent-green text-label-opposite rounded-lg"
                    >
                        {t('try_again')}
                    </button>
                </div>
            </div>
        );
    }

    // Ensure we have nutrition data before rendering
    if (!nutritionData) {
        return (
            <div className="min-h-screen bg-bg-base text-label-primary flex flex-col items-center justify-center">
                <div className="text-center">
                    <p className="text-label-primary">{t('unable_analyze')}</p>
                    <button 
                        onClick={onRetake}
                        className="mt-4 px-4 py-2 bg-accent-green text-label-opposite rounded-lg"
                    >
                        {t('try_again')}
                    </button>
                </div>
            </div>
        );
    }

    // Calculate display values (multiply by servingAmount for display)
    const displayValues = nutritionData ? {
        calories: Math.round(nutritionData.calories * servingAmount),
        protein: Math.round(nutritionData.protein_g * servingAmount),
        carbs: Math.round(nutritionData.carbs_g * servingAmount),
        fat: Math.round(nutritionData.fat_g * servingAmount),
        fiber: Math.round(nutritionData.fiber_g * servingAmount),
    } : {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
    };

    const handleConfirm = () => {
        if (!nutritionData) return;
        
        // In view mode, just go back
        if (isViewMode && onBack) {
            onBack();
            return;
        }
        
        // In add mode, create new meal
        if (!onConfirm || !imageDataUrl) return;
        
        const now = new Date();
        const newMeal: Meal = {
            id: now.toISOString(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            date: now.toISOString().split('T')[0], // YYYY-MM-DD format
            imageUrl: imageDataUrl,
            name: nutritionData.title,
            description: nutritionData.description, // Save description
            healthScore: nutritionData.healthScore_10, // Save health score
            calories: displayValues.calories,
            macros: {
                protein: displayValues.protein,
                carbs: displayValues.carbs,
                fat: displayValues.fat,
                fiber: displayValues.fiber,
            }
        };
        onConfirm(newMeal);
    };

    return (
        <div className="min-h-screen bg-bg-base text-label-primary flex flex-col">
            <header className="h-[3rem] px-4 flex items-center justify-between flex-shrink-0">
                <button onClick={isViewMode ? onBack : onRetake} className="p-2 -ml-2">
                    <img src={chevronLeftIcon} alt="Back" className="w-6 h-6" />
                </button>
                <h1 className="text-title-h3 text-label-primary">{t('app_name')}</h1>
                <button className="p-2 -mr-2">
                    <img src={uploadIcon} alt="Share" className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-1 flex flex-col px-4 pt-5 pb-8 overflow-y-auto">
                <section className="flex items-center gap-x-4 mb-5">
                    <img id="food-image" src={isViewMode ? existingMeal?.imageUrl : imageDataUrl} alt={nutritionData.title} className="w-[8.125rem] h-[8.125rem] rounded-full object-cover flex-shrink-0 border border-stroke-non-opaque" />
                    {nutritionData.description && (
                        <div className="bg-[var(--bg-fill)] p-3 rounded-xl">
                            <p className="description-text text-label-sm text-label-primary line-clamp-3">
                                {nutritionData.description}
                            </p>
                        </div>
                    )}
                </section>

                <section className="mb-5">
                    <h2 className="text-title-h3 text-label-primary">{nutritionData.title}</h2>
                    <p className="text-body-md text-label-secondary mt-1">{timestamp}</p>
                </section>
                
                <section className="flex justify-between items-center mb-5">
                    <span className="text-label-lg text-label-primary">Serving amount</span>
                    <div 
                        className="serving-picker"
                        style={{
                            width: '7rem',
                            height: '2.5rem',
                            background: 'var(--bg-fill)',
                            borderRadius: '0.875rem',
                            display: 'grid',
                            alignItems: 'center',
                            gridTemplateColumns: '0.25rem 2rem 0.125rem 2.375rem 0.125rem 2rem 0.25rem',
                            gap: '0',
                            padding: '0',
                            boxSizing: 'content-box'
                        }}
                    >
                        <div></div>
                        <button 
                            onClick={() => handleServingChange(-1)}
                            className="pickerBtn"
                            style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '0.625rem',
                                background: 'var(--bg-elevation)',
                                display: 'grid',
                                placeItems: 'center',
                                flex: 'none',
                                margin: '0',
                                padding: '0',
                                boxSizing: 'content-box'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <img src={minusIcon} alt="Decrease serving" style={{ width: '1.5rem', height: '1.5rem', opacity: 0.7, color: 'var(--label-primary)' }} />
                        </button>
                        <div></div>
                        <div 
                            className="pickerValue text-label-lg"
                            style={{
                                width: '2.375rem',
                                textAlign: 'center',
                                lineHeight: '2.5rem',
                                color: 'var(--label-primary)',
                                padding: '0',
                                margin: '0',
                                flex: 'none',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {Math.round(servingAmount)}
                        </div>
                        <div></div>
                        <button 
                            onClick={() => handleServingChange(1)}
                            className="pickerBtn"
                            style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '0.625rem',
                                background: 'var(--bg-elevation)',
                                display: 'grid',
                                placeItems: 'center',
                                flex: 'none',
                                margin: '0',
                                padding: '0',
                                boxSizing: 'content-box'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <img src={plusIcon} alt="Increase serving" style={{ width: '1.5rem', height: '1.5rem', opacity: 0.7, color: 'var(--label-primary)' }} />
                        </button>
                        <div></div>
                    </div>
                </section>
                
                <section className="nutrients-card rounded-[1.5rem] p-[1.25rem]" style={{
                    backgroundColor: 'var(--bg-elevation)',
                    border: '1px solid var(--stroke-non-opaque)'
                }}>
                    {/* Top Area */}
                    <div className="grid grid-cols-2 gap-x-[1.25rem]">
                         <TopStat value={String(displayValues.calories)} label="Calories" icon={caloriesIconUrl} />
                         <TopStat value={`${nutritionData.healthScore_10}/10`} label="Health score" icon={healthIconUrl} />
                    </div>
                    
                    {/* Divider */}
                    <div className="my-[1.25rem] h-px" style={{ display: 'block', width: '100%', backgroundColor: 'var(--stroke-non-opaque)' }}></div>

                    {/* Bottom Area */}
                    <div className="nutrient-grid grid grid-cols-2 gap-x-[1.25rem] gap-y-[1rem]">
                        <NutrientStat value={`${displayValues.protein}g`} label="Protein" icon={proteinIconUrl} />
                        <NutrientStat value={`${displayValues.carbs}g`} label="Carbs" icon={carbsIconUrl} />
                        <NutrientStat value={`${displayValues.fat}g`} label="Fat" icon={fatIconUrl} />
                        <NutrientStat value={`${displayValues.fiber}g`} label="Fiber" icon={fiberIconUrl} />
                    </div>
                </section>
                
                {!isViewMode && (
                    <div className="mt-auto pt-5 flex justify-center">
                        <button
                            onClick={handleConfirm}
                            className="h-14 px-8 rounded-full flex items-center justify-center gap-x-2 bg-[linear-gradient(135deg,#DFF2FF_29.6%,#FFC3EB_79.85%)] transform active:scale-95 transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFC3EB]/50"
                        >
                            <SparklesIcon className="w-6 h-6" />
                            <span className="text-label-lg" style={{ color: 'var(--static-black)' }}>Done</span>
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};