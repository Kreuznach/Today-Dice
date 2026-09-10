import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * apps-in-toss.config.ts
 * Apps in Toss(WebView) 미니앱 설정 파일 (SDK v3 스키마)
 *
 * [심사 제출 전 확인 사항]
 * - 앱 아이콘/디스플레이명: SDK v3부터 config가 아닌 Toss 파트너 콘솔에서 관리 (public/app.json 참고)
 * - brand.primaryColor: 디자인 확정 후 변경 가능 (현재 placeholder)
 */
export default defineConfig({
  appName: 'today-dice',

  brand: {
    primaryColor: '#6366F1'
  },

  // next.config.ts 의 output:'export' 설정으로 next build 시 out/ 폴더 생성
  webBundleDir: 'out',

  permissions: [],

  // 내비게이션 바 뒤로가기 버튼 비활성화:
  // 앱 내 TopBar 의 단일 백버튼으로 히스토리 백 / 앱 종료를 처리합니다.
  navigationBar: {
    withBackButton: false,
  }
});
