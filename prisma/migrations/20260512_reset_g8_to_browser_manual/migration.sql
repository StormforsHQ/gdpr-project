-- G8 changed from page-scan to browser-manual.
-- Reset any scan-set status so auditors start fresh.
UPDATE check_results
SET status = 'not_checked', source = 'manual', updated_at = now()
WHERE source IN ('scan', 'ai')
  AND check_key = 'G8';
