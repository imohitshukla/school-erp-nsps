import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027');

  return (
    <AppContext.Provider value={{ selectedAcademicYear, setSelectedAcademicYear }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
