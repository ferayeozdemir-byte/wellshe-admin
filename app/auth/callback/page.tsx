import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Oturum açılıyor...</p>}>
      <CallbackClient />
    </Suspense>
  );
}
