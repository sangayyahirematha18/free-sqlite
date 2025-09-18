import React from "react";
import { useSelector} from "react-redux";
import { Outlet } from "react-router-dom";
import { ConfigProvider, theme } from 'antd';

import { vsTheme } from "./stores/homeSlice";


function Layout(props) {
    const iVsTheme = useSelector(vsTheme);
    return (
        <ConfigProvider
            theme={{
                algorithm: iVsTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}
        >
            <Outlet/>
        </ConfigProvider>
    );
}
export default Layout;