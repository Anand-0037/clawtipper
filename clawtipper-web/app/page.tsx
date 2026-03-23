import { ActivityProvider } from "@/components/activity-context";
import { ClawtipperLanding } from "@/components/ClawtipperLanding";
import { CursorSpotlight } from "@/components/CursorSpotlight";

export default function Home() {
  return (
    <ActivityProvider>
      <CursorSpotlight />
      <ClawtipperLanding />
    </ActivityProvider>
  );
}
