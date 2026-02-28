import { findUser } from "@/data/users";
import { cookies } from "next/headers";

const PERMISSION_TEMPLATE = {
  allowUserViewFormsQuestions: false,
  allowUserViewFormsQuestionsV2: false,
} as const;

type PermissionKey = keyof typeof PERMISSION_TEMPLATE;
type PermissionResult = Record<PermissionKey, boolean>;

async function useGetUserPermissions(): Promise<PermissionResult> {
  const basePermissions: PermissionResult = { ...PERMISSION_TEMPLATE };

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("febraca_session");

  if (!sessionCookie) return basePermissions;

  try {
    const parsedSession = JSON.parse(decodeURIComponent(sessionCookie.value));
    const userID = parsedSession?.user?.id;
    if (!userID) return basePermissions;

    const user = findUser("", "", userID);
    if (!user) return basePermissions;

    for (const permission of user.permissions) {
      if (permission in basePermissions) {
        basePermissions[permission as PermissionKey] = true;
      }
    }

    return basePermissions;
  } catch (error) {
    console.error("Erro ao parsear sessão do cookie", error);
    return basePermissions;
  }
}

export default useGetUserPermissions;