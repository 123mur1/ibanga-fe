"use client";

import ProfilePage from "@/components/profile-form";
import { VerificationSection } from "@/features/verification/verification-section";

export default function OwnerProfile() {
  return (
    <ProfilePage role="TRUCK_OWNER">
      <VerificationSection role="TRUCK_OWNER" />
    </ProfilePage>
  );
}
