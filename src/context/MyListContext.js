import React, { createContext, useState, useContext } from "react";

const MyListContext = createContext();

export const MyListProvider = ({ children }) => {
  const [myList, setMyList] = useState([]);

  const addToList = (item) => {
    setMyList((prevList) => {
      // Check if item already exists
      if (prevList.find((listItem) => listItem.id === item.id)) {
        return prevList;
      }
      return [...prevList, item];
    });
  };

  const removeFromList = (itemId) => {
    setMyList((prevList) => prevList.filter((item) => item.id !== itemId));
  };

  const isInList = (itemId) => {
    return myList.some((item) => item.id === itemId);
  };

  return (
    <MyListContext.Provider
      value={{ myList, addToList, removeFromList, isInList }}
    >
      {children}
    </MyListContext.Provider>
  );
};

export const useMyList = () => {
  const context = useContext(MyListContext);
  if (!context) {
    throw new Error("useMyList must be used within a MyListProvider");
  }
  return context;
};
