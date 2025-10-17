// AI 심리상담 시스템 데이터베이스 모델 타입 정의

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  birth_date?: Date;
  gender?: 'male' | 'female' | 'other';
  role: 'client' | 'counselor' | 'admin';
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  profile_image_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

export interface Counselor {
  id: number;
  user_id: number;
  license_number?: string;
  specialization: string[];
  experience_years?: number;
  education?: string;
  certifications: string[];
  bio?: string;
  hourly_rate?: number;
  availability_schedule: Record<string, any>;
  is_verified: boolean;
  verification_date?: Date;
  created_at: Date;
  updated_at: Date;
  user?: User;
}

export interface Client {
  id: number;
  user_id: number;
  counselor_id?: number;
  intake_date?: Date;
  status: 'active' | 'inactive' | 'completed' | 'at-risk';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  primary_concerns: string[];
  treatment_goals: string[];
  medical_history?: string;
  medication_history?: string;
  emergency_protocol: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  user?: User;
  counselor?: Counselor;
}

export interface AssessmentProgram {
  id: number;
  client_id: number;
  program_type: 'holistic-self-check' | 'focused-exploration' | 'strength-discovery' | 'counseling-blueprint';
  status: 'in-progress' | 'completed' | 'abandoned';
  started_at: Date;
  completed_at?: Date;
  total_questions: number;
  answered_questions: number;
  progress_percentage: number;
  created_at: Date;
  updated_at: Date;
  client?: Client;
}

export interface AssessmentQuestion {
  id: number;
  program_id: number;
  question_id: string;
  question_text: string;
  question_type: 'single' | 'multiple' | 'scale';
  category?: string;
  subcategory?: string;
  options?: Record<string, any>;
  scale_labels?: Record<string, any>;
  is_reverse: boolean;
  order_index?: number;
  created_at: Date;
}

export interface AssessmentAnswer {
  id: number;
  question_id: number;
  client_id: number;
  answer_value: number;
  answer_text?: string;
  answered_at: Date;
  question?: AssessmentQuestion;
}

export interface AssessmentResult {
  id: number;
  program_id: number;
  client_id: number;
  category: string;
  subcategory?: string;
  score: number;
  max_score: number;
  percentage: number;
  interpretation?: string;
  recommendations: string[];
  created_at: Date;
}

export interface CounselingSession {
  id: number;
  client_id: number;
  counselor_id?: number;
  session_date: Date;
  session_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  session_type: 'individual' | 'group' | 'family' | 'couple';
  modality: 'in-person' | 'online' | 'phone';
  notes?: string;
  goals: string[];
  homework?: string;
  next_session_date?: Date;
  created_at: Date;
  updated_at: Date;
  client?: Client;
  counselor?: Counselor;
}

export interface RiskSignal {
  id: number;
  client_id: number;
  signal_type: 'suicidal' | 'self-harm' | 'depression' | 'anxiety' | 'substance' | 'isolation' | 'aggression';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  message: string;
  evidence: Record<string, any>;
  source: 'ai-analysis' | 'manual-report' | 'pattern-detection';
  status: 'active' | 'investigating' | 'resolved' | 'false-positive';
  acknowledged_by?: number;
  acknowledged_at?: Date;
  resolved_at?: Date;
  resolution_notes?: string;
  created_at: Date;
  updated_at: Date;
  client?: Client;
  counselor?: Counselor;
}

export interface InterventionAction {
  id: number;
  risk_signal_id: number;
  counselor_id?: number;
  action_type: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  estimated_time?: string;
  required_resources: string[];
  success_criteria: string[];
  started_at?: Date;
  completed_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  risk_signal?: RiskSignal;
  counselor?: Counselor;
}

export interface CounselingGoal {
  id: number;
  client_id: number;
  counselor_id?: number;
  title: string;
  description: string;
  category?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'cancelled' | 'on-hold';
  estimated_sessions?: number;
  completed_sessions: number;
  target_date?: Date;
  success_criteria: string[];
  progress_notes?: string;
  created_at: Date;
  updated_at: Date;
  client?: Client;
  counselor?: Counselor;
}

export interface ProgressTracking {
  id: number;
  client_id: number;
  counselor_id?: number;
  session_id?: number;
  goal_id?: number;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  measurement_date: Date;
  notes?: string;
  created_at: Date;
  client?: Client;
  counselor?: Counselor;
  session?: CounselingSession;
  goal?: CounselingGoal;
}

export interface AiChatSession {
  id: number;
  client_id: number;
  session_type: 'general' | 'crisis' | 'follow-up';
  status: 'active' | 'completed' | 'escalated';
  started_at: Date;
  ended_at?: Date;
  total_messages: number;
  ai_model_version?: string;
  escalation_reason?: string;
  escalation_to?: number;
  created_at: Date;
  client?: Client;
  counselor?: Counselor;
}

