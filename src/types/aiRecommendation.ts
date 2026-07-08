export type TestRecommendationPriority = 'high' | 'medium' | 'low';

export type TestRecommendationItem = {
  testId: string;
  name: string;
  rationale: string;
  priority: TestRecommendationPriority;
};

export type RecommendTestsFromResultRequest = {
  resultId: string;
  availableTests: { testId: string; name: string }[];
  forceRegenerate?: boolean;
};

export type RecommendTestsFromResultResponse = {
  reportId: string;
  summary: string;
  recommendations: TestRecommendationItem[];
  portalId: string | null;
  cached: boolean;
  creditsCharged: number;
  modelId: string | null;
};
