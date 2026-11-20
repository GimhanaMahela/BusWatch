// Cloudflare Turnstile has no native SDK, so its widget runs in a small WebView. The page is
// served with the website's origin as its base URL, which must be on the widget's domain list.
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { WEB_URL } from "@/api/client";

interface Props {
  siteKey: string;
  language: string;
  theme: "light" | "dark";
  /** A fresh token, or null when it expired or the check failed */
  onToken: (token: string | null) => void;
}

const page = (siteKey: string, language: string, theme: string) => `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;background:transparent;display:flex;justify-content:center}</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=start&render=explicit" async></script>
</head><body><div id="widget"></div><script>
function send(token){window.ReactNativeWebView.postMessage(JSON.stringify({token:token}))}
function start(){turnstile.render("#widget",{
  sitekey:${JSON.stringify(siteKey)},language:${JSON.stringify(language)},theme:${JSON.stringify(theme)},
  callback:function(t){send(t)},"expired-callback":function(){send(null)},"error-callback":function(){send(null)}
})}
</script></body></html>`;

export function Turnstile({ siteKey, language, theme, onToken }: Props) {
  const html = useMemo(() => page(siteKey, language, theme), [siteKey, language, theme]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const { token } = JSON.parse(event.nativeEvent.data) as { token: string | null };
      onToken(typeof token === "string" && token ? token : null);
    } catch {
      onToken(null);
    }
  };

  return (
    <View style={styles.frame}>
      <WebView
        source={{ html, baseUrl: WEB_URL }}
        onMessage={onMessage}
        originWhitelist={["*"]}
        scrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 72, overflow: "hidden" },
  webview: { backgroundColor: "transparent" },
});
