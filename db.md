| column_name       | data_type                | character_maximum_length | is_nullable | column_default               |
| ----------------- | ------------------------ | ------------------------ | ----------- | ---------------------------- |
| id                | uuid                     | null                     | NO          | gen_random_uuid()            |
| property_id       | uuid                     | null                     | YES         | null                         |
| farmer_id         | uuid                     | null                     | YES         | null                         |
| start_date        | date                     | null                     | NO          | null                         |
| end_date          | date                     | null                     | NO          | null                         |
| total_amount      | numeric                  | null                     | NO          | null                         |
| status            | character varying        | 20                       | YES         | 'pending'::character varying |
| payment_status    | character varying        | 20                       | YES         | 'pending'::character varying |
| created_at        | timestamp with time zone | null                     | YES         | now()                        |
| updated_at        | timestamp with time zone | null                     | YES         | now()                        |
| payment_reference | text                     | null                     | YES         | null                         |
| notes             | text                     | null                     | YES         | null                         |
| rejection_reason  | text                     | null                     | YES         | null                         |