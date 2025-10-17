// AI 심리상담 시스템 데이터베이스 연결 및 쿼리 함수들

import { Pool, PoolClient } from 'pg';
import '@types/pg';
import {
  User, Counselor, Client, AssessmentProgram, AssessmentQuestion, AssessmentAnswer,
  AssessmentResult, CounselingSession, RiskSignal, InterventionAction, CounselingGoal,
  ProgressTracking, AiChatSession, AiChatMessage, SystemSetting, Notification,
  ClientSummary, CounselorStats, CreateAssessmentProgramRequest, SubmitAssessmentAnswerRequest,
  CreateRiskSignalRequest, CreateCounselingGoalRequest, CreateCounselingSessionRequest,
  SendAiChatMessageRequest, ClientSearchFilters, RiskSignalFilters, SessionFilters,
  DashboardOverview, CounselorDashboard, AiModelConfig
} from '@/types/ai-counseling';

// 데이터베이스 연결 풀 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 데이터베이스 연결 테스트
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 사용자 관련 쿼리
export class UserService {
  static async createUser(userData: Partial<User>): Promise<User> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO users (email, name, phone, birth_date, gender, role, profile_image_url, 
                          emergency_contact_name, emergency_contact_phone, emergency_contact_relation)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const values = [
        userData.email, userData.name, userData.phone, userData.birth_date,
        userData.gender, userData.role || 'client', userData.profile_image_url,
        userData.emergency_contact_name, userData.emergency_contact_phone, userData.emergency_contact_relation
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getUserById(id: number): Promise<User | null> {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await client.query(query, [email]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const client = await pool.connect();
    try {
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fields.map(field => updates[field as keyof User])];
      
      const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`;
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

// 상담사 관련 쿼리
export class CounselorService {
  static async createCounselor(counselorData: Partial<Counselor>): Promise<Counselor> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO counselors (user_id, license_number, specialization, experience_years, 
                               education, certifications, bio, hourly_rate, availability_schedule)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [
        counselorData.user_id, counselorData.license_number, counselorData.specialization,
        counselorData.experience_years, counselorData.education, counselorData.certifications,
        counselorData.bio, counselorData.hourly_rate, counselorData.availability_schedule
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getCounselorById(id: number): Promise<Counselor | null> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT c.*, u.name, u.email, u.phone
        FROM counselors c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `;
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async getCounselorStats(counselorId: number): Promise<CounselorStats | null> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM counselor_stats WHERE id = $1
      `;
      const result = await client.query(query, [counselorId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
}

// 내담자 관련 쿼리
export class ClientService {
  static async createClient(clientData: Partial<Client>): Promise<Client> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO clients (user_id, counselor_id, intake_date, status, risk_level, 
                            primary_concerns, treatment_goals, medical_history, 
                            medication_history, emergency_protocol)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const values = [
        clientData.user_id, clientData.counselor_id, clientData.intake_date,
        clientData.status || 'active', clientData.risk_level || 'low',
        clientData.primary_concerns || [], clientData.treatment_goals || [],
        clientData.medical_history, clientData.medication_history, clientData.emergency_protocol || {}
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getClientById(id: number): Promise<Client | null> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT c.*, u.name, u.email, u.phone, u.birth_date, u.gender,
               co.name as counselor_name, co.email as counselor_email
        FROM clients c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN counselors co ON c.counselor_id = co.id
        LEFT JOIN users cou ON co.user_id = cou.id
        WHERE c.id = $1
      `;
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async getClientsByCounselor(counselorId: number, filters?: ClientSearchFilters): Promise<Client[]> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT c.*, u.name, u.email, u.phone, u.birth_date, u.gender
        FROM clients c
        JOIN users u ON c.user_id = u.id
        WHERE c.counselor_id = $1
      `;
      const values: (string | number)[] = [counselorId];
      let paramIndex = 2;

      if (filters?.status) {
        query += ` AND c.status = $${paramIndex}`;
        values.push(filters.status as string);
        paramIndex++;
      }

      if (filters?.risk_level) {
        query += ` AND c.risk_level = $${paramIndex}`;
        values.push(filters.risk_level as string);
        paramIndex++;
      }

      if (filters?.search_term) {
        query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        values.push(`%${filters.search_term}%`);
        paramIndex++;
      }

      query += ' ORDER BY c.created_at DESC';
      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async getClientSummary(id: number): Promise<ClientSummary | null> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM client_summary WHERE id = $1
      `;
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
}

// 심리검사 프로그램 관련 쿼리
export class AssessmentService {
  static async createAssessmentProgram(data: CreateAssessmentProgramRequest): Promise<AssessmentProgram> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO assessment_programs (client_id, program_type, total_questions)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const values = [data.client_id, data.program_type, 0]; // total_questions는 나중에 업데이트
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getAssessmentProgram(id: number): Promise<AssessmentProgram | null> {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM assessment_programs WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async getAssessmentQuestions(programId: number): Promise<AssessmentQuestion[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM assessment_questions 
        WHERE program_id = $1 
        ORDER BY order_index ASC
      `;
      const result = await client.query(query, [programId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async submitAnswer(data: SubmitAssessmentAnswerRequest): Promise<AssessmentAnswer> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO assessment_answers (question_id, client_id, answer_value, answer_text)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (question_id, client_id) 
        DO UPDATE SET answer_value = $3, answer_text = $4, answered_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const values = [data.question_id, data.client_id, data.answer_value, data.answer_text];
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getAssessmentResults(programId: number): Promise<AssessmentResult[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM assessment_results 
        WHERE program_id = $1 
        ORDER BY category, subcategory
      `;
      const result = await client.query(query, [programId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async calculateAssessmentResults(programId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 프로그램 정보 가져오기
      const programResult = await client.query('SELECT * FROM assessment_programs WHERE id = $1', [programId]);
      const program = programResult.rows[0];
      
      if (!program) {
        throw new Error('Assessment program not found');
      }

      // 질문과 답변 가져오기
      const questionsResult = await client.query(`
        SELECT aq.*, aa.answer_value
        FROM assessment_questions aq
        LEFT JOIN assessment_answers aa ON aq.id = aa.question_id AND aa.client_id = $1
        WHERE aq.program_id = $2
        ORDER BY aq.category, aq.subcategory, aq.order_index
      `, [program.client_id, programId]);

      // 카테고리별 점수 계산
      const categoryScores: Record<string, { total: number; count: number; maxScore: number }> = {};
      
      questionsResult.rows.forEach((row: any) => {
        if (row.answer_value !== null) {
          const category = row.category || 'default';
          const score = row.is_reverse ? (6 - row.answer_value) : row.answer_value;
          
          if (!categoryScores[category]) {
            categoryScores[category] = { total: 0, count: 0, maxScore: 0 };
          }
          
          categoryScores[category].total += score;
          categoryScores[category].count += 1;
          categoryScores[category].maxScore += 5; // 최대 점수는 5
        }
      });

      // 결과 저장
      for (const [category, scores] of Object.entries(categoryScores)) {
        const percentage = (scores.total / scores.maxScore) * 100;
        
        await client.query(`
          INSERT INTO assessment_results (program_id, client_id, category, score, max_score, percentage)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (program_id, category) 
          DO UPDATE SET score = $4, max_score = $5, percentage = $6
        `, [programId, program.client_id, category, scores.total, scores.maxScore, percentage]);
      }

      // 프로그램 완료 상태 업데이트
      await client.query(`
        UPDATE assessment_programs 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP, 
            answered_questions = $2, progress_percentage = 100
        WHERE id = $1
      `, [programId, questionsResult.rows.length]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// 위험신호 관련 쿼리
export class RiskSignalService {
  static async createRiskSignal(data: CreateRiskSignalRequest): Promise<RiskSignal> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO risk_signals (client_id, signal_type, severity, confidence, message, evidence, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [
        data.client_id, data.signal_type, data.severity, data.confidence,
        data.message, JSON.stringify(data.evidence), data.source
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getRiskSignals(filters?: RiskSignalFilters): Promise<RiskSignal[]> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT rs.*, c.user_id, u.name as client_name, u.email as client_email
        FROM risk_signals rs
        JOIN clients c ON rs.client_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.severity) {
        query += ` AND rs.severity = $${paramIndex}`;
        values.push(filters.severity);
        paramIndex++;
      }

      if (filters?.status) {
        query += ` AND rs.status = $${paramIndex}`;
        values.push(filters.status);
        paramIndex++;
      }

      if (filters?.signal_type) {
        query += ` AND rs.signal_type = $${paramIndex}`;
        values.push(filters.signal_type);
        paramIndex++;
      }

      if (filters?.client_id) {
        query += ` AND rs.client_id = $${paramIndex}`;
        values.push(filters.client_id);
        paramIndex++;
      }

      query += ' ORDER BY rs.created_at DESC';
      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async acknowledgeRiskSignal(signalId: number, counselorId: number): Promise<RiskSignal> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE risk_signals 
        SET acknowledged_by = $2, acknowledged_at = CURRENT_TIMESTAMP, status = 'investigating'
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [signalId, counselorId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async resolveRiskSignal(signalId: number, resolutionNotes?: string): Promise<RiskSignal> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE risk_signals 
        SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolution_notes = $2
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [signalId, resolutionNotes]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

// 상담 세션 관련 쿼리
export class SessionService {
  static async createSession(data: CreateCounselingSessionRequest): Promise<CounselingSession> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO counseling_sessions (client_id, counselor_id, session_date, session_time, 
                                        duration_minutes, session_type, modality, goals)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const values = [
        data.client_id, data.counselor_id, data.session_date, data.session_time,
        data.duration_minutes || 50, data.session_type || 'individual',
        data.modality || 'in-person', data.goals || []
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getSessions(filters?: SessionFilters): Promise<CounselingSession[]> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT cs.*, c.user_id, u.name as client_name, u.email as client_email,
               co.name as counselor_name, co.email as counselor_email
        FROM counseling_sessions cs
        JOIN clients c ON cs.client_id = c.id
        JOIN users u ON c.user_id = u.id
        LEFT JOIN counselors co ON cs.counselor_id = co.id
        LEFT JOIN users cou ON co.user_id = cou.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        query += ` AND cs.status = $${paramIndex}`;
        values.push(filters.status);
        paramIndex++;
      }

      if (filters?.client_id) {
        query += ` AND cs.client_id = $${paramIndex}`;
        values.push(filters.client_id);
        paramIndex++;
      }

      if (filters?.counselor_id) {
        query += ` AND cs.counselor_id = $${paramIndex}`;
        values.push(filters.counselor_id);
        paramIndex++;
      }

      query += ' ORDER BY cs.session_date DESC, cs.session_time DESC';
      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async updateSessionStatus(sessionId: number, status: string, notes?: string): Promise<CounselingSession> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE counseling_sessions 
        SET status = $2, notes = $3
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [sessionId, status, notes]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

// 상담 목표 관련 쿼리
export class GoalService {
  static async createGoal(data: CreateCounselingGoalRequest): Promise<CounselingGoal> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO counseling_goals (client_id, counselor_id, title, description, category, 
                                      priority, estimated_sessions, target_date, success_criteria)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [
        data.client_id, data.counselor_id, data.title, data.description, data.category,
        data.priority, data.estimated_sessions, data.target_date, data.success_criteria
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getGoalsByClient(clientId: number): Promise<CounselingGoal[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT cg.*, co.name as counselor_name
        FROM counseling_goals cg
        LEFT JOIN counselors co ON cg.counselor_id = co.id
        LEFT JOIN users cou ON co.user_id = cou.id
        WHERE cg.client_id = $1
        ORDER BY cg.priority DESC, cg.created_at DESC
      `;
      const result = await client.query(query, [clientId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async updateGoalProgress(goalId: number, completedSessions: number, progressNotes?: string): Promise<CounselingGoal> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE counseling_goals 
        SET completed_sessions = $2, progress_notes = $3,
            status = CASE 
              WHEN $2 >= estimated_sessions THEN 'completed'
              ELSE status
            END
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [goalId, completedSessions, progressNotes]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

// AI 채팅 관련 쿼리
export class AiChatService {
  static async createChatSession(clientId: number, sessionType: string = 'general'): Promise<AiChatSession> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO ai_chat_sessions (client_id, session_type)
        VALUES ($1, $2)
        RETURNING *
      `;
      const result = await client.query(query, [clientId, sessionType]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async sendMessage(data: SendAiChatMessageRequest): Promise<AiChatMessage> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const messageQuery = `
        INSERT INTO ai_chat_messages (session_id, sender_type, message_text, message_type, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const messageValues = [
        data.session_id, data.sender_type, data.message_text,
        data.message_type || 'text', JSON.stringify(data.metadata || {})
      ];
      const messageResult = await client.query(messageQuery, messageValues);
      
      // 세션의 총 메시지 수 업데이트
      await client.query(`
        UPDATE ai_chat_sessions 
        SET total_messages = total_messages + 1
        WHERE id = $1
      `, [data.session_id]);
      
      await client.query('COMMIT');
      return messageResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getChatMessages(sessionId: number): Promise<AiChatMessage[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM ai_chat_messages 
        WHERE session_id = $1 
        ORDER BY sent_at ASC
      `;
      const result = await client.query(query, [sessionId]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

// 대시보드 관련 쿼리
export class DashboardService {
  static async getOverview(): Promise<DashboardOverview> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
          (SELECT COUNT(*) FROM clients) as total_clients,
          (SELECT COUNT(*) FROM counselors WHERE is_verified = true) as total_counselors,
          (SELECT COUNT(*) FROM counseling_sessions WHERE session_date = CURRENT_DATE) as active_sessions_today,
          (SELECT COUNT(*) FROM risk_signals WHERE severity = 'critical' AND status = 'active') as critical_alerts,
          (SELECT COUNT(*) FROM assessment_programs WHERE status = 'completed') as completed_assessments
      `;
      const result = await client.query(query);
      const stats = result.rows[0];
      
      // 최근 활동 가져오기
      const activitiesQuery = `
        SELECT 
          'session' as type,
          '상담 세션 완료' as description,
          cs.updated_at as timestamp,
          cs.counselor_id as user_id,
          'counseling_sessions' as entity_type,
          cs.id as entity_id
        FROM counseling_sessions cs
        WHERE cs.status = 'completed' AND cs.updated_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION ALL
        SELECT 
          'risk' as type,
          '위험신호 감지' as description,
          rs.created_at as timestamp,
          rs.acknowledged_by as user_id,
          'risk_signals' as entity_type,
          rs.id as entity_id
        FROM risk_signals rs
        WHERE rs.created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY timestamp DESC
        LIMIT 10
      `;
      const activitiesResult = await client.query(activitiesQuery);
      
      return {
        total_clients: parseInt(stats.total_clients),
        active_clients: parseInt(stats.active_clients),
        total_counselors: parseInt(stats.total_counselors),
        active_sessions_today: parseInt(stats.active_sessions_today),
        critical_alerts: parseInt(stats.critical_alerts),
        completed_assessments: parseInt(stats.completed_assessments),
        recent_activities: activitiesResult.rows
      };
    } finally {
      client.release();
    }
  }

  static async getCounselorDashboard(counselorId: number): Promise<CounselorDashboard> {
    const client = await pool.connect();
    try {
      // 상담사 통계
      const statsQuery = `
        SELECT * FROM counselor_stats WHERE id = $1
      `;
      const statsResult = await client.query(statsQuery, [counselorId]);
      const stats = statsResult.rows[0];
      
      // 다가오는 상담 세션
      const upcomingQuery = `
        SELECT cs.*, c.user_id, u.name as client_name, u.email as client_email
        FROM counseling_sessions cs
        JOIN clients c ON cs.client_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE cs.counselor_id = $1 AND cs.session_date >= CURRENT_DATE
        ORDER BY cs.session_date ASC, cs.session_time ASC
        LIMIT 5
      `;
      const upcomingResult = await client.query(upcomingQuery, [counselorId]);
      
      // 최근 위험신호
      const riskQuery = `
        SELECT rs.*, c.user_id, u.name as client_name
        FROM risk_signals rs
        JOIN clients c ON rs.client_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE c.counselor_id = $1 AND rs.created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY rs.created_at DESC
        LIMIT 5
      `;
      const riskResult = await client.query(riskQuery, [counselorId]);
      
      return {
        counselor_id: counselorId,
        total_clients: stats?.total_clients || 0,
        active_clients: stats?.active_clients || 0,
        sessions_this_week: stats?.total_sessions || 0,
        upcoming_sessions: upcomingResult.rows,
        recent_risk_signals: riskResult.rows,
        client_progress_summary: [] // TODO: 구현 필요
      };
    } finally {
      client.release();
    }
  }
}

// 시스템 설정 관련 쿼리
export class SystemService {
  static async getSetting(key: string): Promise<any> {
    const client = await pool.connect();
    try {
      const query = 'SELECT setting_value FROM system_settings WHERE setting_key = $1';
      const result = await client.query(query, [key]);
      return result.rows[0]?.setting_value || null;
    } finally {
      client.release();
    }
  }

  static async setSetting(key: string, value: any, description?: string): Promise<void> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO system_settings (setting_key, setting_value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, description = $3, updated_at = CURRENT_TIMESTAMP
      `;
      await client.query(query, [key, JSON.stringify(value), description]);
    } finally {
      client.release();
    }
  }

  static async getAiModelConfig(): Promise<AiModelConfig> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT setting_key, setting_value 
        FROM system_settings 
        WHERE setting_key IN ('ai_model_version', 'risk_detection_thresholds', 'assessment_scoring_weights', 'chat_response_settings', 'escalation_criteria')
      `;
      const result = await client.query(query);
      
      const config: AiModelConfig = {
        model_version: '1.0.0',
        risk_detection_thresholds: {},
        assessment_scoring_weights: {},
        chat_response_settings: {},
        escalation_criteria: {}
      };
      
      result.rows.forEach((row: any) => {
        const value = JSON.parse(row.setting_value);
        switch (row.setting_key) {
          case 'ai_model_version':
            config.model_version = value;
            break;
          case 'risk_detection_thresholds':
            config.risk_detection_thresholds = value;
            break;
          case 'assessment_scoring_weights':
            config.assessment_scoring_weights = value;
            break;
          case 'chat_response_settings':
            config.chat_response_settings = value;
            break;
          case 'escalation_criteria':
            config.escalation_criteria = value;
            break;
        }
      });
      
      return config;
    } finally {
      client.release();
    }
  }
}

// 알림 관련 쿼리
export class NotificationService {
  static async createNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    priority: string = 'medium',
    relatedEntityType?: string,
    relatedEntityId?: number
  ): Promise<Notification> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO notifications (user_id, type, title, message, priority, related_entity_type, related_entity_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [userId, type, title, message, priority, relatedEntityType, relatedEntityId];
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      const result = await client.query(query, [userId, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async markAsRead(notificationId: number): Promise<Notification> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [notificationId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

export default {
  testConnection,
  UserService,
  CounselorService,
  ClientService,
  AssessmentService,
  RiskSignalService,
  SessionService,
  GoalService,
  AiChatService,
  DashboardService,
  SystemService,
  NotificationService
};
