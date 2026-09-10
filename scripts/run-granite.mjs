/**
 * scripts/run-granite.mjs
 *
 * ait(v3) CLI를 실행하는 래퍼 스크립트.
 * 두 가지 문제를 우회합니다:
 *
 * 1. "Failed to find Response internal state key" (console.warn)
 *    - 최신 Node.js에서 Response 폴리필이 Symbol(state) 키를 찾지 못할 때 출력되는 무해한 경고.
 *    - CLI 모듈을 import 하기 전에 console.warn 을 필터링.
 *
 * 2. DEP0190 DeprecationWarning (shell: true + args)
 *    - 이 스크립트는 --no-deprecation 플래그와 함께 실행되어야 합니다.
 *    - package.json 의 ait 스크립트에서 적용.
 */

// CLI 초기화 전에 console.warn 을 가로채 해당 노이즈만 필터링
const _warn = console.warn.bind(console);
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Failed to find Response internal state key')
  ) {
    return;
  }
  _warn(...args);
};

// ait CLI 로드 및 실행 (process.argv.slice(2) 를 그대로 사용, v3부터 bin 경로가 bin/ait.js로 변경됨)
await import('../node_modules/@apps-in-toss/web-framework/bin/ait.js');
