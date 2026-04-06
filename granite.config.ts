import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * granite.config.ts
 * Apps in Toss(WebView) 미니앱 설정 파일
 *
 * [심사 제출 전 확인 사항]
 * - brand.icon: Toss 파트너 콘솔에서 심사용 아이콘을 업로드하고 발급된 URL로 교체 필요
 * - brand.primaryColor: 디자인 확정 후 변경 가능 (현재 placeholder)
 */
export default defineConfig({
  appName: 'today-dice',

  brand: {
    displayName: '오늘의 주사위',
    // NOTE: 심사 통과용 아이콘 업로드 후 Toss 콘솔에서 발급된 URL로 교체
    icon: 'https://placehold.co/96x96/6366F1/ffffff.png',
    primaryColor: '#6366F1',
  },

  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'node scripts/build-for-ait.mjs',
    },
  },

  // next.config.ts 의 output:'export' 설정으로 next build 시 out/ 폴더 생성
  outdir: 'out',

  permissions: [],

  // 내비게이션 바 뒤로가기 버튼 비활성화:
  // 앱 내 TopBar 의 단일 백버튼으로 히스토리 백 / 앱 종료를 처리합니다.
  navigationBar: {
    withBackButton: false,
  },
});
