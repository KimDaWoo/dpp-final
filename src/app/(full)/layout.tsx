// 이 레이아웃은 사이드바나 헤더 없이 오직 페이지 내용만을 렌더링합니다.
export default function FullScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
