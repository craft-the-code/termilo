import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { WelcomeScreen } from './WelcomeScreen';
import { FeatureHighlights } from './FeatureHighlights';
// Would eventually include ImportScreen as step 3

export function OnboardingFlow() {
    const [step, setStep] = useState<number>(0);
    const { completeOnboarding } = useUIStore();

    const handleNext = () => {
        if (step < 1) { // Only 2 steps for now: Welcome(0) -> Features(1) -> Done
            setStep(step + 1);
        } else {
            completeOnboarding();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    if (step === 0) {
        return <WelcomeScreen onNext={handleNext} onSkip={handleSkip} />;
    }

    if (step === 1) {
        return <FeatureHighlights onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />;
    }

    return null;
}
