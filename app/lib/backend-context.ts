import { createContext } from "react";
import type { BackendState } from "./backend";

export const BackendContext = createContext<BackendState | null>(null);
