import { toast as originalToast } from "sonner";

// Global flag to control notifications
const NOTIFICATIONS_ENABLED = false;

// Wrapper functions for toast notifications
export const toast = {
  success: (message: string, options?: any) => {
    if (NOTIFICATIONS_ENABLED) {
      originalToast.success(message, options);
    }
  },
  error: (message: string, options?: any) => {
    if (NOTIFICATIONS_ENABLED) {
      originalToast.error(message, options);
    }
  },
  info: (message: string, options?: any) => {
    if (NOTIFICATIONS_ENABLED) {
      originalToast.info(message, options);
    }
  },
  warning: (message: string, options?: any) => {
    if (NOTIFICATIONS_ENABLED) {
      originalToast.warning(message, options);
    }
  },
  loading: (message: string, options?: any) => {
    if (NOTIFICATIONS_ENABLED) {
      return originalToast.loading(message, options);
    }
    return null;
  },
  promise: <T,>(promise: Promise<T>, messages: any) => {
    if (NOTIFICATIONS_ENABLED) {
      return originalToast.promise(promise, messages);
    }
    return promise;
  },
  dismiss: (id?: string | number) => {
    if (NOTIFICATIONS_ENABLED) {
      originalToast.dismiss(id);
    }
  }
};

// Alternative export for useToast hook compatibility
export const useToast = () => ({
  toast: (options: { title?: string; description?: string; variant?: string; duration?: number; }) => {
    if (NOTIFICATIONS_ENABLED) {
      if (options.variant === 'destructive') {
        originalToast.error(options.title || options.description || '');
      } else {
        originalToast.success(options.title || options.description || '');
      }
    }
  }
});