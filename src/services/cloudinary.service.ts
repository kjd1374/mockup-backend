import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

export class CloudinaryService {
  private isConfigured: boolean = false;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      console.log('[Cloudinary] 서비스 설정 완료');
    } else {
      console.warn('[Cloudinary] 환경 변수가 설정되지 않았습니다 (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET).');
    }
  }

  /**
   * 서비스 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return this.isConfigured;
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
    if (!this.isConfigured) {
      throw new Error('Cloudinary 서비스가 설정되지 않았습니다.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `mockup/${folderName}`, // mockup 폴더 아래에 분류
          public_id: fileName.split('.')[0], // 확장자 제외한 파일명
          resource_type: 'auto',
          format: mimeType.split('/')[1], // 포맷 지정
        },
        (error, result) => {
          if (error) {
            console.error(`[Cloudinary] 파일 업로드 실패: ${fileName}`, error);
            reject(new Error(`Cloudinary 업로드 실패: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary 업로드 결과가 비어있습니다.'));
            return;
          }

          console.log(`[Cloudinary] 파일 업로드 성공: ${fileName} (URL: ${result.secure_url})`);
          
          // Cloudinary는 URL을 직접 저장하거나, public_id를 저장할 수 있음
          // 여기서는 식별을 위해 cloudinary 접두어 사용
          resolve(`cloudinary:${result.public_id}`);
        }
      );

      // 버퍼를 스트림으로 변환하여 업로드
      const stream = Readable.from(buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * 파일 다운로드 (URL 반환 또는 버퍼 다운로드)
   * Cloudinary는 주로 URL을 직접 사용하므로, 버퍼가 필요한 경우(AI 전송용)에만 사용
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary 서비스가 설정되지 않았습니다.');
    }

    try {
      // 형식: cloudinary:{public_id}
      const publicId = filePath.replace('cloudinary:', '');
      
      // URL 생성
      const url = cloudinary.url(publicId);
      
      // URL에서 이미지 데이터 가져오기
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      console.error(`[Cloudinary] 파일 다운로드 실패: ${filePath}`, error.message);
      throw new Error(`Cloudinary 파일 다운로드 실패: ${error.message}`);
    }
  }

  /**
   * 파일 URL 가져오기
   */
  getUrl(filePath: string): string {
    if (filePath.startsWith('http')) return filePath;
    
    if (filePath.startsWith('cloudinary:')) {
      const publicId = filePath.replace('cloudinary:', '');
      return cloudinary.url(publicId, { secure: true });
    }
    
    return filePath;
  }

  /**
   * 파일 존재 여부 확인
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      if (!filePath.startsWith('cloudinary:')) {
        return false;
      }

      const publicId = filePath.replace('cloudinary:', '');
      
      // 리소스 정보 조회로 존재 여부 확인
      await cloudinary.api.resource(publicId);
      return true;
    } catch (error: any) {
      if (error.error && error.error.http_code === 404) {
        return false;
      }
      // 404가 아닌 에러는 로그 남기고 false 반환 (안전하게)
      console.warn(`[Cloudinary] 파일 존재 확인 중 에러: ${filePath}`, error.message);
      return false;
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary 서비스가 설정되지 않았습니다.');
    }

    try {
      if (!filePath.startsWith('cloudinary:')) {
        throw new Error(`잘못된 Cloudinary 경로 형식: ${filePath}`);
      }

      const publicId = filePath.replace('cloudinary:', '');
      await cloudinary.uploader.destroy(publicId);
      console.log(`[Cloudinary] 파일 삭제 성공: ${filePath}`);
    } catch (error: any) {
      console.error(`[Cloudinary] 파일 삭제 실패: ${filePath}`, error.message);
      throw new Error(`Cloudinary 파일 삭제 실패: ${error.message}`);
    }
  }
}

