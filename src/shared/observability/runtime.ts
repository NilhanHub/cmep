import { stableHash } from "@/shared/observability/sanitize";

export type RuntimeMeta = {
  environment: string;
  appVersion: string;
  buildId: string;
  gitRevision: string;
  gitDirty: boolean;
  configFingerprint: string;
  runtime: "node" | "edge" | "browser";
};

export function getFeatureManifest() {
  return {
    localAuth: true,
    localPortal: true,
    localDeterministicAi: true,
    accountableEvidence: true,
    clientInstrumentation: true,
    localMetrics: true,
    localTraceExport: true,
  };
}

export function getRuntimeMeta(runtime: RuntimeMeta["runtime"]): RuntimeMeta {
  const environment = process.env.NODE_ENV ?? "development";
  const appVersion = process.env.npm_package_version ?? "0.1.0";
  const buildId = process.env.CMEP_BUILD_ID ?? `${environment}-local`;
  const gitRevision = process.env.CMEP_GIT_REVISION ?? "unknown";
  const gitDirty = process.env.CMEP_GIT_DIRTY === "true";
  const configFingerprint =
    process.env.CMEP_CONFIG_FINGERPRINT ??
    stableHash(
      JSON.stringify({
        environment,
        appVersion,
        appName: process.env.NEXT_PUBLIC_APP_NAME ?? "CME Platform",
        featureManifest: getFeatureManifest(),
      }),
    );

  return {
    environment,
    appVersion,
    buildId,
    gitRevision,
    gitDirty,
    configFingerprint,
    runtime,
  };
}
