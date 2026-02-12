/**
 * 스크롤 감지 커스텀 훅
 * - 콘텐츠 스크롤 가능 여부 판단
 * - 스크롤 힌트 opacity 제어
 * - FAB 숨김/표시 애니메이션 (하단 도달 시 슬라이드 아웃)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useScrollability(offset = 8) {
    const [contentH, setContentH] = useState(0);
    const [viewH, setViewH] = useState(0);
    const scrollHintOpacity = useRef(new Animated.Value(1)).current;
    const fabOpacity = useRef(new Animated.Value(1)).current;
    const fabTranslateX = useRef(new Animated.Value(0)).current;
    const isAtTopRef = useRef(true);
    const isAtBottomRef = useRef(false);

    const isScrollable = useMemo(
        () => contentH > viewH + offset,
        [contentH, viewH, offset]
    );

    // 스크롤이 불가능해지면 FAB을 다시 보이도록 리셋
    useEffect(() => {
        if (!isScrollable && isAtBottomRef.current) {
            isAtBottomRef.current = false;
            Animated.parallel([
                Animated.timing(fabOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(fabTranslateX, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [isScrollable, fabOpacity, fabTranslateX]);

    const onScroll = useCallback(
        (event: any) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const offsetY = contentOffset.y;

            // 상단 감지 (ScrollHint용)
            const atTop = offsetY <= 2;
            if (atTop !== isAtTopRef.current) {
                isAtTopRef.current = atTop;
                Animated.timing(scrollHintOpacity, {
                    toValue: atTop ? 1 : 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            }

            // 하단 감지 (FAB용 — 우측으로 슬라이드)
            // 스크롤이 가능할 때만 바닥 감지 적용
            const canScroll = contentSize.height > layoutMeasurement.height + offset;
            const atBottom = canScroll && offsetY + layoutMeasurement.height >= contentSize.height - 10;
            if (atBottom !== isAtBottomRef.current) {
                isAtBottomRef.current = atBottom;
                Animated.parallel([
                    Animated.timing(fabOpacity, {
                        toValue: atBottom ? 0 : 1,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fabTranslateX, {
                        toValue: atBottom ? 100 : 0,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        },
        [scrollHintOpacity, fabOpacity, fabTranslateX]
    );

    return {
        isScrollable,
        onContentSizeChange: (_: number, h: number) => setContentH(h),
        onLayout: (e: any) => setViewH(e.nativeEvent.layout.height),
        scrollHintOpacity,
        fabOpacity,
        fabTranslateX,
        onScroll,
    };
}