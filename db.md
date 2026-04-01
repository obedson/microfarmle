| table_name                 | column_name              | data_type                   | is_nullable | column_default                     | constraints                       |
| -------------------------- | ------------------------ | --------------------------- | ----------- | ---------------------------------- | --------------------------------- |
| analytics_cache            | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| analytics_cache            | cache_key                | character varying(255)      | NO          | null                               | UNIQUE                            |
| analytics_cache            | data                     | jsonb                       | NO          | null                               |                                   |
| analytics_cache            | expires_at               | timestamp with time zone    | NO          | null                               |                                   |
| analytics_cache            | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| audit_logs                 | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| audit_logs                 | user_id                  | uuid                        | YES         | null                               | FK → users.id                     |
| audit_logs                 | action                   | character varying(100)      | NO          | null                               |                                   |
| audit_logs                 | resource_type            | character varying(50)       | NO          | null                               |                                   |
| audit_logs                 | resource_id              | uuid                        | YES         | null                               |                                   |
| audit_logs                 | details                  | jsonb                       | YES         | null                               |                                   |
| audit_logs                 | ip_address               | character varying(45)       | YES         | null                               |                                   |
| audit_logs                 | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| booking_analytics          | property_id              | uuid                        | YES         | null                               |                                   |
| booking_analytics          | property_title           | character varying(255)      | YES         | null                               |                                   |
| booking_analytics          | owner_id                 | uuid                        | YES         | null                               |                                   |
| booking_analytics          | total_bookings           | bigint(64,0)                | YES         | null                               |                                   |
| booking_analytics          | confirmed_bookings       | bigint(64,0)                | YES         | null                               |                                   |
| booking_analytics          | cancelled_bookings       | bigint(64,0)                | YES         | null                               |                                   |
| booking_analytics          | pending_payment_bookings | bigint(64,0)                | YES         | null                               |                                   |
| booking_analytics          | pending_bookings         | bigint(64,0)                | YES         | null                               |                                   |
| booking_analytics          | completed_bookings       | bigint(64,0)                | YES         | null                               |                                   |
| booking_analytics          | total_revenue            | numeric                     | YES         | null                               |                                   |
| booking_analytics          | pending_revenue          | numeric                     | YES         | null                               |                                   |
| booking_analytics          | pending_payment_revenue  | numeric                     | YES         | null                               |                                   |
| booking_analytics          | avg_booking_duration     | numeric                     | YES         | null                               |                                   |
| booking_analytics          | cancellation_rate        | numeric                     | YES         | null                               |                                   |
| booking_analytics          | occupancy_rate           | numeric                     | YES         | null                               |                                   |
| booking_communications     | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| booking_communications     | booking_id               | uuid                        | YES         | null                               | FK → bookings.id                  |
| booking_communications     | sender_id                | uuid                        | YES         | null                               | FK → users.id                     |
| booking_communications     | recipient_id             | uuid                        | YES         | null                               | FK → users.id                     |
| booking_communications     | message_type             | character varying(50)       | NO          | null                               |                                   |
| booking_communications     | subject                  | text                        | YES         | null                               |                                   |
| booking_communications     | content                  | text                        | NO          | null                               |                                   |
| booking_communications     | read_at                  | timestamp with time zone    | YES         | null                               |                                   |
| booking_communications     | sent_at                  | timestamp with time zone    | YES         | now()                              |                                   |
| booking_communications     | media_url                | text                        | YES         | null                               |                                   |
| booking_communications     | media_type               | character varying(50)       | YES         | null                               |                                   |
| booking_status_history     | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| booking_status_history     | booking_id               | uuid                        | YES         | null                               | FK → bookings.id                  |
| booking_status_history     | old_status               | character varying(20)       | YES         | null                               |                                   |
| booking_status_history     | new_status               | character varying(20)       | NO          | null                               |                                   |
| booking_status_history     | changed_by               | uuid                        | YES         | null                               | FK → users.id                     |
| booking_status_history     | reason                   | text                        | YES         | null                               |                                   |
| booking_status_history     | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| bookings                   | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| bookings                   | property_id              | uuid                        | YES         | null                               | FK → properties.id                |
| bookings                   | farmer_id                | uuid                        | YES         | null                               | FK → users.id                     |
| bookings                   | start_date               | date                        | NO          | null                               |                                   |
| bookings                   | end_date                 | date                        | NO          | null                               |                                   |
| bookings                   | total_amount             | numeric(10,2)               | NO          | null                               |                                   |
| bookings                   | status                   | character varying(20)       | YES         | 'pending'::character varying       |                                   |
| bookings                   | payment_status           | character varying(20)       | YES         | 'pending'::character varying       |                                   |
| bookings                   | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| bookings                   | updated_at               | timestamp with time zone    | YES         | now()                              |                                   |
| bookings                   | payment_reference        | text                        | YES         | null                               |                                   |
| bookings                   | notes                    | text                        | YES         | null                               |                                   |
| bookings                   | rejection_reason         | text                        | YES         | null                               |                                   |
| bookings                   | deleted_at               | timestamp with time zone    | YES         | null                               |                                   |
| bookings                   | cancelled_by             | uuid                        | YES         | null                               | FK → users.id                     |
| bookings                   | cancelled_at             | timestamp with time zone    | YES         | null                               |                                   |
| bookings                   | payment_retry_count      | integer(32,0)               | YES         | 0                                  |                                   |
| bookings                   | payment_timeout_at       | timestamp with time zone    | YES         | null                               |                                   |
| contribution_cycles        | id                       | uuid                        | NO          | uuid_generate_v4()                 | PRIMARY KEY                       |
| contribution_cycles        | group_id                 | uuid                        | YES         | null                               | FK → groups.id                    |
| contribution_cycles        | cycle_month              | integer(32,0)               | YES         | null                               | UNIQUE                            |
| contribution_cycles        | cycle_year               | integer(32,0)               | YES         | null                               | UNIQUE                            |
| contribution_cycles        | expected_amount          | numeric(10,2)               | NO          | null                               |                                   |
| contribution_cycles        | collected_amount         | numeric(10,2)               | YES         | 0                                  |                                   |
| contribution_cycles        | outstanding_amount       | numeric(10,2)               | YES         | null                               |                                   |
| contribution_cycles        | deadline_date            | date                        | NO          | null                               |                                   |
| contribution_cycles        | status                   | character varying(20)       | YES         | 'active'::character varying        |                                   |
| contribution_cycles        | created_at               | timestamp without time zone | YES         | now()                              |                                   |
| course_videos              | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| course_videos              | course_id                | uuid                        | YES         | null                               | FK → courses.id                   |
| course_videos              | title                    | character varying(255)      | NO          | null                               |                                   |
| course_videos              | video_url                | text                        | NO          | null                               |                                   |
| course_videos              | video_platform           | character varying(20)       | YES         | null                               |                                   |
| course_videos              | duration                 | integer(32,0)               | YES         | null                               |                                   |
| course_videos              | order_index              | integer(32,0)               | YES         | 0                                  |                                   |
| course_videos              | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| courses                    | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| courses                    | title                    | text                        | NO          | null                               |                                   |
| courses                    | description              | text                        | NO          | null                               |                                   |
| courses                    | content                  | text                        | NO          | null                               |                                   |
| courses                    | duration                 | integer(32,0)               | NO          | null                               |                                   |
| courses                    | level                    | text                        | YES         | null                               |                                   |
| courses                    | category                 | text                        | NO          | null                               |                                   |
| courses                    | created_at               | timestamp without time zone | YES         | now()                              |                                   |
| courses                    | video_url                | text                        | YES         | null                               |                                   |
| courses                    | video_platform           | character varying(20)       | YES         | null                               |                                   |
| farm_records               | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| farm_records               | farmer_id                | uuid                        | NO          | null                               | FK → users.id                     |
| farm_records               | property_id              | uuid                        | YES         | null                               | FK → properties.id                |
| farm_records               | livestock_type           | character varying(50)       | NO          | null                               |                                   |
| farm_records               | livestock_count          | integer(32,0)               | NO          | 0                                  |                                   |
| farm_records               | feed_consumption         | numeric(10,2)               | NO          | 0                                  |                                   |
| farm_records               | mortality_count          | integer(32,0)               | NO          | 0                                  |                                   |
| farm_records               | expenses                 | numeric(10,2)               | NO          | 0                                  |                                   |
| farm_records               | expense_category         | character varying(100)      | YES         | null                               |                                   |
| farm_records               | notes                    | text                        | YES         | null                               |                                   |
| farm_records               | record_date              | date                        | NO          | null                               |                                   |
| farm_records               | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| farm_records               | updated_at               | timestamp with time zone    | YES         | now()                              |                                   |
| farm_records               | booking_id               | uuid                        | YES         | null                               | FK → bookings.id                  |
| group_member_action_votes  | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| group_member_action_votes  | group_id                 | uuid                        | NO          | null                               | FK → groups.id                    |
| group_member_action_votes  | target_user_id           | uuid                        | NO          | null                               | FK → users.id                     |
| group_member_action_votes  | voter_id                 | uuid                        | NO          | null                               | FK → users.id                     |
| group_member_action_votes  | action_type              | character varying(20)       | NO          | null                               | UNIQUE                            |
| group_member_action_votes  | created_at               | timestamp with time zone    | NO          | now()                              |                                   |
| group_members              | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| group_members              | group_id                 | uuid                        | YES         | null                               | FK → groups.id                    |
| group_members              | user_id                  | uuid                        | YES         | null                               | FK → users.id                     |
| group_members              | role                     | character varying(20)       | YES         | 'member'::character varying        |                                   |
| group_members              | joined_at                | timestamp with time zone    | YES         | now()                              |                                   |
| group_members              | payment_status           | character varying(20)       | YES         | 'pending'::character varying       |                                   |
| group_members              | payment_reference        | character varying(100)      | YES         | null                               | UNIQUE                            |
| group_members              | amount_paid              | numeric(10,2)               | YES         | null                               |                                   |
| group_members              | paid_at                  | timestamp without time zone | YES         | null                               |                                   |
| group_members              | member_status            | character varying(20)       | YES         | 'active'::character varying        |                                   |
| group_members              | missed_payments_count    | integer(32,0)               | YES         | 0                                  |                                   |
| group_members              | total_contributions      | numeric(10,2)               | YES         | 0                                  |                                   |
| group_members              | last_payment_date        | timestamp without time zone | YES         | null                               |                                   |
| group_virtual_accounts     | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| group_virtual_accounts     | group_id                 | uuid                        | NO          | null                               | FK → groups.id                    |
| group_virtual_accounts     | nuban                    | character varying(20)       | YES         | null                               |                                   |
| group_virtual_accounts     | bank_name                | character varying(100)      | YES         | null                               |                                   |
| group_virtual_accounts     | interswitch_ref          | character varying(100)      | YES         | null                               |                                   |
| group_virtual_accounts     | status                   | character varying(20)       | NO          | 'PENDING'::character varying       |                                   |
| group_virtual_accounts     | retry_count              | integer(32,0)               | NO          | 0                                  |                                   |
| group_virtual_accounts     | created_at               | timestamp with time zone    | NO          | now()                              |                                   |
| group_virtual_accounts     | updated_at               | timestamp with time zone    | NO          | now()                              |                                   |
| group_withdrawal_approvals | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| group_withdrawal_approvals | approval_request_id      | uuid                        | NO          | null                               | FK → group_withdrawal_requests.id |
| group_withdrawal_approvals | voter_id                 | uuid                        | NO          | null                               | FK → users.id                     |
| group_withdrawal_approvals | voted_at                 | timestamp with time zone    | NO          | now()                              |                                   |
| group_withdrawal_requests  | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| group_withdrawal_requests  | group_id                 | uuid                        | NO          | null                               | FK → groups.id                    |
| group_withdrawal_requests  | requested_by             | uuid                        | NO          | null                               | FK → users.id                     |
| group_withdrawal_requests  | target_user_id           | uuid                        | NO          | null                               | FK → users.id                     |
| group_withdrawal_requests  | amount                   | numeric(15,2)               | NO          | null                               |                                   |
| group_withdrawal_requests  | status                   | character varying(20)       | NO          | 'PENDING'::character varying       |                                   |
| group_withdrawal_requests  | failure_reason           | text                        | YES         | null                               |                                   |
| group_withdrawal_requests  | created_at               | timestamp with time zone    | NO          | now()                              |                                   |
| group_withdrawal_requests  | updated_at               | timestamp with time zone    | NO          | now()                              |                                   |
| groups                     | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| groups                     | name                     | character varying(255)      | NO          | null                               |                                   |
| groups                     | description              | text                        | YES         | null                               |                                   |
| groups                     | category                 | character varying(50)       | YES         | null                               |                                   |
| groups                     | state                    | character varying(100)      | YES         | null                               |                                   |
| groups                     | location_lat             | numeric(10,8)               | YES         | null                               |                                   |
| groups                     | location_lng             | numeric(11,8)               | YES         | null                               |                                   |
| groups                     | creator_id               | uuid                        | YES         | null                               | FK → users.id                     |
| groups                     | member_count             | integer(32,0)               | YES         | 1                                  |                                   |
| groups                     | max_members              | integer(32,0)               | YES         | 100                                |                                   |
| groups                     | is_active                | boolean                     | YES         | true                               |                                   |
| groups                     | image_url                | text                        | YES         | null                               |                                   |
| groups                     | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| groups                     | updated_at               | timestamp with time zone    | YES         | now()                              |                                   |
| groups                     | state_id                 | integer(32,0)               | YES         | null                               | FK → states.id                    |
| groups                     | lga_id                   | integer(32,0)               | YES         | null                               | FK → lgas.id                      |
| groups                     | entry_fee                | numeric(10,2)               | YES         | 0                                  |                                   |
| groups                     | contribution_enabled     | boolean                     | YES         | false                              |                                   |
| groups                     | contribution_amount      | numeric(10,2)               | YES         | null                               |                                   |
| groups                     | payment_day              | integer(32,0)               | YES         | null                               |                                   |
| groups                     | grace_period_days        | integer(32,0)               | YES         | 3                                  |                                   |
| groups                     | late_penalty_amount      | numeric(10,2)               | YES         | null                               |                                   |
| groups                     | late_penalty_type        | character varying(20)       | YES         | null                               |                                   |
| groups                     | auto_suspend_after       | integer(32,0)               | YES         | 2                                  |                                   |
| groups                     | auto_expel_after         | integer(32,0)               | YES         | 3                                  |                                   |
| groups                     | group_fund_balance       | numeric(12,2)               | YES         | 0                                  |                                   |
| groups                     | group_booking_discount   | numeric(5,2)                | YES         | 5                                  |                                   |
| lgas                       | id                       | integer(32,0)               | NO          | nextval('lgas_id_seq'::regclass)   | PRIMARY KEY                       |
| lgas                       | state_id                 | integer(32,0)               | YES         | null                               | FK → states.id                    |
| lgas                       | name                     | character varying(100)      | NO          | null                               |                                   |
| marketplace_products       | id                       | uuid                        | NO          | uuid_generate_v4()                 | PRIMARY KEY                       |
| marketplace_products       | name                     | character varying(255)      | NO          | null                               |                                   |
| marketplace_products       | description              | text                        | YES         | null                               |                                   |
| marketplace_products       | price                    | numeric(10,2)               | NO          | null                               |                                   |
| marketplace_products       | category                 | character varying(100)      | YES         | null                               |                                   |
| marketplace_products       | stock_quantity           | integer(32,0)               | YES         | 0                                  |                                   |
| marketplace_products       | image_url                | text                        | YES         | null                               |                                   |
| marketplace_products       | supplier_id              | uuid                        | YES         | null                               | FK → users.id                     |
| marketplace_products       | created_at               | timestamp with time zone    | YES         | CURRENT_TIMESTAMP                  |                                   |
| marketplace_products       | updated_at               | timestamp with time zone    | YES         | CURRENT_TIMESTAMP                  |                                   |
| marketplace_products       | unit                     | character varying(50)       | YES         | 'kg'::character varying            |                                   |
| marketplace_products       | minimum_order            | integer(32,0)               | YES         | 1                                  |                                   |
| marketplace_products       | location                 | character varying(255)      | YES         | null                               |                                   |
| marketplace_products       | images                   | jsonb                       | YES         | '[]'::jsonb                        |                                   |
| marketplace_products       | bulk_discount_rate       | numeric(5,2)                | YES         | 0                                  |                                   |
| marketplace_products       | minimum_bulk_quantity    | integer(32,0)               | YES         | 10                                 |                                   |
| member_contributions       | id                       | uuid                        | NO          | uuid_generate_v4()                 | PRIMARY KEY                       |
| member_contributions       | cycle_id                 | uuid                        | YES         | null                               | FK → contribution_cycles.id       |
| member_contributions       | member_id                | uuid                        | YES         | null                               | FK → group_members.id             |
| member_contributions       | expected_amount          | numeric(10,2)               | NO          | null                               |                                   |
| member_contributions       | paid_amount              | numeric(10,2)               | YES         | 0                                  |                                   |
| member_contributions       | penalty_amount           | numeric(10,2)               | YES         | 0                                  |                                   |
| member_contributions       | payment_status           | character varying(20)       | YES         | 'pending'::character varying       |                                   |
| member_contributions       | paid_at                  | timestamp without time zone | YES         | null                               |                                   |
| member_contributions       | payment_reference        | character varying(100)      | YES         | null                               |                                   |
| member_contributions       | is_late                  | boolean                     | YES         | false                              |                                   |
| member_contributions       | created_at               | timestamp without time zone | YES         | now()                              |                                   |
| orders                     | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| orders                     | buyer_id                 | uuid                        | NO          | null                               | FK → users.id                     |
| orders                     | product_id               | uuid                        | NO          | null                               | FK → marketplace_products.id      |
| orders                     | quantity                 | integer(32,0)               | NO          | null                               |                                   |
| orders                     | unit_price               | numeric(10,2)               | NO          | null                               |                                   |
| orders                     | total_amount             | numeric(10,2)               | NO          | null                               |                                   |
| orders                     | delivery_address         | text                        | YES         | null                               |                                   |
| orders                     | phone                    | character varying(20)       | YES         | null                               |                                   |
| orders                     | status                   | character varying(20)       | YES         | 'pending'::character varying       |                                   |
| orders                     | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| orders                     | updated_at               | timestamp with time zone    | YES         | now()                              |                                   |
| payment_receipts           | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| payment_receipts           | booking_id               | uuid                        | YES         | null                               | FK → bookings.id                  |
| payment_receipts           | payment_reference        | character varying(255)      | NO          | null                               |                                   |
| payment_receipts           | receipt_number           | character varying(100)      | NO          | null                               | UNIQUE                            |
| payment_receipts           | amount                   | numeric(10,2)               | NO          | null                               |                                   |
| payment_receipts           | currency                 | character varying(3)        | YES         | 'NGN'::character varying           |                                   |
| payment_receipts           | generated_at             | timestamp with time zone    | YES         | now()                              |                                   |
| payment_receipts           | pdf_url                  | text                        | YES         | null                               |                                   |
| payment_receipts           | qr_code                  | text                        | YES         | null                               |                                   |
| products                   | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| products                   | supplier_id              | uuid                        | NO          | null                               | FK → users.id                     |
| products                   | name                     | character varying(255)      | NO          | null                               |                                   |
| products                   | category                 | character varying(100)      | NO          | null                               |                                   |
| products                   | description              | text                        | YES         | null                               |                                   |
| products                   | price                    | numeric(10,2)               | NO          | null                               |                                   |
| products                   | unit                     | character varying(50)       | NO          | null                               |                                   |
| products                   | stock_quantity           | integer(32,0)               | YES         | 0                                  |                                   |
| products                   | minimum_order            | integer(32,0)               | YES         | 1                                  |                                   |
| products                   | images                   | ARRAY                       | YES         | null                               |                                   |
| products                   | location                 | character varying(100)      | YES         | null                               |                                   |
| products                   | is_active                | boolean                     | YES         | true                               |                                   |
| products                   | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| products                   | updated_at               | timestamp with time zone    | YES         | now()                              |                                   |
| properties                 | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| properties                 | owner_id                 | uuid                        | YES         | null                               | FK → users.id                     |
| properties                 | title                    | character varying(255)      | NO          | null                               |                                   |
| properties                 | description              | text                        | YES         | null                               |                                   |
| properties                 | livestock_type           | character varying(20)       | NO          | null                               |                                   |
| properties                 | space_type               | character varying(20)       | NO          | null                               |                                   |
| properties                 | size                     | numeric(10,2)               | NO          | null                               |                                   |
| properties                 | size_unit                | character varying(10)       | NO          | null                               |                                   |
| properties                 | city                     | character varying(100)      | NO          | null                               |                                   |
| properties                 | lga                      | character varying(100)      | NO          | null                               |                                   |
| properties                 | price_per_month          | numeric(10,2)               | NO          | null                               |                                   |
| properties                 | available_from           | date                        | NO          | null                               |                                   |
| properties                 | available_to             | date                        | NO          | null                               |                                   |
| properties                 | amenities                | ARRAY                       | YES         | null                               |                                   |
| properties                 | images                   | ARRAY                       | YES         | null                               |                                   |
| properties                 | is_active                | boolean                     | YES         | true                               |                                   |
| properties                 | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| properties                 | updated_at               | timestamp with time zone    | YES         | now()                              |                                   |
| refunds                    | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| refunds                    | booking_id               | uuid                        | YES         | null                               | FK → bookings.id                  |
| refunds                    | amount                   | numeric(10,2)               | NO          | null                               |                                   |
| refunds                    | reason                   | text                        | YES         | null                               |                                   |
| refunds                    | status                   | character varying(20)       | YES         | 'pending'::character varying       |                                   |
| refunds                    | payment_reference        | character varying(255)      | YES         | null                               |                                   |
| refunds                    | processed_at             | timestamp with time zone    | YES         | null                               |                                   |
| refunds                    | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| states                     | id                       | integer(32,0)               | NO          | nextval('states_id_seq'::regclass) | PRIMARY KEY                       |
| states                     | name                     | character varying(100)      | NO          | null                               | UNIQUE                            |
| states                     | code                     | character varying(10)       | NO          | null                               |                                   |
| user_progress              | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| user_progress              | user_id                  | uuid                        | YES         | null                               | FK → users.id                     |
| user_progress              | course_id                | uuid                        | YES         | null                               | FK → courses.id                   |
| user_progress              | progress                 | integer(32,0)               | YES         | 0                                  |                                   |
| user_progress              | completed                | boolean                     | YES         | false                              |                                   |
| user_progress              | completed_at             | timestamp without time zone | YES         | null                               |                                   |
| user_progress              | watch_time_seconds       | integer(32,0)               | YES         | 0                                  |                                   |
| user_progress              | last_watched_at          | timestamp without time zone | YES         | null                               |                                   |
| user_wallets               | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| user_wallets               | user_id                  | uuid                        | NO          | null                               | FK → users.id                     |
| user_wallets               | balance                  | numeric(15,2)               | NO          | 0.00                               |                                   |
| user_wallets               | status                   | character varying(20)       | NO          | 'ACTIVE'::character varying        |                                   |
| user_wallets               | created_at               | timestamp with time zone    | NO          | now()                              |                                   |
| user_wallets               | updated_at               | timestamp with time zone    | NO          | now()                              |                                   |
| users                      | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| users                      | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| users                      | email                    | character varying(255)      | NO          | null                               | UNIQUE                            |
| users                      | password                 | character varying(255)      | NO          | null                               |                                   |
| users                      | name                     | character varying(255)      | NO          | null                               |                                   |
| users                      | role                     | character varying(20)       | NO          | null                               |                                   |
| users                      | phone                    | character varying(20)       | YES         | null                               |                                   |
| users                      | created_at               | timestamp with time zone    | YES         | now()                              |                                   |
| users                      | updated_at               | timestamp with time zone    | YES         | now()                              |                                   |
| users                      | reset_token              | character varying(255)      | YES         | null                               |                                   |
| users                      | reset_token_expires      | timestamp with time zone    | YES         | null                               |                                   |
| users                      | referral_code            | character varying(20)       | YES         | null                               | UNIQUE                            |
| users                      | referred_by              | uuid                        | YES         | null                               | FK → users.id                     |
| users                      | paid_referrals_count     | integer(32,0)               | YES         | 0                                  |                                   |
| users                      | nin_number               | character varying(11)       | YES         | null                               | UNIQUE                            |
| users                      | nin_verified             | boolean                     | YES         | false                              |                                   |
| users                      | nin_full_name            | character varying(255)      | YES         | null                               |                                   |
| users                      | nin_date_of_birth        | date                        | YES         | null                               |                                   |
| users                      | nin_gender               | character varying(20)       | YES         | null                               |                                   |
| users                      | nin_address              | text                        | YES         | null                               |                                   |
| users                      | nin_phone                | character varying(20)       | YES         | null                               |                                   |
| users                      | profile_picture_url      | text                        | YES         | null                               |                                   |
| users                      | is_platform_subscriber   | boolean                     | YES         | false                              |                                   |
| users                      | subscription_paid_at     | timestamp with time zone    | YES         | null                               |                                   |
| users                      | subscription_reference   | character varying(100)      | YES         | null                               | UNIQUE                            |
| users                      | grace_period_ends_at     | timestamp with time zone    | YES         | null                               |                                   |
| wallet_transactions        | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| wallet_transactions        | wallet_id                | uuid                        | NO          | null                               | FK → user_wallets.id              |
| wallet_transactions        | source_id                | uuid                        | YES         | null                               |                                   |
| wallet_transactions        | destination_id           | uuid                        | YES         | null                               |                                   |
| wallet_transactions        | amount                   | numeric(15,2)               | NO          | null                               |                                   |
| wallet_transactions        | type                     | character varying(30)       | NO          | null                               |                                   |
| wallet_transactions        | direction                | character varying(10)       | NO          | null                               |                                   |
| wallet_transactions        | status                   | character varying(20)       | NO          | null                               |                                   |
| wallet_transactions        | reference                | character varying(100)      | NO          | null                               |                                   |
| wallet_transactions        | metadata                 | jsonb                       | YES         | null                               |                                   |
| wallet_transactions        | created_at               | timestamp with time zone    | NO          | now()                              |                                   |
| withdrawal_requests        | id                       | uuid                        | NO          | gen_random_uuid()                  | PRIMARY KEY                       |
| withdrawal_requests        | user_id                  | uuid                        | NO          | null                               | FK → users.id                     |
| withdrawal_requests        | wallet_id                | uuid                        | NO          | null                               | FK → user_wallets.id              |
| withdrawal_requests        | amount                   | numeric(15,2)               | NO          | null                               |                                   |
| withdrawal_requests        | fee_amount               | numeric(15,2)               | NO          | 0                                  |                                   |
| withdrawal_requests        | account_number           | character varying(20)       | NO          | null                               |                                   |
| withdrawal_requests        | bank_code                | character varying(10)       | NO          | null                               |                                   |
| withdrawal_requests        | account_name             | character varying(200)      | NO          | null                               |                                   |
| withdrawal_requests        | status                   | character varying(20)       | NO          | 'PENDING'::character varying       |                                   |
| withdrawal_requests        | interswitch_ref          | character varying(100)      | YES         | null                               |                                   |
| withdrawal_requests        | internal_ref             | character varying(100)      | NO          | null                               | UNIQUE                            |
| withdrawal_requests        | failure_reason           | text                        | YES         | null                               |                                   |
| withdrawal_requests        | created_at               | timestamp with time zone    | NO          | now()                              |                                   |
| withdrawal_requests        | updated_at               | timestamp with time zone    | NO          | now()                              |                                   |