-- AI 심리상담 시스템 데이터베이스 스키마
-- 이 스키마는 AI 심리상담 시스템의 모든 데이터를 관리합니다.

-- 사용자 테이블 (기존 users 테이블 확장)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    role VARCHAR(20) DEFAULT 'client', -- 'client', 'counselor', 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50)
);

-- 상담사 테이블
CREATE TABLE IF NOT EXISTS counselors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100),
    specialization TEXT[], -- 전문 분야 배열
    experience_years INTEGER,
    education TEXT,
    certifications TEXT[],
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    availability_schedule JSONB, -- 가용 시간 스케줄
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 내담자 테이블
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    counselor_id INTEGER REFERENCES counselors(id),
    intake_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'completed', 'at-risk'
    risk_level VARCHAR(10) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    primary_concerns TEXT[],
    treatment_goals TEXT[],
    medical_history TEXT,
    medication_history TEXT,
    emergency_protocol JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4단계 심리검사 프로그램 테이블
CREATE TABLE IF NOT EXISTS assessment_programs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    program_type VARCHAR(50) NOT NULL, -- 'holistic-self-check', 'focused-exploration', 'strength-discovery', 'counseling-blueprint'
    status VARCHAR(20) DEFAULT 'in-progress', -- 'in-progress', 'completed', 'abandoned'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_questions INTEGER,
    answered_questions INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 심리검사 질문 테이블
