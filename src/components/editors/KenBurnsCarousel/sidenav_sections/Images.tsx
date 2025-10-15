import React, { useEffect, useState } from "react";
import { Box, IconButton, Modal, Typography, Button } from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { ChooseUploadModalBatchRenderingKenburns } from "../../../ui/modals/ChooseUploadModalBatchRenderingKenBurns";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const KenBurnsImagesPanel: React.FC<{
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
  userUploads?: any[];
}> = ({ images, setImages, setDuration, userUploads = [] }) => {
  const [uploadingSlots, setUploadingSlots] = useState<Record<number, boolean>>({});
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // ✅ DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setDuration(images.length * 3);
  }, [images, setDuration]); // <-- whenever images changes, duration updates

  // ✅ single upload
  const handleSingleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlots((prev) => ({ ...prev, [index]: true }));

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/uploadhandler/upload-kenburns-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setImages((prev) => {
          const newImages = [...prev];
          newImages[index] = data.url;
          return newImages;
        });
         const saveResponse = await fetch('/useruploads', {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({ type: "image", url: data.url }),
          });

          if (!saveResponse.ok) {
            throw new Error(
              `Failed to save upload: ${saveResponse.status} ${await saveResponse.text()}`
            );
          }

          const saveData = await saveResponse.json();
          console.log("✅ Upload saved to DB:", saveData);
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [index]: false }));
      (e.target as HTMLInputElement).value = "";
      // setdura
    }
  };

  // ✅ remove
  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);

    if (!isNaN(oldIndex) && !isNaN(newIndex)) {
      setImages((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  // ✅ add empty slot
  const handleAddSlot = () => {
    setImages((prev) => [...prev, ""]);
  };

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        padding: "2rem",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 6px 18px rgba(12,24,48,0.06)",
        border: "1px solid #eef2ff",
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <h3 style={{ marginBottom: 0, color: "#0b63ff", flex: 1 }}>🖼️ KenBurns Images</h3>
        <IconButton onClick={() => setShowInstructions(true)} size="small" sx={{ ml: 1 }}>
          <HelpOutlineIcon />
        </IconButton>
        <Button
          variant="outlined"
          size="small"
          sx={{ ml: 2, textTransform: 'none' }}
          onClick={() => setShowUploadsModal(true)}
        >
          Select from your uploads
        </Button>
      </Box>

      {/* Instructions Modal */}
      <Modal open={showInstructions} onClose={() => setShowInstructions(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          minWidth: 320,
          borderRadius: 2,
        }}>
          <Typography variant="h6" fontWeight={700} mb={2}>How it works</Typography>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, color: '#333' }}>
            <li>Upload images one at a time.</li>
            <li>Drag and drop the slots to arrange your preferred order.</li>
            <li>Remove an image anytime.</li>
            <li>Add as many images as you like.</li>
            <li><strong style={{ color: "red" }}>Note:</strong> The template can't have zero images.</li>
          </ul>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={() => setShowInstructions(false)}>Close</Button>
          </Box>
        </Box>
      </Modal>

      {/* Select from uploads modal */}
      <ChooseUploadModalBatchRenderingKenburns
        open={showUploadsModal}
        onClose={() => setShowUploadsModal(false)}
        userUploads={userUploads}
        onSelect={(selectedImages: string[]) => {
          setImages((prev: string[]) => [
            ...prev,
            ...selectedImages.filter((img) => !prev.includes(img)),
          ]);
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((_, i) => String(i))}
          strategy={rectSortingStrategy}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {images.map((img, i) => (
              <SortableImage
                key={i}
                id={String(i)}
                img={img}
                index={i}
                uploading={!!uploadingSlots[i]}
                onUpload={handleSingleUpload}
                onRemove={handleRemove}
                disableRemove={images.length === 1}
              />
            ))}

            {/* Add slot card */}
            <div
              title="Add an image slot?"
              onClick={handleAddSlot}
              style={{
                height: 240,
                border: "2px dashed #0b63ff",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 48,
                fontWeight: 700,
                color: "#0b63ff",
                background: "#f9fbff",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#eef5ff")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#f9fbff")
              }
            >
              +
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

// Sortable image card
const SortableImage: React.FC<{
  id: string;
  img: string;
  index: number;
  uploading?: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onRemove: (index: number) => void;
  disableRemove?: boolean; // ✅ prevents removing last
}> = ({ id, img, index, uploading, onUpload, onRemove, disableRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const isEmpty = !img;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 160ms ease",
        position: "relative",
        width: "100%",
        height: 240,
        border: isEmpty ? "2px dashed #c6c9d6" : "2px solid #0b63ff",
        borderRadius: 12,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundImage: isEmpty
          ? "linear-gradient(180deg,#fff,#fafafa)"
          : `url(${img})`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* drag handle */}
      <div
        title="Change the position of this image?"
        {...attributes}
        {...listeners}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "rgba(255,255,255,0.9)",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
          cursor: "grab",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <span style={{ opacity: 0.6 }}>⠿</span>
        <span>Image {index + 1}</span>
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: 10,
          background: "rgba(255,255,255,0.92)",
          borderTop: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <input
          type="file"
          accept="image/*"
          id={`kb-upload-${index}`}
          style={{ display: "none" }}
          onChange={(e) => onUpload(e, index)}
        />

        {isEmpty ? (
          <label
            title="Upload an image"
            htmlFor={`kb-upload-${index}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              padding: "8px 10px",
              background: "#0b63ff",
              color: "white",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Upload
          </label>
        ) : (
          <>
            <label
              title="Replace image content?"
              htmlFor={`kb-upload-${index}`}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                padding: "8px 10px",
                background: "#0b63ff",
                color: "white",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Replace
            </label>

            {!disableRemove && (
              <button
                title="Remove this image slot?"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  padding: "8px 10px",
                  background: "#ff5252",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Remove
              </button>
            )}
          </>
        )}
      </div>

      {/* X button for empty slot cleanup */}
      {isEmpty && (
        <button
          title="Remove this image slot?"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,82,82,0.9)",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
            lineHeight: "1",
          }}
        >
          ✕
        </button>
      )}

      {/* slot spinner */}
      {uploading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.7)",
            pointerEvents: "none",
          }}
        >
          <Spinner />
        </div>
      )}
    </div>
  );
};

const Spinner: React.FC = () => (
  <>
    <div
      style={{
        width: 28,
        height: 28,
        border: "3px solid #e6eefc",
        borderTop: "3px solid #0b63ff",
        borderRadius: "50%",
        animation: "kb-spin 0.9s linear infinite",
      }}
    />
    <style>{`
      @keyframes kb-spin { to { transform: rotate(360deg) } }
    `}</style>
  </>
);
