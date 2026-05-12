-- Reset browser-manual checks that were incorrectly set by automated scans or AI.
-- These checks require manual auditor verification and should never have automated status.
UPDATE check_results
SET status = 'not_checked', source = 'manual', updated_at = now()
WHERE source IN ('scan', 'ai')
  AND check_key IN ('G2', 'G4', 'G5', 'G6', 'G7', 'H6', 'H8', 'K1', 'K2', 'K3', 'K4');
