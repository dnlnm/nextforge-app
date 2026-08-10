import type { EmailOtpType } from "@supabase/supabase-js";
import { useURL } from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { Spinner, Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { supabase } from "@/lib/supabase";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getFragmentParams = (url: string | null) => {
  const fragment = url?.split("#", 2)[1];
  return new URLSearchParams(fragment ?? "");
};

interface CallbackParams {
  accessToken?: string;
  callbackError?: string;
  code?: string;
  refreshToken?: string;
  tokenHash?: string;
  type?: string;
}

const establishSession = async ({
  accessToken,
  callbackError,
  code,
  refreshToken,
  tokenHash,
  type,
}: CallbackParams) => {
  if (callbackError) {
    throw new Error(callbackError);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (error) {
      throw error;
    }
    return;
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      throw error;
    }
    return;
  }

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw new Error("This link is incomplete or has expired.");
  }
};

export default function AuthCallbackScreen() {
  const url = useURL();
  const params = useLocalSearchParams<{
    access_token?: string | string[];
    code?: string | string[];
    error_description?: string | string[];
    refresh_token?: string | string[];
    token_hash?: string | string[];
    type?: string | string[];
  }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fragmentParams = getFragmentParams(url);
  const accessToken =
    first(params.access_token) ??
    fragmentParams.get("access_token") ??
    undefined;
  const code = first(params.code);
  const callbackError =
    first(params.error_description) ??
    fragmentParams.get("error_description") ??
    undefined;
  const refreshToken =
    first(params.refresh_token) ??
    fragmentParams.get("refresh_token") ??
    undefined;
  const tokenHash = first(params.token_hash);
  const type = first(params.type);

  useEffect(() => {
    establishSession({
      accessToken,
      callbackError,
      code,
      refreshToken,
      tokenHash,
      type,
    })
      .then(() => {
        router.replace(
          type === "recovery" ? "/auth/update-password" : "/(app)"
        );
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not verify this link."
        );
      });
  }, [accessToken, callbackError, code, refreshToken, tokenHash, type]);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      {errorMessage ? (
        <>
          <Typography.Heading type="h3">Link not verified</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            {errorMessage}
          </Typography.Paragraph>
        </>
      ) : (
        <>
          <Spinner size="lg" />
          <Typography.Paragraph color="muted" type="body-sm">
            Securing your session...
          </Typography.Paragraph>
        </>
      )}
    </View>
  );
}
