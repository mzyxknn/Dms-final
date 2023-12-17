import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router";
import { doc, onSnapshot } from "firebase/firestore";

const Middleware = ({ children }) => {
  const isLogin = auth;
  const navigation = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      if (isLogin.currentUser) {
        const docRef = doc(db, "users", isLogin.currentUser.uid);
        onSnapshot(docRef, (snapshot) => {
          const user = snapshot.data();
          if (user.role != "admin") {
            navigation("/");
          }
        });
      }

      if (!isLogin.currentUser) {
        navigation("/");
      }
    }, 1000);
  });

  return <>{children}</>;
};

export default Middleware;
