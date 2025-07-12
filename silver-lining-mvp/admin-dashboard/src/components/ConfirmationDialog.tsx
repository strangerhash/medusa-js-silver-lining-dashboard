import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          border: 'border-red-200 dark:border-red-700'
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          border: 'border-yellow-200 dark:border-yellow-700'
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          border: 'border-blue-200 dark:border-blue-700'
        };
      default:
        return {
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          border: 'border-red-200 dark:border-red-700'
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={onClose}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
            >
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${styles.icon}`} />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-semibold leading-6 text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`inline-flex w-full justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto ${styles.button}`}
                  onClick={handleConfirm}
                >
                  {confirmText}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-xl bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0 sm:w-auto"
                  onClick={onClose}
                >
                  {cancelText}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog; 