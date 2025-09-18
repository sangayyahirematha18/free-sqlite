import React, { useEffect } from 'react';
import { useDispatch } from "react-redux";
import { Routes, Route, useNavigate } from "react-router";

import Layout from './Layout';
import { handelResponse, postMessage, formatNotification  } from "./stores/rpcRequest";
import { setVsTheme } from "./stores/homeSlice";
import { devMode } from './constant';

import SqlEditor from './features/sqlEditor';

import './App.css';

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    function handleEvent() {
      window.addEventListener("message", (event) => {
        // console.log("event message:", event);
        const message = devMode ? event.detail : event.data;
        console.log("app message:", message);
        if (!message) {
          return;
        }
        if (message.notification) {
          // 通知消息
          // 路由消息
          if (message.method === "ROUTER") {
            const { router, theme } = message.data;
            console.log('router---', router);
            console.log('theme---', theme);
            router && navigate(router);
            dispatch(setVsTheme(theme));
          } else if (message.method === "CHANGE_THEME") {
            const { theme } = message.data;
            dispatch(setVsTheme(theme));
          }
        }
        if (message.response) {
          // API交互消息
          handelResponse(message);
        }
      });
    }
    handleEvent();
    postMessage(formatNotification("PAGE_STATUS", "ready"));
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
          <Route path="/" element={<SqlEditor />} />
      </Route>
    </Routes>
  );
}

export default App;
