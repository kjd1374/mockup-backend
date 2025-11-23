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
          
          // 프론트엔드에서 쉽게 사용할 수 있도록 전체 URL을 반환
          resolve(result.secure_url);
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
      // URL에서 이미지 데이터 가져오기
      const response = await fetch(filePath);
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
      // URL이 유효한지 HEAD 요청으로 확인
      const response = await fetch(filePath, { method: 'HEAD' });
      return response.ok;
    } catch (error: any) {
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
      // URL에서 public_id 추출 필요 (구현 복잡성 증가)
      // 예: https://res.cloudinary.com/demo/image/upload/v1234567890/mockup/base-products/sample.jpg
      // -> mockup/base-products/sample
      
      // URL 파싱하여 public_id 추출
      const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
      const match = filePath.match(regex);
      
      if (match && match[1]) {
        const publicId = match[1];
        await cloudinary.uploader.destroy(publicId);
        console.log(`[Cloudinary] 파일 삭제 성공: ${publicId}`);
      } else {
        console.warn(`[Cloudinary] 파일 삭제 실패: public_id 추출 불가 (${filePath})`);
      }
    } catch (error: any) {
      console.error(`[Cloudinary] 파일 삭제 실패: ${filePath}`, error.message);
      throw new Error(`Cloudinary 파일 삭제 실패: ${error.message}`);
    }
  }
}

