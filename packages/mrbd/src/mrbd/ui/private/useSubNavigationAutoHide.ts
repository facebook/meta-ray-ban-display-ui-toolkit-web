/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AUTOHIDE_TIMEOUT } from './SubNavigationMetrics';
import { shouldRunSubNavigationAutoHideTimer } from './SubNavigationLayout';

export function useSubNavigationAutoHide(
  autoHide: boolean,
  isFocused: boolean,
): {
  visible: boolean;
  animated: boolean;
  setVisible: (visible: boolean, animated?: boolean) => void;
} {
  const [visibility, setVisibility] = useState({
    visible: true,
    animated: true,
  });
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideRef = useRef(autoHide);
  const isFocusedRef = useRef(isFocused);
  const autoHideGenerationRef = useRef(0);

  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const resetAutoHideTimer = useCallback(() => {
    clearAutoHideTimer();
    if (shouldRunSubNavigationAutoHideTimer(autoHideRef.current, isFocusedRef.current)) {
      const generation = autoHideGenerationRef.current;
      autoHideTimerRef.current = setTimeout(() => {
        autoHideTimerRef.current = null;
        if (
          shouldRunSubNavigationAutoHideTimer(
            autoHideRef.current,
            isFocusedRef.current,
          ) &&
          generation === autoHideGenerationRef.current
        ) {
          setVisibility({ visible: false, animated: true });
        }
      }, AUTOHIDE_TIMEOUT);
    }
  }, [clearAutoHideTimer]);

  const setVisible = useCallback((nextVisible: boolean, animated = true) => {
    setVisibility({ visible: nextVisible, animated });
    if (nextVisible) {
      resetAutoHideTimer();
    } else {
      clearAutoHideTimer();
    }
  }, [clearAutoHideTimer, resetAutoHideTimer]);

  useEffect(() => {
    autoHideRef.current = autoHide;
    autoHideGenerationRef.current += 1;
    if (!autoHide) {
      clearAutoHideTimer();
      setVisibility({ visible: true, animated: true });
    } else {
      resetAutoHideTimer();
    }
  }, [autoHide, clearAutoHideTimer, resetAutoHideTimer]);

  useEffect(() => {
    isFocusedRef.current = isFocused;
    if (isFocused) {
      setVisibility((current) => current.visible
        ? current
        : { visible: true, animated: true });
    }
    resetAutoHideTimer();
  }, [isFocused, resetAutoHideTimer]);

  useEffect(() => clearAutoHideTimer, [clearAutoHideTimer]);

  return {
    ...visibility,
    setVisible,
  };
}
