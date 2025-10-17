import React, { useState, useRef, useEffect } from "react";
import { BackgroundVideoSelectorPanel } from "../Global/sidenav_sections/BackgroundVideoSelector";
import { MusicSelector } from "../Global/BackgroundMusic";
import { script } from "./DefaultValues";
import { RedditVideoPreview } from "../../layout/EditorPreviews/RedditTemplatePreview";
import { RedditSideNavigation } from "./Sidenav";
import { AiVoiceSelector } from "../Global/sidenav_sections/AiVoices";
import { RedditTypoGraphy } from "../Global/sidenav_sections/Typography";
import { RedditFetcherSidepanel } from "./sidenav_sections/Post";
import { defaultpanelwidth } from "../../../data/DefaultValues";
import { ExportModal } from "../../ui/modals/ExportModal";
import { TopNavWithSave } from "../../navigations/single_editors/WithSave";
import { SaveProjectModal } from "../../ui/modals/SaveModal";
import { LoadingOverlay } from "../../ui/modals/LoadingProjectModal";
import { useProjectSave } from "../../../hooks/SaveProject";
import { useParams } from "react-router-dom";
import { useVideoUpload } from "../../../hooks/uploads/HandleVideoUploads";
import { userVideos } from "../../../hooks/datafetching/UserVideos";
import toast from "react-hot-toast";

