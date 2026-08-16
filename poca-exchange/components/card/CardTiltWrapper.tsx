"use client";

import { useRef, useState, useEffect } from "react";
import { ReactNode } from "react";

interface CardTiltWrapperProps {
  children: ReactNode;
  scale?: number;
  intensity?: number;
  className?: string;
}

/**
 * 3D 틸트 + 홀로그램 글리터 효과 래퍼 컴포넌트.
 * 마우스 위치에 따라 카드가 입체적으로 기울어지고,
 * 표면에 빛 반사 그라데이션 오버레이가 동적으로 움직입니다.
 */
export function CardTiltWrapper({
  children,
  scale = 1.02,
  intensity = 15,
  className = "",
}: CardTiltWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = e.clientX - centerX;
      const y = e.clientY - centerY;

      // 정규화 (0 ~ 1)
      const percentX = (e.clientX - rect.left) / rect.width;
      const percentY = (e.clientY - rect.top) / rect.height;

      // 3D 회전 각도 계산 (-intensity ~ intensity)
      const newRotateX = (percentY - 0.5) * intensity * -1; // Y축 회전은 역순
      const newRotateY = (percentX - 0.5) * intensity;

      setRotateX(newRotateX);
      setRotateY(newRotateY);

      // 글리터 오버레이 위치
      setGlareX(percentX * 100);
      setGlareY(percentY * 100);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      // 마우스를 떠날 때 부드럽게 원래 위치로 복귀
      setRotateX(0);
      setRotateY(0);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isHovered, intensity]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* 3D 틸트된 카드 */}
      <div
        style={{
          transform: `
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            scale(${isHovered ? scale : 1})
          `,
          transformStyle: "preserve-3d",
          transition: !isHovered ? "transform 0.5s cubic-bezier(0.23, 1, 0.320, 1)" : "transform 0s",
        }}
        className="w-full h-full"
      >
        {children}

        {/* 홀로그램 글리터 오버레이 레이어 */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
            style={{
              backgroundImage: `
                radial-gradient(
                  circle at ${glareX}% ${glareY}%,
                  rgba(255, 255, 255, 0.4) 0%,
                  rgba(255, 255, 255, 0.2) 15%,
                  rgba(255, 200, 124, 0.15) 30%,
                  transparent 50%
                )
              `,
              transition: "background-image 0.05s linear",
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* 에지 글로우 효과 (선택사항) */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: `
                radial-gradient(
                  ellipse at center,
                  transparent 0%,
                  rgba(255, 42, 85, 0.08) 40%,
                  rgba(0, 0, 0, 0.15) 100%
                )
              `,
              boxShadow: `
                0 0 20px rgba(255, 42, 85, 0.15),
                0 0 40px rgba(100, 150, 255, 0.1),
                inset 0 0 20px rgba(255, 255, 255, 0.05)
              `,
              transition: "box-shadow 0.3s ease-out",
            }}
          />
        )}
      </div>
    </div>
  );
}
