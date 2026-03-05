/**
 * Builds a USER_CHECK_REPORT_READY webhook payload for CRA flows.
 * The user_id must match the one created during the test's /user/create step.
 */
export function buildCheckReportReadyPayload(userId: string): string {
  return JSON.stringify({
    webhook_type: 'CHECK_REPORT',
    webhook_code: 'USER_CHECK_REPORT_READY',
    user_id: userId,
  }, null, 2);
}
