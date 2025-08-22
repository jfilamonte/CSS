SELECT DISTINCT status FROM quotes WHERE status IS NOT NULL;

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'quotes_status_check';

-- Also check if there's an enum type
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'quote_status'
);