CREATE TABLE IF NOT EXISTS assessment_questions (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES assessment_programs(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL, -- 프로그램 내에서의 질문 ID
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- 'single', 'multiple', 'scale'
    category VARCHAR(50),
    subcategory VARCHAR(50),
    options JSONB, -- 선택지 (단일/다중 선택용)
    scale_labels JSONB, -- 척도 라벨 (척도형 질문용)
    is_reverse BOOLEAN DEFAULT false, -- 역코딩 여부
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 심리검사 답변 테이블
CREATE TABLE IF NOT EXISTS assessment_answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES assessment_questions(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    answer_value INTEGER NOT NULL, -- 1-5 척도 또는 선택지 번호
    answer_text TEXT, -- 텍스트 답변 (필요시)
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, client_id)
);

-- 심리검사 결과 테이블
CREATE TABLE IF NOT EXISTS assessment_results (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES assessment_programs(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    interpretation TEXT,
    recommendations TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 상담 세션 테이블
CREATE TABLE IF NOT EXISTS counseling_sessions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    counselor_id INTEGER REFERENCES counselors(id),
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no-show'
    session_type VARCHAR(30) DEFAULT 'individual', -- 'individual', 'group', 'family', 'couple'
    modality VARCHAR(20) DEFAULT 'in-person', -- 'in-person', 'online', 'phone'
    notes TEXT,
    goals TEXT[],
    homework TEXT,
    next_session_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 위험신호 테이블
CREATE TABLE IF NOT EXISTS risk_signals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    signal_type VARCHAR(30) NOT NULL, -- 'suicidal', 'self-harm', 'depression', 'anxiety', 'substance', 'isolation', 'aggression'
    severity VARCHAR(10) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    confidence DECIMAL(5,2) NOT NULL, -- AI 신뢰도 (0-100)
    message TEXT NOT NULL,
    evidence JSONB NOT NULL, -- 증거 데이터
    source VARCHAR(20) NOT NULL, -- 'ai-analysis', 'manual-report', 'pattern-detection'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'investigating', 'resolved', 'false-positive'
    acknowledged_by INTEGER REFERENCES counselors(id),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 위험 개입 액션 테이블
CREATE TABLE IF NOT EXISTS intervention_actions (
    id SERIAL PRIMARY KEY,
    risk_signal_id INTEGER REFERENCES risk_signals(id) ON DELETE CASCADE,
    counselor_id INTEGER REFERENCES counselors(id),
    action_type VARCHAR(20) NOT NULL, -- 'immediate', 'short-term', 'long-term'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL, -- 'high', 'medium', 'low'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'cancelled'
    estimated_time VARCHAR(50),
    required_resources TEXT[],
    success_criteria TEXT[],
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 상담 목표 테이블
CREATE TABLE IF NOT EXISTS counseling_goals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    counselor_id INTEGER REFERENCES counselors(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    priority VARCHAR(10) NOT NULL, -- 'high', 'medium', 'low'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'on-hold'
    estimated_sessions INTEGER,
    completed_sessions INTEGER DEFAULT 0,
    target_date DATE,
    success_criteria TEXT[],
    progress_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 상담 진행 상황 테이블
CREATE TABLE IF NOT EXISTS progress_tracking (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    counselor_id INTEGER REFERENCES counselors(id),
    session_id INTEGER REFERENCES counseling_sessions(id),
    goal_id INTEGER REFERENCES counseling_goals(id),
    metric_name VARCHAR(100) NOT NULL, -- 측정 지표명
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(20),
    measurement_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 채팅 상담 테이블
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    session_type VARCHAR(30) DEFAULT 'general', -- 'general', 'crisis', 'follow-up'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'escalated'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    total_messages INTEGER DEFAULT 0,
    ai_model_version VARCHAR(50),
    escalation_reason TEXT,
    escalation_to INTEGER REFERENCES counselors(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL, -- 'client', 'ai', 'counselor'
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'assessment'
    metadata JSONB, -- 추가 메타데이터
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- 'risk_alert', 'session_reminder', 'goal_update', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'dismissed'
    related_entity_type VARCHAR(50), -- 관련 엔티티 타입
    related_entity_id INTEGER, -- 관련 엔티티 ID
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clients_counselor_id ON clients(counselor_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_risk_level ON clients(risk_level);
CREATE INDEX IF NOT EXISTS idx_assessment_programs_client_id ON assessment_programs(client_id);
CREATE INDEX IF NOT EXISTS idx_assessment_programs_status ON assessment_programs(status);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_client_id ON assessment_answers(client_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_client_id ON assessment_results(client_id);
CREATE INDEX IF NOT EXISTS idx_counseling_sessions_client_id ON counseling_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_counseling_sessions_counselor_id ON counseling_sessions(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counseling_sessions_date ON counseling_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_risk_signals_client_id ON risk_signals(client_id);
CREATE INDEX IF NOT EXISTS idx_risk_signals_severity ON risk_signals(severity);
CREATE INDEX IF NOT EXISTS idx_risk_signals_status ON risk_signals(status);
CREATE INDEX IF NOT EXISTS idx_risk_signals_created_at ON risk_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_intervention_actions_risk_signal_id ON intervention_actions(risk_signal_id);
CREATE INDEX IF NOT EXISTS idx_counseling_goals_client_id ON counseling_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_client_id ON progress_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_client_id ON ai_chat_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counselors_updated_at BEFORE UPDATE ON counselors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessment_programs_updated_at BEFORE UPDATE ON assessment_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counseling_sessions_updated_at BEFORE UPDATE ON counseling_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_signals_updated_at BEFORE UPDATE ON risk_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intervention_actions_updated_at BEFORE UPDATE ON intervention_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counseling_goals_updated_at BEFORE UPDATE ON counseling_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 뷰 생성: 내담자 요약 정보
CREATE OR REPLACE VIEW client_summary AS
SELECT 
    c.id,
    u.name,
    u.email,
    u.phone,
    c.status,
    c.risk_level,
    c.intake_date,
    co.name as counselor_name,
    COUNT(cs.id) as total_sessions,
    COUNT(CASE WHEN cs.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN rs.status = 'active' THEN 1 END) as active_risk_signals,
    MAX(cs.session_date) as last_session_date,
    MIN(cs.session_date) as first_session_date
FROM clients c
JOIN users u ON c.user_id = u.id
LEFT JOIN counselors co ON c.counselor_id = co.id
LEFT JOIN users cou ON co.user_id = cou.id
LEFT JOIN counseling_sessions cs ON c.id = cs.client_id
LEFT JOIN risk_signals rs ON c.id = rs.client_id
GROUP BY c.id, u.name, u.email, u.phone, c.status, c.risk_level, c.intake_date, co.name;

-- 뷰 생성: 상담사 통계
CREATE OR REPLACE VIEW counselor_stats AS
SELECT 
    co.id,
    u.name,
    u.email,
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_clients,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN cs.status = 'completed' THEN cs.id END) as completed_sessions,
    COUNT(DISTINCT CASE WHEN rs.severity = 'critical' AND rs.status = 'active' THEN rs.id END) as critical_alerts,
    AVG(CASE WHEN cs.status = 'completed' THEN cs.duration_minutes END) as avg_session_duration
FROM counselors co
JOIN users u ON co.user_id = u.id
LEFT JOIN clients c ON co.id = c.counselor_id
LEFT JOIN counseling_sessions cs ON co.id = cs.counselor_id
LEFT JOIN risk_signals rs ON c.id = rs.client_id
GROUP BY co.id, u.name, u.email;

-- 초기 시스템 설정 데이터
INSERT INTO system_settings (setting_key, setting_value, description, category, is_public) VALUES
('ai_model_version', '"1.0.0"', '현재 사용 중인 AI 모델 버전', 'ai', true),
('risk_detection_threshold', '{"depression": 70, "anxiety": 65, "suicidal": 80, "self_harm": 75}', '위험신호 감지 임계값', 'risk', false),
('session_duration_default', '50', '기본 상담 세션 시간 (분)', 'session', true),
('assessment_question_count', '{"holistic": 25, "focused": 16, "strength": 32, "blueprint": 0}', '각 프로그램별 질문 수', 'assessment', true),
('notification_retention_days', '30', '알림 보관 기간 (일)', 'system', false),
('data_retention_years', '7', '데이터 보관 기간 (년)', 'system', false)
ON CONFLICT (setting_key) DO NOTHING;
