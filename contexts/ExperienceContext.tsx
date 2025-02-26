"use client";

import { getSrcDoc } from "@/data/getSrcDoc";
import { setup } from "@/lib/code-mirror/setup";
import { baseTheme } from "@/lib/code-mirror/themes/base";
import { darkTheme } from "@/lib/code-mirror/themes/dark";
import {
  Experience,
  ExperienceContext,
  File,
  Script,
  Stylesheet,
} from "@/types/experience";
import { javascript } from "@codemirror/lang-javascript";
import { ViewUpdate } from "@codemirror/view";
import { EditorView } from "codemirror";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const DEBOUNCE_THRESHOLD = 500; // ms

const experienceContext = createContext({} as ExperienceContext);

export const ExperienceProvider = ({
  experience,
  iframeScale = 1,
  children,
}: {
  experience: Experience;
  iframeScale?: number;
  children: Readonly<ReactNode>;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [_experience, _setExperience] = useState(experience);
  const [_activeFileName, _setActiveFileName] = useState(
    experience.scripts[0].name,
  );
  const srcDoc = getSrcDoc({
    scripts: _experience.scripts,
    stylesheets: _experience.stylesheets,
  });

  const activeFile = (() => {
    switch (_activeFileName.substring(_activeFileName.lastIndexOf("."))) {
      case ".js":
        return (
          _experience.scripts.find(
            (script) => script.name === _activeFileName,
          ) || ({} as Script)
        );
      case ".css":
        return (
          _experience.stylesheets.find(
            (stylesheet) => stylesheet.name === _activeFileName,
          ) || ({} as Stylesheet)
        );
      default:
        return {} as File;
    }
  })();

  const updateActiveFile = ({ fileName }: { fileName: string }) => {
    _setActiveFileName(fileName);
  };

  const updateExperience = ({
    fileName,
    updatedFileContents,
  }: {
    fileName: string;
    updatedFileContents: string;
  }) => {
    _setExperience((prev) => {
      switch (fileName.substring(fileName.lastIndexOf("."))) {
        case ".js":
          return {
            ...prev,
            scripts: prev.scripts.map((script) =>
              script.name === fileName
                ? { ...script, contents: updatedFileContents }
                : script,
            ),
          };
        case ".css":
          return {
            ...prev,
            stylesheets: prev.stylesheets.map((stylesheet) =>
              stylesheet.name === fileName
                ? { ...stylesheet, contents: updatedFileContents }
                : stylesheet,
            ),
          };
        default:
          return prev;
      }
    });
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((v: ViewUpdate) => {
      if (v.docChanged) {
        const newCode = v.state.doc.toString();

        // Clear the previous timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Set a new timeout
        timeoutRef.current = setTimeout(() => {
          updateExperience({
            fileName: activeFile.name,
            updatedFileContents: newCode,
          });
        }, DEBOUNCE_THRESHOLD);
      }
    });

    const view = new EditorView({
      doc: activeFile.contents,
      extensions: [
        ...setup,
        javascript(),
        baseTheme,
        // ...oneDarkTheme,
        ...darkTheme,

        updateListener,
      ],
      parent: editorRef.current,
    });

    return () => view.destroy(); // Cleanup on unmount
  }, [activeFile.name]);

  return (
    <experienceContext.Provider
      value={{
        experience: _experience,
        editorRef,
        activeFile,
        srcDoc,
        iframeScale,
        updateExperience,
        updateActiveFile,
      }}
    >
      {children}
    </experienceContext.Provider>
  );
};

export const useExperience = () => {
  return useContext(experienceContext);
};