export const RedditVideoEditor: React.FC = () => {
  const { id } = useParams();

  // 🟢 States
  const [templateName, setTemplateName] = useState("🎬 Reddit Video Template");
  const [postUrl, setPostUrl] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [fetchedPost, setFetchedPost] = useState<{
    title: string;
    selftext: string;
    author?: string;
  } | null>(null);

  const defaulvalues = {
    backgroundOverlay: "rgba(0,0,0,0.6)",
    musicVolume: 0.2,
    voiceoverPath: "reddit.mp3",
  };

  const [redditData, setRedditData] = useState(script);
  const [previewSize, setPreviewSize] = useState(1);
  const [duration, setDuration] = useState(Math.ceil(script.duration) + 2);

  const [fontFamily, setFontFamily] = useState("Inter, sans-serif");
  const [fontSize, setFontSize] = useState(42);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [sentenceBgColor, setSentenceBgColor] = useState("#ff8c00");

  const [aiVoice, setAiVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [voiceoverPath, setVoiceoverPath] = useState(
    `https://remotion-backend-b2vw.onrender.com/soundeffects/reddit/voice.mp3`
  );
  const [backgroundVideo, setBackgroundVideo] = useState(
    `https://remotion-backend-b2vw.onrender.com/defaultvideos/minecraft/m1.mp4`
  );
  const [backgroundMusicPath, setBackgroundMusicPath] = useState(
    `https://remotion-backend-b2vw.onrender.com/soundeffects/bgmusic/bg11.mp3`
  );
  const [serverAudio, setServerAudio] = useState("");

  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [showSafeMargins, setShowSafeMargins] = useState(true);
  const [previewBg, setPreviewBg] = useState<"dark" | "light" | "grey">("dark");
  const [activeSection, setActiveSection] = useState<
    "post" | "voice" | "text" | "background" | "music"
  >("post");
  const [collapsed, setCollapsed] = useState(false);

  // 🟢 Export modal + loading
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "⏳ Preparing your template...",

    "🙇 Sorry for the wait, still working on it...",
    "🚀 Almost there, thanks for your patience!",
  ];
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(
      () => setMessageIndex((p) => (p + 1) % messages.length),
      10000
    );
    return () => clearInterval(interval);
  }, [isLoading]);

  // 🟢 Resizable panel
  const [panelWidth, setPanelWidth] = useState(defaultpanelwidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth =
        e.clientX - (panelRef.current?.getBoundingClientRect().left || 0);
      if (newWidth > 200 && newWidth < 600) setPanelWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const cycleBg = () => {
    if (previewBg === "dark") setPreviewBg("light");
    else if (previewBg === "light") setPreviewBg("grey");
    else setPreviewBg("dark");
  };

  // 🟢 Fetch Reddit Post
  async function fetchPost(postUrl: string) {
    try {
      setLoadingPost(true);
      setPostError(null);
      setFetchedPost(null);

      const res = await fetch(`https://remotion-backend-b2vw.onrender.com/reddit/getpost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: postUrl }),
      });
      if (!res.ok) throw new Error("Failed to fetch Reddit post");

      const data = await res.json();
      const fetched = data[0]?.data?.children[0]?.data;
      setFetchedPost({
        title: fetched.title,
        selftext: fetched.selftext,
        author: fetched.author,
      });
    } catch (err) {
      console.error("Failed to fetch post", err);
      setPostError("Could not fetch Reddit post.");
    } finally {
      setLoadingPost(false);
    }
  }

  // 🟢 Generate Voiceover + Script
  const createVoiceOverandScript = async () => {
    setIsUpdatingTemplate(true);
    if (fetchedPost) {
      try {
        const res = await fetch(`https://remotion-backend-b2vw.onrender.com/sound/reddit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fetchedPost.title,
            textcontent: fetchedPost.selftext,
            voiceid: aiVoice,
          }),
        });
        const data = await res.json();
        setRedditData(data.script);
        setVoiceoverPath(data.serverfilename);
        setServerAudio(data.serverfilename);
        setDuration(Math.ceil(data.duration) + 2);

        toast.success("Reddit post extraction successful");
      } catch (err) {
        console.error("Failed to update template ❗", err);
        alert("Template update failed, please try again.");
      } finally {
        setIsUpdatingTemplate(false);
      }
    } else {
      alert("You don't have a post yet");
    }
  };

  // 🟢 Export Handler
  const handleExport = async (format: string) => {
    setIsExporting(true);
    try {
      const response = await fetch(`https://remotion-backend-b2vw.onrender.com/generatevideo/redditvideo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceoverPath: defaulvalues.voiceoverPath,
          duration,
          fontSize,
          fontFamily,
          fontColor,
          sentenceBgColor,
          backgroundVideo,
          backgroundMusicPath,
          format,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const renderUrl = data.url;
      if (renderUrl) {
        const saveResponse = await fetch(`https://remotion-backend-b2vw.onrender.com/renders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            templateId: 10,
            outputUrl: renderUrl,
            type: format,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error(
            `Failed to save upload: ${
              saveResponse.status
            } ${await saveResponse.text()}`
          );
        }

        const saveData = await saveResponse.json();
        console.log("✅ Render saved to DB:", saveData);
      }
      setExportUrl(data.url);
      setShowModal(true);
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const {
    setProjectId,
    isSaving,
    showSaveModal,
    setShowSaveModal,
    handleSave,
    saveNewProject,
    lastSavedProps,
  } = useProjectSave({
    templateId: 10, // unique ID for Reddit
    buildProps: () => ({
      // 🔹 Full editor state (saved to DB)
      templateName,
      postUrl,
      fetchedPost,
      redditData,
      aiVoice,
      serverAudio,
      voiceoverPath: defaulvalues.voiceoverPath,
      duration,
      fontSize,
      fontFamily,
      fontColor,
      sentenceBgColor,
      backgroundVideo,
      backgroundMusicPath,
    }),
    videoEndpoint: `https://remotion-backend-b2vw.onrender.com/generatevideo/redditvideo`,

    // 👇 Filter before hitting the render API
    filterRenderProps: (props) => {
      const {
        templateName,
        postUrl,
        fetchedPost,
        redditData,
        aiVoice,
        serverAudio,
        ...renderProps
      } = props;
      return renderProps; // ✅ only what /generatevideo expects
    },
  });

  // 🟢 Load project if editing existing
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetch(`https://remotion-backend-b2vw.onrender.com/projects/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load project");
          return res.json();
        })
        .then((data) => {
          setProjectId(data.id);
          const props = data.props;
          setTemplateName(data.title);

          // 🔹 Restore all saved states
          setTemplateName(props.templateName || "My Reddit Narration Template");
          setPostUrl(props.postUrl || "");
          setFetchedPost(props.fetchedPost || null);
          setRedditData(props.redditData || script);
          setAiVoice(props.aiVoice || "21m00Tcm4TlvDq8ikWAM");
          setVoiceoverPath(
            props.serverAudio || `https://remotion-backend-b2vw.onrender.com/soundeffects/reddit/voice.mp3`
          );
          setDuration(props.duration || Math.ceil(script.duration) + 2);

          // Render-specific
          setBackgroundVideo(props.backgroundVideo);
          setBackgroundMusicPath(props.backgroundMusicPath);
          setFontFamily(props.fontFamily);
          setFontSize(props.fontSize);
          setFontColor(props.fontColor);
          setSentenceBgColor(props.sentenceBgColor);

          lastSavedProps.current = props;
        })
        .catch((err) => console.error("❌ Project load failed:", err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const {
    fetchUserVideos,
    recentVideos,
    loadingVideos,
    defaultVideos,
    getAllDefaultVideos,
    defaultvidsloading
  } = userVideos();

  useEffect(() => {
    fetchUserVideos();
    getAllDefaultVideos();
  }, []);

  // 🟢 Video Upload
  // 🟢 Use reusable video upload hook
  const { uploadVideo } = useVideoUpload();

  const handleVideoUpload = async (file: File) => {
    const result = await uploadVideo(file);
    if(result){
      setBackgroundVideo(result.url);
      fetchUserVideos();
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", flex: 1 }}>
      {isLoading && <LoadingOverlay message={messages[messageIndex]} />}

      {/* 🔹 Top Navigation */}
      <TopNavWithSave
        templateName={templateName}
        onSave={handleSave}
        onExport={handleExport}
        setTemplateName={setTemplateName}
        onOpenExport={() => setShowModal(true)}
        template={templateName}
        isSaving={isSaving}
      />

      {/* 🔹 Save Modal */}
      <SaveProjectModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={saveNewProject}
      />

      <div style={{ display: "flex", flex: 1, marginTop: "60px" }}>
        {showModal && (
          <ExportModal
            showExport={showModal}
            setShowExport={setShowModal}
            isExporting={isExporting}
            exportUrl={exportUrl}
            onExport={handleExport}
          />
        )}

        {/* 🔹 Side Navigation */}
        <RedditSideNavigation
          activeSection={activeSection}
          collapsed={collapsed}
          setActiveSection={setActiveSection}
          setCollapsed={setCollapsed}
        />

        {/* 🔹 Control Panel */}
        {!collapsed && (
          <div
            ref={panelRef}
            style={{
              width: `${panelWidth}px`,
              padding: "1rem",
              overflowY: "auto",
              background: "#fff",
              borderRight: "1px solid #eee",
              position: "relative",
              transition: isResizing ? "none" : "width 0.2s",
            }}
          >
            <div
              onMouseDown={() => setIsResizing(true)}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "6px",
                cursor: "col-resize",
                background: "#ddd",
              }}
            />

            {activeSection === "post" && (
              <RedditFetcherSidepanel
                url={postUrl}
                setUrl={setPostUrl}
                loading={loadingPost}
                error={postError}
                post={fetchedPost}
                onFetch={fetchPost}
              />
            )}

            {activeSection === "voice" && (
              <AiVoiceSelector
                isUpdatingTemplate={isUpdatingTemplate}
                onUpdateTemplate={createVoiceOverandScript}
                aiVoice={aiVoice}
                setAiVoice={setAiVoice}
              />
            )}

            {activeSection === "text" && (
              <RedditTypoGraphy
                fontColor={fontColor}
                fontFamily={fontFamily}
                fontSize={fontSize}
                sentenceBgColor={sentenceBgColor}
                setFontColor={setFontColor}
                setFontFamily={setFontFamily}
                setFontSize={setFontSize}
                setSentenceBgColor={setSentenceBgColor}
              />
            )}

            {activeSection === "background" && (
              <BackgroundVideoSelectorPanel
                bgVideo={backgroundVideo}
                setBgVideo={setBackgroundVideo}
                defaultVideos={defaultVideos}
                loadingVideos={loadingVideos}
                recentVideos={recentVideos}
                handleVideoUpload={handleVideoUpload}
                gettingDefaultVids={defaultvidsloading}
              />
            )}

            {activeSection === "music" && (
              <MusicSelector
                musicAudio={backgroundMusicPath}
                setMusicAudio={setBackgroundMusicPath}
              />
            )}
          </div>
        )}

        {/* 🔹 Preview */}
        <RedditVideoPreview
          script={redditData}
          voiceoverPath={voiceoverPath}
          duration={duration}
          previewBg={previewBg}
          cycleBg={cycleBg}
          previewScale={previewSize}
          backgroundVideo={backgroundVideo}
          backgroundMusicPath={backgroundMusicPath}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontColor={fontColor}
          sentenceBgColor={sentenceBgColor}
          backgroundOverlayColor={defaulvalues.backgroundOverlay}
          showSafeMargins={showSafeMargins}
          onPreviewScaleChange={setPreviewSize}
          onToggleSafeMargins={setShowSafeMargins}
        />
      </div>
    </div>
  );
};
