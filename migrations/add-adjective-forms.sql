-- Add adjective comparative and superlative forms
ALTER TABLE words ADD COLUMN adjective_comparative TEXT; -- good -> better
ALTER TABLE words ADD COLUMN adjective_superlative TEXT; -- good -> best
