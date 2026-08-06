"use client";
import React, { useState } from "react";
import { useCadStore } from "@/store/useCadStore";
import { Plus, X, Edit2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export function TabsBar() {
  const { panels, activePanelId, addPanel, switchPanel, renamePanel, deletePanel } = useCadStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [panelToDelete, setPanelToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleAdd = () => {
    const defaultName = `Design ${panels.length + 1}`;
    const name = prompt("Enter design panel name:", defaultName);
    if (name && name.trim()) {
      addPanel(name.trim());
    }
  };

  const handleRename = (id: string, currentName: string) => {
    const name = prompt("Rename design panel:", currentName);
    if (name && name.trim() && name.trim() !== currentName) {
      renamePanel(id, name.trim());
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (panels.length <= 1) return;
    setPanelToDelete({ id, name });
    setConfirmOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-1 bg-[#1e1f22] border-b border-[#2d2e32] px-4 pt-1.5 overflow-x-auto shrink-0 select-none scrollbar-none">
        <div className="flex items-end gap-1 flex-1">
          {panels.map((panel) => {
            const isActive = panel.id === activePanelId;
            return (
              <div
                key={panel.id}
                onClick={() => {
                  if (!isActive) switchPanel(panel.id);
                }}
                onDoubleClick={() => handleRename(panel.id, panel.name)}
                className={`
                  group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-medium cursor-pointer transition-colors duration-150
                  ${isActive 
                    ? "bg-[#25262b] text-white border-t border-x border-[#333] shadow-sm font-semibold" 
                    : "bg-[#18191c] text-[#8e9297] hover:bg-[#202225] hover:text-[#dbdee1] border-t border-x border-transparent"
                  }
                `}
                title="Double click to rename"
              >
                <span>{panel.name}</span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(panel.id, panel.name);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded transition-opacity duration-150"
                  title="Rename panel"
                >
                  <Edit2 size={10} />
                </button>

                {panels.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(panel.id, panel.name);
                    }}
                    className="opacity-60 hover:opacity-100 hover:text-[#ff4a4a] p-0.5 rounded transition-opacity duration-150"
                    title="Close panel"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleAdd}
            className="flex items-center justify-center p-1.5 mb-1 rounded bg-transparent hover:bg-[#202225] text-[#8e9297] hover:text-white transition-colors duration-150"
            title="Add New Design Panel"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Design Panel"
        message={`Are you sure you want to delete the design panel "${panelToDelete?.name}"? All drawing data in it will be lost.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (panelToDelete) {
            deletePanel(panelToDelete.id);
          }
          setConfirmOpen(false);
          setPanelToDelete(null);
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setPanelToDelete(null);
        }}
      />
    </>
  );
}
