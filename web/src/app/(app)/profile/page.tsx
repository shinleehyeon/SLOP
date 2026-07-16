import { redirect } from "next/navigation";
import { CURRENT_USER_ID, getUserById } from "@/lib/reels-data";

export default function MyProfileRedirect() {
  const me = getUserById(CURRENT_USER_ID)!;
  redirect(`/profile/${me.username}`);
}
