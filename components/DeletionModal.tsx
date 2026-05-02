import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { AlertTriangle, X } from "lucide-react";

interface DeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export const DeletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
}: DeletionModalProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [deleteInput, setDeleteInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isFinalCheck, setIsFinalCheck] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setDeleteInput("");
    setPasswordInput("");
    setIsFinalCheck(false);
    onClose();
  };

  const handleStep1 = () => {
    if (deleteInput === "DELETE") setStep(2);
  };

  const handleStep2 = () => {
    //  verify against auth context or API but here we simulate admin password check (Mock: Admin@12345)
    if (passwordInput.length > 0) setStep(3);
  };

  const handleFinal = () => {
    onConfirm();
    reset();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-red-500">
        <div className="flex items-center gap-3 text-red-600 mb-4 border-b border-red-100 dark:border-red-900 pb-4">
          <AlertTriangle size={32} />
          <h2 className="text-xl font-bold">{t("permanent_delete")}</h2>
        </div>

        <p className="mb-4 text-slate-700 dark:text-slate-300 font-medium">
          Deleting: <span className="font-bold">{title}</span>
        </p>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-400">
              {t("warning_permanent")}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {t("type_delete")}
              </label>
              <input
                className="w-full border border-red-300 rounded-lg p-2 text-red-600 font-bold tracking-wider uppercase"
                placeholder="DELETE"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={reset} className="px-4 py-2 text-slate-500">
                {t("cancel")}
              </button>
              <button
                onClick={handleStep1}
                disabled={deleteInput !== "DELETE"}
                className="bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Security Verification Required.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {t("enter_password")}
              </label>
              <input
                type="password"
                className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={reset} className="px-4 py-2 text-slate-500">
                {t("cancel")}
              </button>
              <button
                onClick={handleStep2}
                disabled={!passwordInput}
                className="bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold"
              >
                Verify
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {t("confirm_question")}
            </h3>
            <p className="text-xs text-slate-500">
              This cannot be undone by anyone.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={reset}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleFinal}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 animate-pulse"
              >
                {t("confirm_delete")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
