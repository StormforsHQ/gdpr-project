-- Reset check results that were incorrectly saved as "na" by automated scans.
-- These checks either couldn't run (browser-manual checks where the banner loads
-- dynamically) or failed to access an API (gtm-api checks). In both cases "na"
-- was wrong - the check simply hasn't been completed yet.
UPDATE check_results
SET status = 'not_checked', updated_at = now()
WHERE status = 'na'
  AND source IN ('scan', 'ai')
  AND check_key IN ('G2', 'G6', 'G7', 'A3', 'A5');
