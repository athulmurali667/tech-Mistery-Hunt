import { createContext, useState, useEffect } from 'react';

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [team, setTeam] = useState(null);
  const [token, setToken] = useState(null);
  
  useEffect(() => {
    const savedTeam = localStorage.getItem('mystery_team');
    const savedToken = localStorage.getItem('mystery_token');
    if (savedTeam && savedToken) {
      setTeam(JSON.parse(savedTeam));
      setToken(savedToken);
    }
  }, []);

  const login = (teamData, jwtToken) => {
    setTeam(teamData);
    setToken(jwtToken);
    localStorage.setItem('mystery_team', JSON.stringify(teamData));
    localStorage.setItem('mystery_token', jwtToken);
  };

  const logout = () => {
    setTeam(null);
    setToken(null);
    localStorage.removeItem('mystery_team');
    localStorage.removeItem('mystery_token');
  };

  const updateTeam = (newData) => {
    const updated = { ...team, ...newData };
    setTeam(updated);
    localStorage.setItem('mystery_team', JSON.stringify(updated));
  };

  return (
    <GameContext.Provider value={{ team, token, login, logout, updateTeam }}>
      {children}
    </GameContext.Provider>
  );
};
