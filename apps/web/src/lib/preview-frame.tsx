"use client";

import { createContext, type ReactNode, useContext } from "react";

const PreviewFrameContext = createContext(false);

const PreviewPortalNodeContext = createContext<HTMLElement | null>(null);

export const PreviewFrameProvider = (props: {
  children: ReactNode;
  container?: HTMLElement | null;
}) => (
  <PreviewFrameContext.Provider value={true}>
    <PreviewPortalNodeContext.Provider value={props.container ?? null}>
      {props.children}
    </PreviewPortalNodeContext.Provider>
  </PreviewFrameContext.Provider>
);

export const usePreviewFrame = () => useContext(PreviewFrameContext);

export const usePreviewPortal = () => useContext(PreviewPortalNodeContext);