export interface AiChatMessage {
  id: number;
  session_id: number;
  sender_type: 'client' | 'ai' | 'counselor';
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'assessment';
  metadata?: Record<string, any>;
  sent_at: Date;
  session?: AiChatSession;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: Record<string, any>;
  description?: string;
  category?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'risk_alert' | 'session_reminder' | 'goal_update' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'dismissed';
  related_entity_type?: string;
  related_entity_id?: number;
  read_at?: Date;
  created_at: Date;
  user?: User;
}

// 뷰 타입 정의
export interface ClientSummary {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  risk_level: string;
  intake_date?: Date;
  counselor_name?: string;
  total_sessions: number;
  completed_sessions: number;
  active_risk_signals: number;
  last_session_date?: Date;
  first_session_date?: Date;
}

export interface CounselorStats {
  id: number;
  name: string;
  email: string;
  total_clients: number;
  active_clients: number;
  total_sessions: number;
  completed_sessions: number;
  critical_alerts: number;
  avg_session_duration?: number;
}

// API 요청/응답 타입 정의
export interface CreateAssessmentProgramRequest {
  client_id: number;
  program_type: AssessmentProgram['program_type'];
}

export interface SubmitAssessmentAnswerRequest {
  question_id: number;
  client_id: number;
  answer_value: number;
  answer_text?: string;
}

export interface CreateRiskSignalRequest {
  client_id: number;
  signal_type: RiskSignal['signal_type'];
  severity: RiskSignal['severity'];
  confidence: number;
  message: string;
  evidence: Record<string, any>;
  source: RiskSignal['source'];
}

export interface CreateCounselingGoalRequest {
  client_id: number;
  counselor_id?: number;
  title: string;
  description: string;
  category?: string;
  priority: CounselingGoal['priority'];
  estimated_sessions?: number;
  target_date?: Date;
  success_criteria: string[];
}

export interface CreateCounselingSessionRequest {
  client_id: number;
  counselor_id?: number;
  session_date: Date;
  session_time: string;
  duration_minutes?: number;
  session_type?: CounselingSession['session_type'];
  modality?: CounselingSession['modality'];
  goals?: string[];
}

export interface SendAiChatMessageRequest {
  session_id: number;
  sender_type: AiChatMessage['sender_type'];
  message_text: string;
  message_type?: AiChatMessage['message_type'];
  metadata?: Record<string, any>;
}

// 통계 및 분석 타입 정의
export interface AssessmentAnalytics {
  program_type: string;
  total_completed: number;
  average_score: number;
  completion_rate: number;
  category_breakdown: Record<string, number>;
}

export interface RiskAnalytics {
  total_signals: number;
  signals_by_type: Record<string, number>;
  signals_by_severity: Record<string, number>;
  resolution_rate: number;
  average_resolution_time: number;
}

export interface SessionAnalytics {
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_show_rate: number;
  average_duration: number;
  sessions_by_type: Record<string, number>;
}

export interface ClientProgressAnalytics {
  client_id: number;
  total_goals: number;
  completed_goals: number;
  active_goals: number;
  progress_percentage: number;
  risk_trend: 'improving' | 'stable' | 'worsening';
  last_assessment_date?: Date;
  next_session_date?: Date;
}

// 검색 및 필터링 타입 정의
export interface ClientSearchFilters {
  status?: Client['status'];
  risk_level?: Client['risk_level'];
  counselor_id?: number;
  search_term?: string;
  intake_date_from?: Date;
  intake_date_to?: Date;
}

export interface RiskSignalFilters {
  severity?: RiskSignal['severity'];
  status?: RiskSignal['status'];
  signal_type?: RiskSignal['signal_type'];
  client_id?: number;
  date_from?: Date;
  date_to?: Date;
}

export interface SessionFilters {
  status?: CounselingSession['status'];
  session_type?: CounselingSession['session_type'];
  modality?: CounselingSession['modality'];
  client_id?: number;
  counselor_id?: number;
  date_from?: Date;
  date_to?: Date;
}

// 대시보드 데이터 타입 정의
export interface DashboardOverview {
  total_clients: number;
  active_clients: number;
  total_counselors: number;
  active_sessions_today: number;
  critical_alerts: number;
  completed_assessments: number;
  recent_activities: ActivityLog[];
}

export interface ActivityLog {
  id: number;
  type: string;
  description: string;
  timestamp: Date;
  user_id?: number;
  entity_type?: string;
  entity_id?: number;
}

export interface CounselorDashboard {
  counselor_id: number;
  total_clients: number;
  active_clients: number;
  sessions_this_week: number;
  upcoming_sessions: CounselingSession[];
  recent_risk_signals: RiskSignal[];
  client_progress_summary: ClientProgressAnalytics[];
}

// AI 모델 관련 타입 정의
export interface AiModelConfig {
  model_version: string;
  risk_detection_thresholds: Record<string, number>;
  assessment_scoring_weights: Record<string, number>;
  chat_response_settings: Record<string, any>;
  escalation_criteria: Record<string, any>;
}

export interface AiAnalysisResult {
  analysis_type: string;
  confidence: number;
  findings: Record<string, any>;
  recommendations: string[];
  risk_indicators: string[];
  next_steps: string[];
}
