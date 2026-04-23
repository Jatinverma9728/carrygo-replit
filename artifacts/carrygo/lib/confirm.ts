import { Alert, Platform } from "react-native";

type ConfirmOpts = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export function confirm(opts: ConfirmOpts): Promise<boolean> {
  if (Platform.OS === "web") {
    const text = opts.message ? `${opts.title}\n\n${opts.message}` : opts.title;
    const ok = typeof window !== "undefined" && typeof window.confirm === "function"
      ? window.confirm(text)
      : false;
    return Promise.resolve(ok);
  }
  return new Promise((resolve) => {
    Alert.alert(
      opts.title,
      opts.message,
      [
        { text: opts.cancelText ?? "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: opts.confirmText ?? "OK",
          style: opts.destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function notify(title: string, message?: string) {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(text);
    }
    return;
  }
  Alert.alert(title, message);
}
