
DROP POLICY IF EXISTS "Users receive only their own topic" ON realtime.messages;
CREATE POLICY "Users receive only their own topic or postgres changes"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    extension = 'postgres_changes'
    OR (SELECT realtime.topic()) = auth.uid()::text
  );
