import type React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import {StoryTellingNavs } from "../../../data/NavdataLiveEditor";
// import { quoteeditornavs } from "../../../data/navdata_live_editor.tsx";
// import 


interface SidenavProps {
    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    activeSection: string;
    setActiveSection: React.Dispatch<React.SetStateAction< | "story"
    | "voice"
    | "text"
    | "background"
    | "music" >>;
}

export const StoryTellingSidePanel: React.FC<SidenavProps>=({collapsed, setCollapsed, activeSection, setActiveSection})=>{
    return (
        <div
        style={{
          width: collapsed ? "60px" : "180px",
          background: "#fff",
          borderRight: "1px solid #eee",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: "0.75rem",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </button>

        {/* Nav Items */}
        {StoryTellingNavs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key as any)}
            style={{
              padding: "1rem",
              textAlign: "left",
              border: "none",
              background: activeSection === key ? "#f5f5f5" : "transparent",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: collapsed ? "0" : "0.5rem",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            {icon}
            {!collapsed && label}
          </button>
        ))}
      </div>
    );
}

// export default SideNav;