const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchPresets() {
  const res = await fetch(`${API_BASE}/api/presets`);
  if (!res.ok) throw new Error("Failed to load presets");
  return res.json();
}

export async function generate3DAsset(payload) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Generation failed" }));
    throw new Error(err.detail || "Generation failed");
  }
  return res.json();
}

export async function getTaskStatus(taskId) {
  const res = await fetch(`${API_BASE}/api/status/${taskId}`);
  if (!res.ok) throw new Error("Failed to fetch task status");
  return res.json();
}

export async function decimateMesh(modelId, targetFaces) {
  const res = await fetch(`${API_BASE}/api/decimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model_id: modelId,
      target_faces: parseInt(targetFaces, 10),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Decimation failed" }));
    throw new Error(err.detail || "Decimation failed");
  }
  return res.json();
}

export function getGlbUrl(modelId) {
  return `${API_BASE}/api/models/${modelId}/glb`;
}

export function getObjUrl(modelId) {
  return `${API_BASE}/api/models/${modelId}/obj`;
}

export function getTextureUrl(modelId, type) {
  return `${API_BASE}/api/models/${modelId}/textures/${type}`;
}
