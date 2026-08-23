import { weekdayOfDateStr, getTodayKST } from './date-utils'

export type FortuneResult = 'win' | 'lose' | 'draw'

export interface TodayFortune {
  keyword: string
  line: string
  note: string
  scale: number
}

const KEYWORDS: Record<number, string> = {
  1: '숨고르기',
  2: '천천히',
  3: '균형',
  4: '정돈',
  5: '한 걸음',
  6: '기운',
}

/** 눈(1~6) × 요일(일~토) — 같은 숫자여도 요일이 다르면 문장이 바뀐다 */
const WEEKDAY_LINES: Record<number, readonly string[]> = {
  1: [
    '일요일의 1. 오늘은 힘을 아끼는 날이에요.',
    '월요일의 1. 천천히 시작해도 괜찮아요.',
    '화요일의 1. 작은 숫자, 넓은 여유예요.',
    '수요일의 1. 중간 즈음, 잠시 멈춰도 돼요.',
    '목요일의 1. 서두르지 않아도 하루는 가요.',
    '금요일의 1. 주말을 앞두고 숨을 고르세요.',
    '토요일의 1. 쉬는 숫자와 잘 어울리는 하루예요.',
  ],
  2: [
    '일요일의 2. 작게 움직여도 충분해요.',
    '월요일의 2. 한 칸만 나가도 시작이에요.',
    '화요일의 2. 서두르지 않는 속도가 좋아요.',
    '수요일의 2. 중간 지점에서 숨을 고르세요.',
    '목요일의 2. 조금만 밀어 보면 돼요.',
    '금요일의 2. 무리하지 않는 금요일이 좋아요.',
    '토요일의 2. 느긋해도 되는 숫자예요.',
  ],
  3: [
    '일요일의 3. 중간 어디쯤, 무난한 하루예요.',
    '월요일의 3. 기대도 실망도 없는 출발이에요.',
    '화요일의 3. 딱 중간. 균형이 맞는 날이에요.',
    '수요일의 3. 한 주의 한가운데와 잘 맞아요.',
    '목요일의 3. 과하지도 부족하지도 않아요.',
    '금요일의 3. 무난하게 주말을 맞이해요.',
    '토요일의 3. 쉬는 날의 중간 온도예요.',
  ],
  4: [
    '일요일의 4. 차근차근 정리하기 좋은 날이에요.',
    '월요일의 4. 책상을 닦고 시작하는 기분이에요.',
    '화요일의 4. 흔들림 없이 가도 되는 숫자예요.',
    '수요일의 4. 중간을 지나 안정이 보여요.',
    '목요일의 4. 할 일을 하나씩 내려놓기 좋아요.',
    '금요일의 4. 마무리를 차분히 해도 돼요.',
    '토요일의 4. 방을 정돈하듯 하루를 두세요.',
  ],
  5: [
    '일요일의 5. 가벼운 발걸음이 잘 어울려요.',
    '월요일의 5. 한 걸음만 더 나가 보세요.',
    '화요일의 5. 오늘은 조금 더 잘 굴러가요.',
    '수요일의 5. 주 중반, 기운이 살아나요.',
    '목요일의 5. 작은 도전이 잘 붙는 날이에요.',
    '금요일의 5. 기분 좋게 한 주를 닫아도 돼요.',
    '토요일의 5. 놀이의 숫자와 가까운 하루예요.',
  ],
  6: [
    '일요일의 6. 여유 있게 품은 큰 숫자예요.',
    '월요일의 6. 한 주의 시작이 환해요.',
    '화요일의 6. 오늘은 숫자가 도와주는 날이에요.',
    '수요일의 6. 중간에도 최고점이 나와요.',
    '목요일의 6. 잘 나온 숫자를 그냥 기뻐하세요.',
    '금요일의 6. 주말을 밝게 열어 주는 눈이에요.',
    '토요일의 6. 쉬는 날의 최고점이에요.',
  ],
}

const RESULT_NOTE: Record<FortuneResult, string> = {
  win: '이긴 날이에요. 그 기분을 조금 남겨 두세요.',
  lose: '진 날이에요. 숫자는 내일 다시 굴러요.',
  draw: '비긴 날이에요. 승패 없이도 오늘은 남아요.',
}

export function getTodayFortune(
  roll: number,
  result: FortuneResult,
  dateStr: string = getTodayKST(),
): TodayFortune {
  const safeRoll = roll >= 1 && roll <= 6 ? roll : 3
  const weekday = weekdayOfDateStr(dateStr)
  const lines = WEEKDAY_LINES[safeRoll]
  return {
    keyword: KEYWORDS[safeRoll],
    line: lines[weekday] ?? lines[0],
    note: RESULT_NOTE[result],
    scale: safeRoll,
  }
}

/** 눈을 1~6칸 점로 보여 준다. 예/아니오로 미래를 단정하지 않는다. */
export function getFortuneScaleLabel(roll: number): string {
  const filled = Math.min(6, Math.max(1, roll))
  return `${'●'.repeat(filled)}${'○'.repeat(6 - filled)}`
}
