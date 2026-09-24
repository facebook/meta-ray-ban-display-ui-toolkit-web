/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWebMcpTools } from '../../shared/webmcp';
import { findGalleryDestination, GALLERY_DESTINATIONS } from './galleryCatalog';

export function GalleryAgentTools() {
  const location = useLocation();
  const navigate = useNavigate();
  const committedPathRef = useRef(location.pathname);
  const pendingPathRef = useRef<string | null>(null);

  // Only a committed render updates what the tool treats as the current route,
  // so a navigation that never lands cannot make a later call think it did.
  useLayoutEffect(() => {
    committedPathRef.current = location.pathname;
    pendingPathRef.current = null;
  }, [location.pathname]);

  /**
   * Requests `route`, and reports the route that will actually be shown.
   *
   * A navigation already in flight has been written to history and will land,
   * so a later request cannot claim its own route opened. Rather than
   * overriding the in-flight navigation — which would leave the earlier
   * caller's already-returned result describing a route that never appears —
   * the in-flight route wins and is reported back, so no caller is told an
   * entry is open when it is not.
   */
  const openRoute = useCallback((route: string): string => {
    const pendingPath = pendingPathRef.current;
    if (pendingPath != null) {
      return pendingPath;
    }
    if (committedPathRef.current === route) {
      return route;
    }
    pendingPathRef.current = route;
    navigate(route);
    return route;
  }, [navigate]);

  const tools = useMemo(() => [{
    name: 'open_component_demo',
    description:
      'Opens a component or category in the UI Toolkit component gallery.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        component: {
          type: 'string' as const,
          description: 'Component or gallery category name.',
        },
      },
      required: ['component'],
    },
    execute: (input: Record<string, unknown>) => {
      const component = input.component;
      if (typeof component !== 'string' || component.trim().length === 0) {
        return {
          error: 'invalid_component',
          message: 'Choose a component or category to open.',
          next_action: 'Ask which component the user wants to see.',
        };
      }

      const match = findGalleryDestination(component);
      if (match.destination == null) {
        return {
          error: 'unknown_component',
          message: `No gallery entry matches ${component.trim()}.`,
          suggestions: match.suggestions,
          next_action: match.suggestions.length > 0
            ? 'Offer the suggested gallery entries.'
            : 'Ask for another component name.',
        };
      }

      const openingRoute = openRoute(match.destination.path);
      if (openingRoute !== match.destination.path) {
        const opening = GALLERY_DESTINATIONS.find(
          destination => destination.path === openingRoute,
        );
        return {
          error: 'navigation_in_progress',
          message: opening == null
            ? 'Another gallery entry is already opening.'
            : `${opening.title} is already opening.`,
          openingRoute,
          openingEntry: opening?.title,
          next_action:
            'Confirm the open gallery entry, then ask again if another is wanted.',
        };
      }
      return {
        opened: match.destination.title,
        category: match.destination.category,
        route: match.destination.path,
        next_action: 'Confirm the gallery entry is open.',
      };
    },
  }], [openRoute]);
  useWebMcpTools(tools);
  return null;
}
