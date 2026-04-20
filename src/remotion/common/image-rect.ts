// image-rect.ts — 컴포지션 안에 이미지 종횡비에 딱 맞춘 inner box 를 계산.
//
// "cover 크롭"이 생기지 않도록 inner box 의 종횡비를 imageAspect 와 일치시킨다.
// 최소 여백(basePadding)은 보장하고, 한 축은 꽉 채우고 다른 축은 중앙에 두어 레터박스/필러박스 처리.

export interface ImageRect {
  innerW: number;
  innerH: number;
  offsetX: number;
  offsetY: number;
}

export function computeImageRect(
  compW: number,
  compH: number,
  imageAspect: number,
  basePadding = 48
): ImageRect {
  const maxW = compW - 2 * basePadding;
  const maxH = compH - 2 * basePadding;
  const maxAspect = maxW / maxH;

  let innerW: number;
  let innerH: number;
  if (imageAspect >= maxAspect) {
    // 이미지가 더 넓음 → 가로를 꽉 채우고 세로 여백 추가
    innerW = maxW;
    innerH = innerW / imageAspect;
  } else {
    // 이미지가 더 좁음 → 세로를 꽉 채우고 가로 여백 추가
    innerH = maxH;
    innerW = innerH * imageAspect;
  }
  const offsetX = (compW - innerW) / 2;
  const offsetY = (compH - innerH) / 2;
  return { innerW, innerH, offsetX, offsetY };
}
