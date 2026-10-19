"use client";

import ProfilePage from "@/components/profile-form";
import { VerificationSection } from "@/features/verification/verification-section";

export default function ImporterProfile() {
  return (
    <ProfilePage role="IMPORTER">
      <VerificationSection role="IMPORTER" />
    </ProfilePage>
  );
}
