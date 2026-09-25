import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { WorkflowSection } from '@/components/landing/WorkflowSection';
import { ImpactPreview } from '@/components/landing/ImpactPreview';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <ProblemSection />
      <WorkflowSection />
      <ImpactPreview />
    </div>
  );
}
