import React, { useState, useEffect } from 'react';
import { Meal } from '../types';
import { t, lang } from '../i18n';
import { analyzeMeal, NutritionResult } from '../src/services/nutritionSupabase';
import { LoadingSpinner } from './LoadingSpinner';
import { SvgIcon } from './SvgIcon';

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
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.0007 1.20825C17.8604 2.8203 19.1803 4.14016 20.7923 4.99992C19.1803 5.85968 17.8604 7.17955 17.0007 8.79159C16.1409 7.17957 14.821 5.85968 13.209 4.99992C14.821 4.14016 16.1409 2.82027 17.0007 1.20825ZM8.00065 4.33325L8.94862 6.11071C10.069 8.2115 11.7891 9.93152 13.8898 11.0519L15.6673 11.9999L13.8898 12.9479C11.789 14.0683 10.069 15.7883 8.94865 17.8891L8.00065 19.6666L7.05263 17.8891C5.93223 15.7883 4.21226 14.0683 2.11152 12.9479L0.333984 11.9999L2.11146 11.0519C4.21224 9.93151 5.93224 8.21151 7.05266 6.11074L8.00065 4.33325ZM22.7923 17.9999C20.7551 16.9134 19.0872 15.2455 18.0007 13.2083C16.9142 15.2455 15.2462 16.9134 13.209 17.9999C15.2462 19.0864 16.9142 20.7544 18.0007 22.7916C19.0872 20.7544 20.7551 19.0864 22.7923 17.9999Z" fill="currentColor"/>
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
    
    // Initialize nutrition data immediately if viewing existing meal
    const [nutritionData, setNutritionData] = useState<NutritionResult | null>(() => {
        if (isViewMode && existingMeal) {
            return {
                title: existingMeal.name,
                description: existingMeal.description || '',
                takenAtISO: existingMeal.id,
                calories: existingMeal.calories,
                protein_g: existingMeal.macros.protein,
                carbs_g: existingMeal.macros.carbs,
                fat_g: existingMeal.macros.fat,
                fiber_g: existingMeal.macros.fiber || 0,
                healthScore_10: existingMeal.healthScore || 7,
                isFood: true,
            };
        }
        return null;
    });
    
    const [loading, setLoading] = useState(!isViewMode); // Don't load if viewing existing meal
    const [error, setError] = useState<string | null>(null);
    const [timestamp] = useState(() => {
        const date = existingMeal ? new Date(existingMeal.id) : new Date();
        // Use full day names for ResultScreen
        const weekdayKeys = ['day_full_sun', 'day_full_mon', 'day_full_tue', 'day_full_wed', 'day_full_thu', 'day_full_fri', 'day_full_sat'];
        const weekday = t(weekdayKeys[date.getDay()] as any);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${weekday} ${time}`;
    });
    
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
    
    // Ensure we have nutrition data before rendering
    if (!nutritionData) {
        return null; // Should never happen, but safety check
    }

    // Show error state (only for new meals that failed to analyze)
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
        if (isViewMode) {
            onBack?.();
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
            language: lang, // Save current language
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
            <main className="flex-1 flex flex-col px-4 pt-9 pb-24 overflow-y-auto">
                <section className="flex items-center gap-x-4 mb-5">
                    <img 
                        id="food-image" 
                        src={isViewMode ? existingMeal?.imageUrl : imageDataUrl} 
                        alt={nutritionData.title} 
                        className="w-[8.125rem] h-[8.125rem] rounded-full object-cover flex-shrink-0" 
                        style={{ border: '1px solid var(--stroke-non-opaque)' }}
                    />
                    {nutritionData.description && nutritionData.isFood && (
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
                    <span className="text-label-lg text-label-primary">{t('serving_amount')}</span>
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
                            <SvgIcon src={minusIcon} width="1.5rem" height="1.5rem" style={{ color: 'var(--label-primary)' }} />
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
                            <SvgIcon src={plusIcon} width="1.5rem" height="1.5rem" style={{ color: 'var(--label-primary)' }} />
                        </button>
                        <div></div>
                    </div>
                </section>
                
                <section className="nutrients-card rounded-[1.5rem] p-[1.25rem]" style={{
                    backgroundColor: 'var(--bg-elevation)',
                    border: '1px solid var(--stroke-non-opaque)'
                }}>
                    {/* Top Area */}
                    <div className={nutritionData.isFood ? "grid grid-cols-2 gap-x-[1.25rem]" : "flex justify-start"}>
                         <TopStat value={String(displayValues.calories)} label={t('calories_label')} icon={caloriesIconUrl} />
                         {nutritionData.isFood && <TopStat value={`${nutritionData.healthScore_10}/10`} label={t('benefit')} icon={healthIconUrl} />}
                    </div>
                    
                    {/* Divider */}
                    <div className="my-[1.25rem] h-px" style={{ display: 'block', width: '100%', backgroundColor: 'var(--stroke-non-opaque)' }}></div>

                    {/* Bottom Area */}
                    <div className="nutrient-grid grid grid-cols-2 gap-x-[1.25rem] gap-y-[1rem]">
                        <NutrientStat value={`${displayValues.protein}${t('gram')}`} label={t('protein_label')} icon={proteinIconUrl} />
                        <NutrientStat value={`${displayValues.carbs}${t('gram')}`} label={t('carbs_label')} icon={carbsIconUrl} />
                        <NutrientStat value={`${displayValues.fat}${t('gram')}`} label={t('fat_label')} icon={fatIconUrl} />
                        <NutrientStat value={`${displayValues.fiber}${t('gram')}`} label={t('fiber')} icon={fiberIconUrl} />
                    </div>
                </section>
                
            </main>
            
            {/* Fixed FAB Button - только для режима добавления блюда */}
            {!isViewMode && nutritionData.isFood && (
                <div className="fab-container">
                    <button
                        onClick={handleConfirm}
                        className="h-14 px-8 rounded-full flex items-center justify-center gap-x-2 shadow-1 transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6921]/50"
                        style={{ 
                            background: 'linear-gradient(103deg, #DFF2FF -23.02%, #FFC3FC 16.83%, #FF7F6E 61.18%, #FF6921 85.92%)',
                            transition: 'transform 150ms ease-out' 
                        }}
                    >
                        <SparklesIcon className="w-6 h-6 text-[var(--static-white)]" />
                        <span className="text-label-lg text-[var(--static-white)]">{t('done')}</span>
                    </button>
                </div>
            )}
            
            {!isViewMode && !nutritionData.isFood && (
                <div className="fab-container">
                    <button
                        onClick={onRetake}
                        className="h-14 px-8 rounded-full flex items-center justify-center gap-x-2 bg-[var(--bg-elevation)] border border-[var(--stroke-non-opaque)] shadow-1 transform active:scale-95 focus:outline-none"
                        style={{ transition: 'transform 150ms ease-out' }}
                    >
                        <span className="text-label-lg text-label-primary">{t('retake')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};