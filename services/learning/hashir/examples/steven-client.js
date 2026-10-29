// Integration example for Master's EXISTING API v1; not used by Hashir's demo.
// Configure apiBase in Steven's environment. No provider key belongs here.
export function createShowOnceClient(apiBase) {
  async function request(path, {body, token, idempotencyKey} = {}) {
    const headers = {"Content-Type": "application/json"};
    if (token) headers.Authorization = "Bearer " + token;
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const response = await fetch(apiBase + path, {method:body ? "POST" : "GET", headers, body:body ? JSON.stringify(body) : undefined});
    const value = await response.json();
    if (!response.ok) {
      const error = new Error(value.error?.message || "Request failed");
      error.code = value.error?.code; error.retryable = value.error?.retryable;
      throw error;
    }
    return value;
  }
  return {
    createLesson: source_url => request("/v1/lessons", {body:{source_url}}),
    createSession: lesson_id => request("/v1/sessions", {body:{lesson_id}}),
    progress: (session_id, token) => request(`/v1/sessions/${encodeURIComponent(session_id)}/progress`, {token}),
    history: (session_id, token) => request(`/v1/sessions/${encodeURIComponent(session_id)}/submissions`, {token}),
    // Generate idempotencyKey once for a new submission. Reuse it on a lost HTTP
    // response; inspect saved history before deliberately creating new work.
    submitPhoto: (session_id, token, {step_id, mime_type, image_base64}, idempotencyKey) => request(
      `/v1/sessions/${encodeURIComponent(session_id)}/submissions`,
      {token, idempotencyKey, body:{step_id, mime_type, image_base64}}),
  };
}
// const response = await client.submitPhoto(sessionId, token, photo, key);
// renderAssessment(response.submission.assessment);
// renderProgress(response.progress); // authoritative; never increment locally
// This API currently has no live-frame route. Agree that separately with Master.
