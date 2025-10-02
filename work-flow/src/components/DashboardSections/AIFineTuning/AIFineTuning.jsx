import React, { useState } from "react";
import { MessageCircle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import SourceSelector from "./SourceSelector";
import UploadModal from "./UploadModal";

// Custom style for the subtle light blue gradient effect
const BLUE_GRADIENT_STYLE = {
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 1) 70%, rgba(173, 216, 230, 0.5) 100%)", // White to Light Blue (LightSkyBlue)
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
};

const AIFineTuning = () => {
  const [selectedSource, setSelectedSource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentItems, setContentItems] = useState([]);
  const [showFABMenu, setShowFABMenu] = useState(false);

  const handleSourceSelect = (sourceType) => {
    setSelectedSource(sourceType);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSource(null);
  };

  const handleContentSubmit = async (sourceType, data) => {
    const newItem = {
      id: Date.now(),
      type: sourceType,
      data,
      status: "processing",
      timestamp: new Date().toISOString(),
    };
    setContentItems((prev) => [...prev, newItem]);

    try {
      // Build a simple system prompt from provided sources
      let systemPrompt = "";
      if (sourceType === "text")
        systemPrompt = String(data?.text || "").slice(0, 4000);
      if (sourceType === "url")
        systemPrompt = `Use knowledge from: ${(data?.urls || [])
          .filter(Boolean)
          .join(", ")}`;
      if (sourceType === "qa") {
        const pairs = (data?.qaItems || [])
          .map((q) => `Q: ${q?.question}\nA: ${q?.answer}`)
          .join("\n\n");
        systemPrompt = `Key Q&A:\n${pairs}`.slice(0, 4000);
      }
      if (sourceType === "file")
        systemPrompt =
          "Files uploaded; summarize and use their content for responses.";

      const API = import.meta.env.VITE_API_BASE || "";
      const profileId = "default"; // you can replace with actual selected profile later
      await fetch(`${API}/api/profiles/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          systemPrompt,
          sources: [{ type: sourceType, data }],
        }),
      });

      setContentItems((prev) =>
        prev.map((item) =>
          item.id === newItem.id ? { ...item, status: "completed" } : item
        )
      );
    } catch (e) {
      setContentItems((prev) =>
        prev.map((item) =>
          item.id === newItem.id ? { ...item, status: "error" } : item
        )
      );
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "file":
        return "File Upload";
      case "url":
        return "URL";
      case "text":
        return "Plain Text";
      case "qa":
        return "Q&A";
      default:
        return "Content";
    }
  };

  return (
    <div className="h-full w-full">
      {/* Main container with blue gradient */}
      <div
        className="rounded-xl shadow-sm h-full flex flex-col"
        style={BLUE_GRADIENT_STYLE}
      >
        {/* Header - Background will be inherited from the parent div's style */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">AI Fine-Tuning</h2>
          <p className="text-gray-600 mt-1">
            Train your AI with custom content sources
          </p>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {contentItems.length === 0 ? (
            // Empty State with Source Selector
            <div className="p-6 h-full flex items-center justify-center">
              <SourceSelector onSourceSelect={handleSourceSelect} />
            </div>
          ) : (
            // Content List View
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Training Content ({contentItems.length})
                </h3>
                <button
                  onClick={() => handleSourceSelect(null)} // Click to show the Source Selector
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Add More Content</span>
                </button>
              </div>

              {/* Content Items Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contentItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg p-4 border border-gray-200 transition-shadow duration-300 hover:shadow-lg"
                    style={BLUE_GRADIENT_STYLE}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">
                        {getTypeLabel(item.type)}
                      </span>
                      {getStatusIcon(item.status)}
                    </div>

                    <div className="text-sm text-gray-600">
                      {item.type === "file" && (
                        <span>{item.data.files?.length || 0} file(s)</span>
                      )}
                      {item.type === "url" && (
                        <span>
                          {item.data.urls?.filter((url) => url.trim()).length ||
                            0}{" "}
                          URL(s)
                        </span>
                      )}
                      {item.type === "text" && (
                        <span>{item.data.text?.length || 0} characters</span>
                      )}
                      {item.type === "qa" && (
                        <span>
                          {item.data.qaItems?.length || 0} Q&A pair(s)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Content Button (Centered) - Replaced with button showing SourceSelector */}
              {/* <div className="mt-12 text-center">
                <SourceSelector onSourceSelect={handleSourceSelect} />
              </div> */}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal - Outside the main container */}
      <UploadModal
        sourceType={selectedSource}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleContentSubmit}
      />
    </div>
  );
};

export default AIFineTuning;
