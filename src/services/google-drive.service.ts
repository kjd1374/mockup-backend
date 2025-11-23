import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

export class GoogleDriveService {
  private drive: any;
  private folderId: string | null;

  constructor() {
    // Google Drive API 설정은 비동기로 처리하지 않음 (초기화 시점에만 확인)
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
  }

  /**
   * Google Drive 서비스 초기화 (비동기)
   */
  private async initialize(): Promise<void> {
    if (this.drive) {
      return; // 이미 초기화됨
    }

    console.log('[Google Drive] 초기화 시작...');
    console.log(`[Google Drive] USE_GOOGLE_DRIVE: ${process.env.USE_GOOGLE_DRIVE}`);
    
    const credentials = await this.getCredentials();
    
    if (!credentials) {
      console.warn('[Google Drive] 자격 증명이 설정되지 않았습니다. 로컬 파일 시스템을 사용합니다.');
      console.warn('[Google Drive] GOOGLE_SERVICE_ACCOUNT_KEY 환경 변수를 확인하세요.');
      return;
    }

    console.log('[Google Drive] 자격 증명 확인 완료');

    // Google Auth 생성
    let auth: any;
    
    // 서비스 계정인 경우
    if (credentials.type === 'service_account') {
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive',
        ],
      });
      console.log('[Google Drive] 서비스 계정 인증 완료');
    } else {
      // OAuth 2.0인 경우
      const oauth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret
      );
      oauth2Client.setCredentials({
        refresh_token: credentials.refresh_token,
      });
      auth = oauth2Client;
    }

    this.drive = google.drive({ version: 'v3', auth });

    console.log('[Google Drive] 서비스 초기화 완료');
  }

  /**
   * 자격 증명 가져오기
   */
  private async getCredentials(): Promise<any> {
    // 방법 1: 서비스 계정 JSON 문자열 (환경 변수에 JSON 전체를 넣기)
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        // 서비스 계정 키 형식 확인
        if (credentials.type === 'service_account' && credentials.private_key) {
          return credentials;
        }
        console.error('[Google Drive] 서비스 계정 키 형식이 올바르지 않습니다.');
        return null;
      } catch (error) {
        console.error('[Google Drive] 서비스 계정 키 파싱 실패:', error);
        return null;
      }
    }

    // 방법 2: 서비스 계정 키 파일 경로 (로컬 개발용)
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      try {
        const fs = await import('fs/promises');
        const keyFile = await fs.readFile(serviceAccountPath, 'utf-8');
        return JSON.parse(keyFile);
      } catch (error) {
        console.error('[Google Drive] 서비스 계정 키 파일 읽기 실패:', error);
        return null;
      }
    }

    // 방법 3: OAuth 2.0 클라이언트 ID/Secret (사용자 드라이브 접근용)
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      return {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      };
    }

    return null;
  }

  /**
   * 폴더 생성 또는 기존 폴더 ID 반환
   */
  private async ensureFolder(folderName: string): Promise<string> {
    // 특정 폴더 ID가 설정되어 있으면 사용
    if (this.folderId) {
      return this.folderId;
    }

    try {
      // 공유된 부모 폴더 ID 확인
      const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
      
      if (!parentFolderId) {
        const errorMsg = `GOOGLE_DRIVE_PARENT_FOLDER_ID 환경 변수가 설정되지 않았습니다. 서비스 계정은 저장 공간이 없으므로, 다음 단계를 따라주세요:
1. Google Drive에서 폴더 생성
2. 폴더를 서비스 계정 이메일(${process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).client_email : '확인 필요'})에 공유 (편집자 권한)
3. 폴더 URL에서 폴더 ID 추출 (예: https://drive.google.com/drive/folders/1ABC123... → 1ABC123...)
4. Render 환경 변수에 GOOGLE_DRIVE_PARENT_FOLDER_ID = <폴더 ID> 추가`;
        
        console.error(`[Google Drive] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      console.log(`[Google Drive] 공유 폴더 사용: ${parentFolderId}`);

      // 공유된 폴더 내에서 기존 폴더 검색
      const response = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      if (response.data.files && response.data.files.length > 0) {
        const foundFolderId = response.data.files[0].id;
        console.log(`[Google Drive] 기존 폴더 찾음: ${folderName} (ID: ${foundFolderId})`);
        return foundFolderId;
      }

      // 공유된 폴더 내에 하위 폴더 생성
      console.log(`[Google Drive] 폴더 생성 시도: ${folderName} (부모: ${parentFolderId})`);
      
      try {
        const folderResponse = await this.drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
          },
          fields: 'id',
          supportsAllDrives: true,
        });

        const createdFolderId = folderResponse.data.id;
        console.log(`[Google Drive] 폴더 생성 완료: ${folderName} (ID: ${createdFolderId})`);
        return createdFolderId;
      } catch (createError: any) {
        console.error(`[Google Drive] 폴더 생성 실패: ${folderName}`, createError.message);
        console.error(`[Google Drive] 폴더 생성 에러 상세:`, createError);
        
        // 권한 에러인 경우
        if (createError.message && createError.message.includes('insufficientFilePermissions')) {
          const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
            ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).client_email 
            : '확인 필요';
          throw new Error(`Google Drive 폴더 생성 실패: 서비스 계정(${serviceAccountEmail})이 폴더(${parentFolderId})에 접근할 권한이 없습니다. Google Drive에서 폴더를 서비스 계정에 공유했는지 확인하세요.`);
        }
        
        throw createError;
      }
    } catch (error: any) {
      console.error(`[Google Drive] 폴더 생성/검색 실패: ${folderName}`, error.message);
      console.error(`[Google Drive] 에러 상세:`, error);
      throw error;
    }
  }

  /**
   * 파일 업로드
   */
  async uploadFile(
    buffer: Buffer,
    folderName: string,
    fileName: string,
    mimeType: string = 'image/png'
  ): Promise<string> {
    await this.initialize();
    
    if (!this.drive) {
      throw new Error('Google Drive 서비스가 초기화되지 않았습니다.');
    }

    try {
      // 공유된 부모 폴더 ID 확인
      const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
      
      if (!parentFolderId) {
        throw new Error('GOOGLE_DRIVE_PARENT_FOLDER_ID 환경 변수가 설정되지 않았습니다.');
      }

      // 하위 폴더 생성 또는 찾기
      const folderId = await this.ensureFolder(folderName);
      
      console.log(`[Google Drive] 파일 업로드 시작: ${fileName} → 폴더 ID: ${folderId} (부모: ${parentFolderId})`);

      // 파일을 스트림으로 변환
      const stream = Readable.from(buffer);

      // 파일 업로드 (하위 폴더에 직접 업로드)
      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId], // 생성된 하위 폴더에 업로드
        },
        media: {
          mimeType,
          body: stream,
        },
        fields: 'id, webViewLink, webContentLink',
        supportsAllDrives: true, // Shared Drive 지원
      });

      const fileId = response.data.id;
      const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

      console.log(`[Google Drive] 파일 업로드 성공: ${fileName} (ID: ${fileId}, 폴더: ${folderId})`);
      
      // DB에 저장할 경로 형식: gdrive:{folderName}/{fileId}
      return `gdrive:${folderName}/${fileId}`;
    } catch (error: any) {
      console.error(`[Google Drive] 파일 업로드 실패: ${fileName}`, error.message);
      console.error(`[Google Drive] 에러 상세:`, error);
      
      // 저장 공간 에러인 경우 더 명확한 메시지 제공
      if (error.message && (error.message.includes('storage quota') || error.message.includes('insufficientFilePermissions'))) {
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
          ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).client_email 
          : '확인 필요';
        throw new Error(`Google Drive 파일 업로드 실패: 서비스 계정(${serviceAccountEmail})이 폴더에 접근할 권한이 없거나 저장 공간이 없습니다. Google Drive에서 폴더(${process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID})를 서비스 계정에 공유했는지 확인하세요. (상세: ${error.message})`);
      }
      
      throw new Error(`Google Drive 파일 업로드 실패: ${error.message}`);
    }
  }

  /**
   * 파일 다운로드
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    await this.initialize();
    
    if (!this.drive) {
      throw new Error('Google Drive 서비스가 초기화되지 않았습니다.');
    }

    try {
      // 경로 형식: gdrive:{folderName}/{fileId}
      if (!filePath.startsWith('gdrive:')) {
        throw new Error(`잘못된 Google Drive 경로 형식: ${filePath}`);
      }

      const parts = filePath.replace('gdrive:', '').split('/');
      const fileId = parts[parts.length - 1];

      // 파일 다운로드 (Shared Drive 지원)
      const response = await this.drive.files.get(
        { 
          fileId, 
          alt: 'media',
          supportsAllDrives: true,
        },
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error(`[Google Drive] 파일 다운로드 실패: ${filePath}`, error.message);
      throw new Error(`Google Drive 파일 다운로드 실패: ${error.message}`);
    }
  }

  /**
   * 파일 존재 여부 확인
   */
  async fileExists(filePath: string): Promise<boolean> {
    await this.initialize();
    
    if (!this.drive) {
      return false;
    }

    try {
      if (!filePath.startsWith('gdrive:')) {
        return false;
      }

      const parts = filePath.replace('gdrive:', '').split('/');
      const fileId = parts[parts.length - 1];

      await this.drive.files.get({ 
        fileId,
        supportsAllDrives: true,
      });
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        return false;
      }
      console.error(`[Google Drive] 파일 존재 확인 실패: ${filePath}`, error.message);
      return false;
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filePath: string): Promise<void> {
    await this.initialize();
    
    if (!this.drive) {
      throw new Error('Google Drive 서비스가 초기화되지 않았습니다.');
    }

    try {
      if (!filePath.startsWith('gdrive:')) {
        throw new Error(`잘못된 Google Drive 경로 형식: ${filePath}`);
      }

      const parts = filePath.replace('gdrive:', '').split('/');
      const fileId = parts[parts.length - 1];

      await this.drive.files.delete({ 
        fileId,
        supportsAllDrives: true,
      });
      console.log(`[Google Drive] 파일 삭제 성공: ${filePath}`);
    } catch (error: any) {
      console.error(`[Google Drive] 파일 삭제 실패: ${filePath}`, error.message);
      throw new Error(`Google Drive 파일 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 서비스 사용 가능 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return this.drive !== undefined && this.drive !== null;
  }
}

