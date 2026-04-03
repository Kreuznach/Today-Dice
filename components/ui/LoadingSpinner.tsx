export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"
      style={{ width: size, height: size }}
      aria-label="로딩 중"
    />
  )
}
