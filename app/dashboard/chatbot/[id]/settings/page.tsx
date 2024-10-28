import { Suspense } from "react";
import SettingsContent from "./SettingsContent";

// This remains a server component for data fetching
export default async function ChatbotSettings({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent chatbotId={params.id} />
    </Suspense>
  );
}
