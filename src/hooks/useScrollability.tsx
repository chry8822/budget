// useScrollability.ts
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useScrollability(offset = 8) {
    const [contentH, setContentH] = useState(0);
    const [viewH, setViewH] = useState(0);
    const scrollHintOpacity = useRef(new Animated.Value(1)).current;
    const isAtTopRef = useRef(true);

    const isScrollable = useMemo(
        () => contentH > viewH + offset,
        [contentH, viewH, offset]
    );

    const onScroll = useCallback(
        (event: any) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            const atTop = offsetY <= 2;

            if (atTop === isAtTopRef.current) {
                return;
            }

            isAtTopRef.current = atTop;
            Animated.timing(scrollHintOpacity, {
                toValue: atTop ? 1 : 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        },
        [scrollHintOpacity]
    );

    return {
        isScrollable,
        onContentSizeChange: (_: number, h: number) => setContentH(h),
        onLayout: (e: any) => setViewH(e.nativeEvent.layout.height),
        scrollHintOpacity,
        onScroll,
    };
}