
import { AnalysisClient } from "./analysis-client";

export default function AnalysisPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">매매 기록 분석</h1>
      <AnalysisClient />
    </div>
  );
}
