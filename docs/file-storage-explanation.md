# 파일 저장 위치 및 구조 설명

## 📁 파일 저장 방식

### 1. **로컬 파일 시스템 저장 (개발 환경)**

프로젝트 루트에 `uploads/` 폴더를 만들고, 그 안에 카테고리별로 저장합니다.

```
mockup/
├── uploads/                    # 모든 업로드 파일 저장 위치
│   ├── base-products/          # 기본형 이미지 저장
│   │   ├── base-001.png
│   │   ├── base-002.jpg
│   │   └── ...
│   ├── references/             # 레퍼런스 이미지 저장
│   │   ├── ref-001.png
│   │   ├── ref-002.jpg
│   │   └── ...
│   ├── logos/                  # 사용자가 업로드한 로고
│   │   ├── logo-001.png
│   │   └── ...
│   ├── user-images/            # 사용자가 업로드한 추가 이미지
│   │   ├── img-001.png
│   │   └── ...
│   └── generated/              # AI가 생성한 시안 이미지
│       ├── design-001.png
│       ├── design-002.png
│       └── ...
```

**장점:**
- 구현이 간단함
- 추가 비용 없음
- 개발/테스트에 적합

**단점:**
- 서버 용량 제한
- 서버 재시작 시 파일 유지되지만, 서버 삭제 시 파일도 삭제됨
- 여러 서버 사용 시 파일 동기화 문제

### 2. **클라우드 스토리지 저장 (프로덕션 환경)**

AWS S3, Cloudinary, Google Cloud Storage 등에 저장하고, DB에는 URL만 저장합니다.

```
데이터베이스:
- base_products 테이블
  - image_path: "https://s3.amazonaws.com/bucket/base-products/base-001.png"
  
- references 테이블
  - image_path: "https://s3.amazonaws.com/bucket/references/ref-001.png"
```

**장점:**
- 서버와 독립적으로 파일 관리
- CDN을 통한 빠른 이미지 제공
- 확장성 좋음
- 여러 서버에서 동일한 파일 접근 가능

**단점:**
- 추가 비용 발생
- 설정이 복잡함

## 🔄 실제 저장 흐름

### 시나리오 1: 기본형 등록
```
1. 사용자가 이미지 업로드 (예: base-product.png)
2. 서버가 파일을 받음
3. 파일을 uploads/base-products/base-001.png 로 저장
4. 데이터베이스에 저장:
   {
     id: 1,
     name: "기본형 A",
     description: "원형 아크릴 응원봉",
     image_path: "uploads/base-products/base-001.png",  // 로컬 경로
     // 또는
     image_url: "https://s3.../base-001.png"  // 클라우드 URL
   }
```

### 시나리오 2: 시안 생성 시
```
1. 사용자가 로고, 이미지, 텍스트 입력
2. 서버가 기본형 ID로 DB 조회
   → 기본형 이미지 경로: uploads/base-products/base-001.png
3. 서버가 레퍼런스 ID로 DB 조회
   → 레퍼런스 이미지 경로: uploads/references/ref-001.png
4. 모든 이미지를 읽어서 Gemini API로 전송
5. AI가 생성한 이미지를 uploads/generated/design-001.png 로 저장
6. DB에 시안 정보 저장
```

## 💾 데이터베이스와의 관계

**중요:** 데이터베이스에는 **파일 경로(또는 URL)만 저장**하고, 실제 파일은 별도로 저장합니다.

```typescript
// 데이터베이스 스키마 예시
BaseProduct {
  id: number
  name: string
  description: string
  image_path: string  // "uploads/base-products/base-001.png"
  created_at: Date
}

Reference {
  id: number
  base_product_id: number
  image_path: string  // "uploads/references/ref-001.png"
  description: string
  created_at: Date
}

Design {
  id: number
  base_product_id: number
  logo_path: string      // "uploads/logos/logo-001.png"
  user_images: string[]  // ["uploads/user-images/img-001.png", ...]
  text: string
  generated_image_path: string  // "uploads/generated/design-001.png"
  created_at: Date
}
```

## 🎯 권장 사항

### 개발 단계
- **로컬 파일 시스템** 사용 (`uploads/` 폴더)
- 간단하고 빠르게 개발 가능

### 프로덕션 단계
- **클라우드 스토리지** 사용 (AWS S3, Cloudinary 등)
- 안정성과 확장성 확보

### 하이브리드 방식
- 개발: 로컬 저장
- 프로덕션: 클라우드 저장
- 코드에서 환경 변수로 전환 가능

```typescript
// 환경 변수로 저장 방식 선택
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // 'local' | 's3' | 'cloudinary'

if (STORAGE_TYPE === 'local') {
  // 로컬에 저장
  await saveToLocal(file, 'uploads/base-products/');
} else if (STORAGE_TYPE === 's3') {
  // S3에 저장
  await saveToS3(file, 'base-products/');
}
```

