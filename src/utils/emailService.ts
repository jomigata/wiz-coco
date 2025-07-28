import nodemailer from 'nodemailer';

// 환경 변수 상수
const POSTMARK_SERVER_TOKEN = process.env.POSTMARK_SERVER_TOKEN;
const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || 'mbti@okmbti.com'; // verified된 이메일 사용

// 환경 변수 검증 함수
function validateEmailConfig() {
  const postmarkToken = POSTMARK_SERVER_TOKEN;
  const fromEmail = POSTMARK_FROM_EMAIL;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  console.log('🔍 [Email Config] 환경 변수 검증 시작');
  console.log('🔍 [Email Config] POSTMARK_SERVER_TOKEN:', postmarkToken ? `설정됨 (${postmarkToken.substring(0, 8)}...)` : '❌ 미설정');
  console.log('🔍 [Email Config] POSTMARK_FROM_EMAIL:', fromEmail);
  console.log('🔍 [Email Config] NEXT_PUBLIC_BASE_URL:', baseUrl || '미설정 (localhost 사용)');
  
  return {
    hasToken: !!postmarkToken,
    token: postmarkToken,
    fromEmail: fromEmail,
    baseUrl: baseUrl || 'http://localhost:3000'
  };
}

// Postmark API 연결 테스트 (상세 정보 포함)
export async function testPostmarkConnection(): Promise<{ success: boolean; details: any }> {
  try {
    console.log('🔍 Postmark 연결 테스트 시작...');
    
    const token = POSTMARK_SERVER_TOKEN;
    if (!token) {
      return {
        success: false,
        details: { error: 'POSTMARK_SERVER_TOKEN이 설정되지 않았습니다.' }
      };
    }

    const response = await fetch('https://api.postmarkapp.com/server', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Postmark-Server-Token': token
      }
    });
    
    console.log('🌐 Postmark API 응답 상태:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Postmark 연결 성공!');
      console.log('📋 서버 정보:', {
        이름: data.Name,
        ID: data.ID,
        상태: data.State,
        색상: data.Color
      });
      return { success: true, details: data };
    } else {
      const errorText = await response.text();
      console.error('❌ Postmark 연결 실패:', response.status, errorText);
      return { success: false, details: { status: response.status, error: errorText } };
    }
  } catch (error) {
    console.error('❌ Postmark 연결 테스트 중 오류:', error);
    return { success: false, details: { error: String(error) } };
  }
}

