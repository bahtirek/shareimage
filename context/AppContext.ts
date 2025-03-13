// context/AppContext.ts
import { createContext, useContext } from 'react';

// Define the shape of our context
export interface AppContextType {
  imageData: string | null;
  setImageData: (data: string | null) => void;
  connectedUser: string | null;
  setConnectedUser: (userId: string | null) => void;
}

// Create the context with a default value
export const AppContext = createContext<AppContextType>({
  imageData: null,
  setImageData: () => {},
  connectedUser: null,
  setConnectedUser: () => {}
});

// Create a custom hook for easier context usage
export const useAppContext = () => useContext(AppContext);