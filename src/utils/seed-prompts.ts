import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedInitialPrompts() {
  try {
    const count = await prisma.simulationPrompt.count();
    if (count > 0) {
      console.log('📊 시뮬레이션 프롬프트가 이미 존재합니다. (초기화 건너뜀)');
      return;
    }

    console.log('🌱 초기 시뮬레이션 프롬프트 데이터를 생성합니다...');

    const initialPrompts = [
      {
        name: '제품 박스 디자인',
        prompt: `다음 시안 이미지를 참고하여, 시안의 컨셉과 같은 스타일의 박스(포장 박스 또는 제품 박스)를 만들고 시안과 함께 배치한 이미지를 생성해주세요.

요구사항:
- 16:9 비율의 이미지로 생성
- 시안 이미지와 동일한 컨셉의 박스를 디자인하세요
- 박스와 시안이 함께 보이도록 자연스럽게 배치하세요
- {{concept}}
- 고품질의 제품 사진 스타일로 생성
- 조명과 그림자를 자연스럽게 표현하세요`,
        isDefault: true,
      },
      {
        name: '콘서트장 착용샷 (근접)',
        prompt: `다음 시안 이미지를 참고하여, 콘서트 장에서 이 시안을 소중히 들고 있는 사람의 이미지를 생성해주세요.

요구사항:
- 16:9 비율의 이미지로 생성
- 콘서트장의 분위기(어두운 조명, 무대 조명 등)를 표현하세요
- 사람이 시안을 소중히 들고 있는 모습을 자연스럽게 표현하세요
- 시안이 조명에 비춰져 빛나는 모습을 표현하세요
- 감동적이고 따뜻한 분위기를 연출하세요
- 고품질의 사진 스타일로 생성`,
        isDefault: true,
      },
      {
        name: '콘서트장 응원 장면 (원거리)',
        prompt: `다음 시안 이미지를 참고하여, 콘서트 무대가 멀리서 작게 보이고 관객들이 모두 이 시안을 들고 가수를 응원하는 장면을 생성해주세요.

요구사항:
- 16:9 비율의 이미지로 생성
- 무대는 멀리서 작게 보이도록 구도를 잡으세요
- 관객석의 많은 사람들이 모두 같은 시안을 들고 있는 모습을 표현하세요
- 시안들이 조명에 비춰져 반짝이는 모습을 표현하세요
- 열정적이고 에너지 넘치는 콘서트 분위기를 연출하세요
- {{concept}}
- 고품질의 사진 스타일로 생성`,
        isDefault: true,
      },
    ];

    for (const p of initialPrompts) {
      await prisma.simulationPrompt.create({ data: p });
    }

    console.log('✅ 초기 시뮬레이션 프롬프트 생성 완료');
  } catch (error) {
    console.error('⚠️ 초기 데이터 시딩 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