// Postmark 이메일 발송 함수 (상세 로깅 포함)
export async function sendEmail(to: string, subject: string, htmlBody: string) {
  console.log('📧 [Email Service] 이메일 발송 시작');
  console.log('📧 [Email Service] 수신자:', to);
  console.log('📧 [Email Service] 제목:', subject);
  
  const config = validateEmailConfig();
  
  if (!config.hasToken) {
    const errorMsg = '❌ POSTMARK_SERVER_TOKEN이 설정되지 않았습니다. 환경 변수를 확인해주세요.';
    console.error('[Email Service]', errorMsg);
    throw new Error(errorMsg);
  }
  
  try {
    console.log('🚀 [Email Service] Postmark API 호출 시작');
    
    // 토큰 재검증
    if (!config.token) {
      throw new Error('POSTMARK_SERVER_TOKEN이 없습니다.');
    }
    
    const requestBody = {
      From: config.fromEmail, // verified된 이메일 사용
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: htmlBody.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      MessageStream: 'outbound'
    };
    
    console.log('📄 [Email Service] 요청 데이터:', {
      From: requestBody.From,
      To: requestBody.To,
      Subject: requestBody.Subject,
      MessageStream: requestBody.MessageStream,
      HtmlBodyLength: requestBody.HtmlBody.length,
      TextBodyLength: requestBody.TextBody.length,
      Token: config.token.substring(0, 8) + '...'
    });
    
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': config.token
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📬 [Email Service] Postmark API 응답 상태:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [Email Service] Postmark API 오류 상세:', {
        status: response.status,
        statusText: response.statusText,
        errorCode: errorData.ErrorCode,
        message: errorData.Message,
        fullError: errorData
      });
      
      // 구체적인 오류 메시지 제공
      let errorMessage = `이메일 발송 실패 (${response.status})`;
      if (errorData.ErrorCode) {
        errorMessage += ` - ${errorData.ErrorCode}: ${errorData.Message}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ [Email Service] Postmark 이메일 발송 성공!', {
      MessageID: result.MessageID,
      SubmittedAt: result.SubmittedAt,
      To: result.To,
      ErrorCode: result.ErrorCode || 'None'
    });
    
    return {
      success: true,
      messageId: result.MessageID,
      submittedAt: result.SubmittedAt
    };
  } catch (error) {
    console.error('❌ [Email Service] 이메일 발송 실패:', error);
    
    // 네트워크 오류인지 API 오류인지 구분
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('네트워크 연결 오류: Postmark 서버에 연결할 수 없습니다.');
    }
    
    throw error;
  }
}

// 간단한 연결 테스트 (기존 호환성)
export async function testConnection(): Promise<boolean> {
  const result = await testPostmarkConnection();
  return result.success;
}

// 회원가입 인증 이메일 발송 함수
export async function sendVerificationEmail(to: string, verificationCode: string) {
  console.log('📧 [Verification Email] 회원가입 인증 이메일 발송 시작:', to);
  
  const subject = '[OKMBTI] 회원가입 인증 이메일';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #059669; padding: 15px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">OKMBTI 회원가입 인증</h1>
      </div>
      <div style="border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; padding: 20px; background-color: #f9f9f9;">
        <p style="font-size: 16px; line-height: 1.5;">안녕하세요!</p>
        <p style="font-size: 16px; line-height: 1.5;">회원가입을 완료하기 위해 아래 인증 코드를 입력해주세요.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h3 style="color: #059669; margin: 0; font-size: 24px; letter-spacing: 2px;">${verificationCode}</h3>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">이 인증 코드는 30분 동안 유효합니다.</p>
        <p style="font-size: 16px; line-height: 1.5; margin-top: 30px;">감사합니다,<br>OKMBTI 팀</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>© ${new Date().getFullYear()} OKMBTI. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmail(to, subject, htmlBody);
    console.log('✅ [Verification Email] 인증 이메일 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ [Verification Email] 인증 이메일 발송 실패:', error);
    throw error;
  }
}

// 비밀번호 재설정 이메일 발송 함수 (완전 개선)
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
  try {
    console.log('🔐 [비밀번호 재설정] 이메일 발송 프로세스 시작');
    console.log('🔐 [비밀번호 재설정] 수신자:', email);
    console.log('🔐 [비밀번호 재설정] 재설정 링크:', resetLink);
    
    // 1단계: Postmark 연결 테스트
    console.log('1️⃣ Postmark 연결 상태 확인 중...');
    const connectionTest = await testPostmarkConnection();
    if (!connectionTest.success) {
      console.error('❌ Postmark 연결 실패:', connectionTest.details);
      return false;
    }
    console.log('✅ Postmark 연결 확인됨');
    
    // 2단계: 환경 변수 체크
    const token = POSTMARK_SERVER_TOKEN;
    if (!token) {
      console.error('❌ POSTMARK_SERVER_TOKEN이 설정되지 않았습니다.');
      return false;
    }
    
    // 3단계: 이메일 데이터 준비
    const emailData = {
      From: POSTMARK_FROM_EMAIL, // verified된 이메일 사용
      To: email,
      Subject: '[OKMBTI] 비밀번호 재설정 요청',
      HtmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">OKMBTI</h1>
            <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">비밀번호 재설정</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #3b82f6;">
            <h2 style="color: #1e293b; margin-top: 0;">안녕하세요!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              OKMBTI에서 비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                비밀번호 재설정하기
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              이 링크는 <strong>24시간 후</strong>에 만료됩니다.<br>
              요청하지 않으셨다면 이 이메일을 무시해주세요.
            </p>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>보안 팁:</strong> 비밀번호는 8자 이상의 영문, 숫자, 특수문자를 조합하여 설정해주세요.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f1f5f9; border-radius: 8px;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              문의사항이 있으시면 언제든지 연락주세요.<br>
              이메일: <a href="mailto:support@okmbti.com" style="color: #3b82f6;">support@okmbti.com</a>
            </p>
          </div>
        </div>
      `,
      MessageStream: 'outbound'
    };

    console.log('📧 [비밀번호 재설정] 이메일 데이터 준비 완료:', {
      From: emailData.From,
      To: emailData.To,
      Subject: emailData.Subject,
      MessageStream: emailData.MessageStream
    });

    // 4단계: Postmark API 호출
    console.log('📤 [비밀번호 재설정] Postmark API 호출 중...');
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token
      },
      body: JSON.stringify(emailData)
    });

    console.log('📬 [비밀번호 재설정] Postmark 응답 상태:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ [비밀번호 재설정] 이메일 발송 성공!', {
        MessageID: result.MessageID,
        SubmittedAt: result.SubmittedAt,
        To: result.To
      });
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ [비밀번호 재설정] 이메일 발송 실패 상세:', {
        status: response.status,
        statusText: response.statusText,
        errorCode: errorData.ErrorCode,
        message: errorData.Message,
        fullResponse: errorData
      });
      return false;
    }
  } catch (error) {
    console.error('❌ [비밀번호 재설정] 이메일 발송 중 예외 오류:', error);
    return false;
  }
} 