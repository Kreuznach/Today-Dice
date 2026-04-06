import type { NextConfig } from "next";

// AIT 번들 빌드 시에만 정적 내보내기를 활성화합니다.
// `ait build` CLI는 AIT_DEPLOYMENT_ID를, 빌드 스크립트는 NEXT_BUILD_FOR_AIT를 주입합니다.
// 일반 개발(next dev) / Vercel 배포 시에는 output:'export'가 설정되지 않아
// 서버 기능이 정상 동작합니다.
const isAitBuild = !!process.env.AIT_DEPLOYMENT_ID || !!process.env.NEXT_BUILD_FOR_AIT;

const nextConfig: NextConfig = {
  ...(isAitBuild ? {
    output: 'export',
    // AIT WebView 번들에서 파일 경로를 /play/ 형태(디렉터리)로 생성합니다.
    // play.html 대신 play/index.html 을 생성하여 경로 해석 문제를 방지합니다.
    trailingSlash: true,
  } : {}),
};

export default nextConfig;
