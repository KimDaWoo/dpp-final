"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (symbol: string) => void;
  removeFavorite: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('stockFavorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage', error);
    }
  }, []);

  const updateLocalStorage = (updatedFavorites: string[]) => {
    try {
      localStorage.setItem('stockFavorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage', error);
    }
  };

  const addFavorite = (symbol: string) => {
    setFavorites(prevFavorites => {
      const updatedFavorites = [...prevFavorites, symbol];
      updateLocalStorage(updatedFavorites);
      return updatedFavorites;
    });
  };

  const removeFavorite = (symbol: string) => {
    setFavorites(prevFavorites => {
      const updatedFavorites = prevFavorites.filter(fav => fav !== symbol);
      updateLocalStorage(updatedFavorites);
      return updatedFavorites;
    });
  };

  const isFavorite = (symbol: string) => {
    return favorites.includes(symbol);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
